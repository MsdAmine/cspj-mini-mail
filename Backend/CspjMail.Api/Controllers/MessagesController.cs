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
    public class MessagesController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;

        public MessagesController(CspjMiniMailDbContext context)
        {
            _context = context;
        }

        // 1. POST: api/messages/thread (Start a new conversation)
        [HttpPost("thread")]
        public async Task<IActionResult> StartThread([FromBody] CreateThreadDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            var destinationExists = await _context.Utilisateurs.AnyAsync(u => u.Id == dto.DestinataireId);
            if (!destinationExists)
            {
                return BadRequest("The recipient user could not be found.");
            }

            var newThread = new Models.Thread
            {
                Objet = dto.Objet,
                DateCreation = DateTime.UtcNow,
                EstArchive = false
            };

            _context.Threads.Add(newThread);
            await _context.SaveChangesAsync();

            var initialMessage = new Message
            {
                ThreadId = newThread.Id,
                ExpediteurId = currentUserId,
                Corps = dto.Corps,
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };

            _context.Messages.Add(initialMessage);
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = newThread.Id, Message = "Thread created successfully." });
        }

        // 2. POST: api/messages/thread/{id}/reply (Reply inside an existing conversation)
        [HttpPost("thread/{threadId}/reply")]
        public async Task<IActionResult> ReplyToThread(int threadId, [FromBody] ReplyMessageDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            var targetThread = await _context.Threads.FindAsync(threadId);
            if (targetThread == null)
            {
                return NotFound("The targeted email thread does not exist.");
            }

            var replyMessage = new Message
            {
                ThreadId = threadId,
                ExpediteurId = currentUserId,
                Corps = dto.Corps,
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };

            _context.Messages.Add(replyMessage);
            await _context.SaveChangesAsync();

            return Ok(new { MessageId = replyMessage.Id, Message = "Reply successfully sent." });
        }

        // 3. GET: api/messages/thread/{id} (Fetch full conversation)
        [HttpGet("thread/{threadId}")]
        public async Task<IActionResult> GetThreadDetails(int threadId)
        {
            var thread = await _context.Threads
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .FirstOrDefaultAsync(t => t.Id == threadId);

            if (thread == null)
            {
                return NotFound("Thread not found.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int currentUserId))
            {
                var unreadIncomingMessages = thread.Messages
                    .Where(m => m.ExpediteurId != currentUserId && !m.EstLu);

                foreach (var msg in unreadIncomingMessages)
                {
                    msg.EstLu = true;
                }
                await _context.SaveChangesAsync();
            }

            var response = new ThreadDetailsDto
            {
                ThreadId = thread.Id,
                Objet = thread.Objet,
                DateCreation = thread.DateCreation,
                EstArchive = thread.EstArchive,
                Messages = thread.Messages
                    .OrderBy(m => m.DateEnvoi)
                    .Select(m => new MessageDisplayDto
                    {
                        MessageId = m.Id,
                        Corps = m.Corps,
                        DateEnvoi = m.DateEnvoi,
                        EstLu = m.EstLu,
                        ExpediteurId = m.ExpediteurId,
                        ExpediteurNomComplet = $"{m.Expediteur.Prenom} {m.Expediteur.Nom}",
                        ExpediteurRole = m.Expediteur.Role
                    }).ToList()
            };

            return Ok(response);
        }

        // 4. GET: api/messages/inbox (Get non-archived threads involving the user)
        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var threads = await _context.Threads
                .Where(t => !t.EstArchive && t.Messages.Any(m => m.ThreadId == t.Id))
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .ToListAsync();

            var inboxSummaries = threads
                .Select(t => {
                    var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).First();
                    return new ThreadSummaryDto
                    {
                        ThreadId = t.Id,
                        Objet = t.Objet,
                        DerniereActivite = lastMessage.DateEnvoi,
                        DernierMessageCorps = lastMessage.Corps,
                        DernierExpediteurNom = $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}",
                        ADesMessagesNonLus = t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu),
                        EstArchive = t.EstArchive
                    };
                })
                .OrderByDescending(s => s.DerniereActivite)
                .ToList();

            return Ok(inboxSummaries);
        }

        // 5. GET: api/messages/sent (Get threads initiated by the current user)
        [HttpGet("sent")]
        public async Task<IActionResult> GetSent()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var threads = await _context.Threads
                .Where(t => t.Messages.OrderBy(m => m.DateEnvoi).First().ExpediteurId == currentUserId)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .ToListAsync();

            var sentSummaries = threads.Select(t => {
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).First();
                return new ThreadSummaryDto
                {
                    ThreadId = t.Id,
                    Objet = t.Objet,
                    DerniereActivite = lastMessage.DateEnvoi,
                    DernierMessageCorps = lastMessage.Corps,
                    DernierExpediteurNom = $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}",
                    ADesMessagesNonLus = false,
                    EstArchive = t.EstArchive
                };
            })
            .OrderByDescending(s => s.DerniereActivite)
            .ToList();

            return Ok(sentSummaries);
        }

        // 6. PUT: api/messages/thread/{id}/archive (Toggle archiving state)
        [HttpPut("thread/{threadId}/archive")]
        public async Task<IActionResult> ToggleArchiveThread(int threadId)
        {
            var thread = await _context.Threads.FindAsync(threadId);
            if (thread == null) return NotFound("Thread not found.");

            thread.EstArchive = !thread.EstArchive;
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = thread.Id, EstArchive = thread.EstArchive, Message = $"Thread archive status set to {thread.EstArchive}." });
        }

        // 7. GET: api/messages/archive (Get archived threads)
        [HttpGet("archive")]
        public async Task<IActionResult> GetArchive()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var threads = await _context.Threads
                .Where(t => t.EstArchive && t.Messages.Any(m => m.ThreadId == t.Id))
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .ToListAsync();

            var archiveSummaries = threads.Select(t => {
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).First();
                return new ThreadSummaryDto
                {
                    ThreadId = t.Id,
                    Objet = t.Objet,
                    DerniereActivite = lastMessage.DateEnvoi,
                    DernierMessageCorps = lastMessage.Corps,
                    DernierExpediteurNom = $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}",
                    ADesMessagesNonLus = t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu),
                    EstArchive = t.EstArchive
                };
            })
            .OrderByDescending(s => s.DerniereActivite)
            .ToList();

            return Ok(archiveSummaries);
        }

        // 8. GET: api/messages/search?searchTerm=xyz (Search across thread objects or text bodies)
        [HttpGet("search")]
        public async Task<IActionResult> SearchMessages([FromQuery] string searchTerm)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            if (string.IsNullOrWhiteSpace(searchTerm)) return BadRequest("Search term cannot be empty.");

            var normalizedTerm = searchTerm.ToLower();

            // Find matching threads involving or visible to the user
            var matchingThreads = await _context.Threads
                .Where(t => t.Objet.ToLower().Contains(normalizedTerm) || t.Messages.Any(m => m.Corps.ToLower().Contains(normalizedTerm)))
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .ToListAsync();

            var results = matchingThreads.Select(t => {
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).First();
                return new ThreadSummaryDto
                {
                    ThreadId = t.Id,
                    Objet = t.Objet,
                    DerniereActivite = lastMessage.DateEnvoi,
                    DernierMessageCorps = lastMessage.Corps,
                    DernierExpediteurNom = $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}",
                    ADesMessagesNonLus = t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu),
                    EstArchive = t.EstArchive
                };
            })
            .OrderByDescending(s => s.DerniereActivite)
            .ToList();

            return Ok(results);
        }

        // 9. GET: api/messages/contacts (Get list of other users to populate composition dropdowns)
        [HttpGet("contacts")]
        public async Task<IActionResult> GetContactsList()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            // Pull active profiles excluding the logged-in individual
            var contacts = await _context.Utilisateurs
                .Where(u => u.Actif && u.Id != currentUserId)
                .Include(u => u.Entreprise)
                .Select(u => new ContactDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    NomComplet = $"{u.Prenom} {u.Nom}",
                    Role = u.Role,
                    EntrepriseNom = u.Entreprise.Nom
                })
                .ToListAsync();

            return Ok(contacts);
        }
    }
}