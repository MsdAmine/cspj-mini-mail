using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CspjMail.Api.Models;
using CspjMail.Api.DTOs;

namespace CspjMail.Api.Controllers
{
    [Authorize] // Requires a valid JWT token to touch any endpoint here
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
            // Extract logged-in user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            // Verify destination user exists
            var destinationExists = await _context.Utilisateurs.AnyAsync(u => u.Id == dto.DestinataireId);
            if (!destinationExists)
            {
                return BadRequest("The recipient user could not be found.");
            }

            // Create the container thread
            var newThread = new Models.Thread
            {
                Objet = dto.Objet,
                DateCreation = DateTime.UtcNow,
                EstArchive = false
            };

            _context.Threads.Add(newThread);
            await _context.SaveChangesAsync(); // Generates the ThreadId

            // Append the primary message inside that thread
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

            // Ensure thread exists
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

        // 3. GET: api/messages/thread/{id} (Fetch full chronological messages for a conversation)
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

            // Mark any unread messages in this thread that were sent by OTHER users as Read
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

            // Construct detail response
            var response = new ThreadDetailsDto
            {
                ThreadId = thread.Id,
                Objet = thread.Objet,
                DateCreation = thread.DateCreation,
                EstArchive = thread.EstArchive,
                Messages = thread.Messages
                    .OrderBy(m => m.DateEnvoi) // Chronological order
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
    }
}