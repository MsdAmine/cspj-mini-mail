using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CspjMail.Api.Models;
using CspjMail.Api.DTOs;

namespace CspjMail.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SupportController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;
        private readonly ILogger<SupportController> _logger;

        public SupportController(CspjMiniMailDbContext context, ILogger<SupportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int? GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out var id) ? id : null;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Administrateur");
        }

        // 1. POST: api/support/tickets (Submit a new ticket)
        [HttpPost("tickets")]
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketDto dto)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized("Utilisateur non authentifié.");

            var user = await _context.Utilisateurs.FindAsync(currentUserId.Value);
            if (user == null || user.IsDeleted || !user.Actif)
            {
                return Unauthorized("Compte utilisateur introuvable ou inactif.");
            }

            // Generate Ticket Number (e.g., TICK-1001)
            var lastTicketId = await _context.SupportTickets
                .OrderByDescending(t => t.Id)
                .Select(t => (int?)t.Id)
                .FirstOrDefaultAsync() ?? 0;

            var ticketNumber = $"TICK-{1000 + lastTicketId + 1}";

            var ticket = new SupportTicket
            {
                TicketNumber = ticketNumber,
                Subject = dto.Subject.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Other" : dto.Category.Trim(),
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority.Trim(),
                Status = "Open",
                CreatedByUserId = currentUserId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SupportTickets.Add(ticket);
            await _context.SaveChangesAsync();

            // Create initial message
            if (!string.IsNullOrWhiteSpace(dto.Message))
            {
                var initialMsg = new TicketMessage
                {
                    TicketId = ticket.Id,
                    SenderId = currentUserId.Value,
                    Content = dto.Message.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.TicketMessages.Add(initialMsg);
                await _context.SaveChangesAsync();
            }

            return await GetTicketById(ticket.Id);
        }

        // 2. GET: api/support/tickets (List tickets)
        [HttpGet("tickets")]
        public async Task<IActionResult> GetTickets(
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? category = null,
            [FromQuery] string? search = null)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized("Utilisateur non authentifié.");

            var isAdmin = IsAdmin();

            var query = _context.SupportTickets
                .Include(t => t.CreatedByUser)
                    .ThenInclude(u => u.Entreprise)
                .Include(t => t.AssignedAdmin)
                .Include(t => t.Messages)
                .AsQueryable();

            // If non-admin, restrict to own tickets
            if (!isAdmin)
            {
                query = query.Where(t => t.CreatedByUserId == currentUserId.Value);
            }

            // Apply filters
            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(t => t.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(priority) && priority != "All")
            {
                query = query.Where(t => t.Priority.ToLower() == priority.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
            {
                query = query.Where(t => t.Category.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(t => 
                    t.TicketNumber.ToLower().Contains(s) || 
                    t.Subject.ToLower().Contains(s) ||
                    t.CreatedByUser.Nom.ToLower().Contains(s) ||
                    t.CreatedByUser.Prenom.ToLower().Contains(s) ||
                    t.CreatedByUser.Email.ToLower().Contains(s));
            }

            var tickets = await query
                .OrderByDescending(t => t.UpdatedAt)
                .ToListAsync();

            var dtos = tickets.Select(t => new TicketResponseDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                Subject = t.Subject,
                Category = t.Category,
                Priority = t.Priority,
                Status = t.Status,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByName = $"{t.CreatedByUser.Prenom} {t.CreatedByUser.Nom}".Trim(),
                CreatedByEmail = t.CreatedByUser.Email,
                CreatedByRole = t.CreatedByUser.Role,
                CreatedByInstitution = t.CreatedByUser.Entreprise?.Nom,
                AssignedAdminId = t.AssignedAdminId,
                AssignedAdminName = t.AssignedAdmin != null ? $"{t.AssignedAdmin.Prenom} {t.AssignedAdmin.Nom}".Trim() : null,
                AssignedAdminEmail = t.AssignedAdmin?.Email,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                MessagesCount = t.Messages.Count
            }).ToList();

            return Ok(dtos);
        }

        // 3. GET: api/support/tickets/{id} (Single ticket details)
        [HttpGet("tickets/{id:int}")]
        public async Task<IActionResult> GetTicketById(int id)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized("Utilisateur non authentifié.");

            var isAdmin = IsAdmin();

            var ticket = await _context.SupportTickets
                .Include(t => t.CreatedByUser)
                    .ThenInclude(u => u.Entreprise)
                .Include(t => t.AssignedAdmin)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return NotFound("Ticket introuvable.");

            // Permission check: regular user can only view their own ticket
            if (!isAdmin && ticket.CreatedByUserId != currentUserId.Value)
            {
                return Forbid();
            }

            var visibleMessages = ticket.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new TicketMessageDto
                {
                    Id = m.Id,
                    TicketId = m.TicketId,
                    SenderId = m.SenderId,
                    SenderName = $"{m.Sender.Prenom} {m.Sender.Nom}".Trim(),
                    SenderEmail = m.Sender.Email,
                    SenderRole = m.Sender.Role,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                }).ToList();

            var dto = new TicketResponseDto
            {
                Id = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                Subject = ticket.Subject,
                Category = ticket.Category,
                Priority = ticket.Priority,
                Status = ticket.Status,
                CreatedByUserId = ticket.CreatedByUserId,
                CreatedByName = $"{ticket.CreatedByUser.Prenom} {ticket.CreatedByUser.Nom}".Trim(),
                CreatedByEmail = ticket.CreatedByUser.Email,
                CreatedByRole = ticket.CreatedByUser.Role,
                CreatedByInstitution = ticket.CreatedByUser.Entreprise?.Nom,
                AssignedAdminId = ticket.AssignedAdminId,
                AssignedAdminName = ticket.AssignedAdmin != null ? $"{ticket.AssignedAdmin.Prenom} {ticket.AssignedAdmin.Nom}".Trim() : null,
                AssignedAdminEmail = ticket.AssignedAdmin?.Email,
                CreatedAt = ticket.CreatedAt,
                UpdatedAt = ticket.UpdatedAt,
                MessagesCount = visibleMessages.Count,
                Messages = visibleMessages
            };

            return Ok(dto);
        }

        // 4. PUT: api/support/tickets/{id}/claim (Admin takes ownership)
        [Authorize(Roles = "Administrateur")]
        [HttpPut("tickets/{id:int}/claim")]
        public async Task<IActionResult> ClaimTicket(int id)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized("Utilisateur non authentifié.");

            var ticket = await _context.SupportTickets
                .Include(t => t.AssignedAdmin)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return NotFound("Ticket introuvable.");

            // Check if already claimed by ANOTHER admin
            if (ticket.AssignedAdminId.HasValue && ticket.AssignedAdminId.Value != currentUserId.Value)
            {
                var adminName = ticket.AssignedAdmin != null 
                    ? $"{ticket.AssignedAdmin.Prenom} {ticket.AssignedAdmin.Nom}".Trim() 
                    : "un autre administrateur";
                return Conflict(new { message = $"Ce ticket a déjà été pris en charge par {adminName}." });
            }

            ticket.AssignedAdminId = currentUserId.Value;
            ticket.Status = "InProgress";
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetTicketById(ticket.Id);
        }

        // 5. POST: api/support/tickets/{id}/messages (Reply to thread)
        [HttpPost("tickets/{id:int}/messages")]
        public async Task<IActionResult> AddMessage(int id, [FromBody] CreateTicketMessageDto dto)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized("Utilisateur non authentifié.");

            var isAdmin = IsAdmin();

            var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket == null) return NotFound("Ticket introuvable.");

            // Permission check: regular user can only message on their own tickets
            if (!isAdmin && ticket.CreatedByUserId != currentUserId.Value)
            {
                return Forbid();
            }

            var msg = new TicketMessage
            {
                TicketId = ticket.Id,
                SenderId = currentUserId.Value,
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.TicketMessages.Add(msg);

            // Update ticket's UpdatedAt timestamp
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Fetch sender info for response
            var sender = await _context.Utilisateurs.FindAsync(currentUserId.Value);

            var responseDto = new TicketMessageDto
            {
                Id = msg.Id,
                TicketId = msg.TicketId,
                SenderId = msg.SenderId,
                SenderName = sender != null ? $"{sender.Prenom} {sender.Nom}".Trim() : "",
                SenderEmail = sender?.Email ?? "",
                SenderRole = sender?.Role ?? "",
                Content = msg.Content,
                CreatedAt = msg.CreatedAt
            };

            return Ok(responseDto);
        }

        // 6. PUT: api/support/tickets/{id}/status (Update status)
        [HttpPut("tickets/{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTicketStatusDto dto)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized("Utilisateur non authentifié.");

            var isAdmin = IsAdmin();

            var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket == null) return NotFound("Ticket introuvable.");

            // Permission check: regular user can update status only for their own tickets
            if (!isAdmin && ticket.CreatedByUserId != currentUserId.Value)
            {
                return Forbid();
            }

            var validStatuses = new[] { "Open", "InProgress", "Resolved", "Closed" };
            if (!validStatuses.Any(s => s.Equals(dto.Status, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest("Statut invalide. Les valeurs possibles sont : Open, InProgress, Resolved, Closed.");
            }

            // Standardize case
            var standardizedStatus = validStatuses.First(s => s.Equals(dto.Status, StringComparison.OrdinalIgnoreCase));
            ticket.Status = standardizedStatus;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetTicketById(ticket.Id);
        }
    }
}
