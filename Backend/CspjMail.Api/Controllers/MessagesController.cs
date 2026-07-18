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

        // 1. POST: api/messages/thread (Start a new conversation securely preserving recipient)
        // 1. POST: api/messages/thread (Start a new conversation securely preserving recipient)
        [HttpPost("thread")]
        public async Task<IActionResult> StartThread([FromForm] CreateThreadDto dto)
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
                DestinataireId = dto.DestinataireId, // Preserving recipient reference data permanently
                Corps = dto.Corps,
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };

            _context.Messages.Add(initialMessage);
            await _context.SaveChangesAsync();

            // Process Attachments
            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

                foreach (var file in dto.Attachments)
                {
                    if (file.Length > 0)
                    {
                        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                        var filePath = Path.Combine(uploadDir, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        _context.PiecesJointes.Add(new PiecesJointe
                        {
                            MessageId = initialMessage.Id,
                            NomFichier = file.FileName,
                            CheminFichier = "/uploads/" + fileName,
                            TailleOctets = (int)file.Length, // Maps perfectly to the strict NOT NULL column
                            TypeContenu = file.ContentType,
                            DateTeleversement = DateTime.UtcNow
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            var currentUser = await _context.Utilisateurs.FindAsync(currentUserId);
            var senderEmail = currentUser?.Email ?? "Inconnu";
            
            var auditLog = new AuditLog
            {
                DateHeure = DateTime.UtcNow,
                TypeAction = "SEND_MESSAGE",
                Utilisateur = senderEmail,
                Description = $"Nouvelle discussion initiée : {dto.Objet}"
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = newThread.Id, Message = "Thread created successfully." });
        }

        // 2. POST: api/messages/thread/{id}/reply (Reply inside conversation checking root thread history context)
        // 2. POST: api/messages/thread/{id}/reply (Reply inside conversation checking root thread history context)
        [HttpPost("thread/{threadId}/reply")]
        public async Task<IActionResult> ReplyToThread(int threadId, [FromForm] ReplyMessageDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            // Obtain the first root message within this thread container to discover original routing identity bounds
            var firstMessageInThread = await _context.Messages
                .Where(m => m.ThreadId == threadId)
                .OrderBy(m => m.DateEnvoi)
                .FirstOrDefaultAsync();

            if (firstMessageInThread == null)
            {
                return NotFound("The targeted email thread does not exist or contains no original message contexts.");
            }

            // Enforce secure visibility access validation to prevent cross-account injection injections
            if (firstMessageInThread.ExpediteurId != currentUserId && firstMessageInThread.DestinataireId != currentUserId)
            {
                return Forbid("You do not have administrative routing authorization to reply within this communication thread.");
            }

            // Infer correct opposite participant mapping coordinates
            int runtimeRecipientId = (firstMessageInThread.ExpediteurId == currentUserId) 
                ? firstMessageInThread.DestinataireId 
                : firstMessageInThread.ExpediteurId;

            var replyMessage = new Message
            {
                ThreadId = threadId,
                ExpediteurId = currentUserId,
                DestinataireId = runtimeRecipientId,
                Corps = dto.Corps,
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };

            _context.Messages.Add(replyMessage);
            await _context.SaveChangesAsync();

            // Process Attachments
            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

                foreach (var file in dto.Attachments)
                {
                    if (file.Length > 0)
                    {
                        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                        var filePath = Path.Combine(uploadDir, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        _context.PiecesJointes.Add(new PiecesJointe
                        {
                            MessageId = replyMessage.Id,
                            NomFichier = file.FileName,
                            CheminFichier = "/uploads/" + fileName,
                            TailleOctets = (int)file.Length, // Maps perfectly to the strict NOT NULL column
                            TypeContenu = file.ContentType,
                            DateTeleversement = DateTime.UtcNow
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            var currentUser = await _context.Utilisateurs.FindAsync(currentUserId);
            var senderEmail = currentUser?.Email ?? "Inconnu";

            var auditLog = new AuditLog
            {
                DateHeure = DateTime.UtcNow,
                TypeAction = "REPLY_MESSAGE",
                Utilisateur = senderEmail,
                Description = $"Réponse envoyée dans la discussion ID {threadId}"
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { MessageId = replyMessage.Id, Message = "Reply successfully sent." });
        }

        // 3. GET: api/messages/thread/{id} (Fetch full conversation with secure IDOR boundaries)
        [HttpGet("thread/{threadId}")]
        public async Task<IActionResult> GetThreadDetails(int threadId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var thread = await _context.Threads
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.PiecesJointes)
                .FirstOrDefaultAsync(t => t.Id == threadId);

            if (thread == null) return NotFound("Thread not found.");

            // Anti-IDOR Authorization Gate Check
            var sampleMsg = thread.Messages.FirstOrDefault();
            if (sampleMsg != null && sampleMsg.ExpediteurId != currentUserId && sampleMsg.DestinataireId != currentUserId)
            {
                return Forbid("Access denied to this conversational stream thread context.");
            }

            var unreadIncomingMessages = thread.Messages.Where(m => m.ExpediteurId != currentUserId && !m.EstLu);
            foreach (var msg in unreadIncomingMessages)
            {
                msg.EstLu = true;
            }
            await _context.SaveChangesAsync();

            // Get all unique participant IDs in the thread
            var participantIds = thread.Messages
                .SelectMany(m => new[] { m.ExpediteurId, m.DestinataireId })
                .Distinct()
                .Where(id => id != currentUserId) // Exclude current user from recipients
                .ToList();

            // Fetch recipient details
            var recipients = await _context.Utilisateurs
                .Where(u => participantIds.Contains(u.Id))
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

            var response = new ThreadDetailsDto
            {
                ThreadId = thread.Id,
                Objet = thread.Objet,
                DateCreation = thread.DateCreation,
                EstArchive = thread.EstArchive,
                Destinataires = recipients,
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
                        ExpediteurRole = m.Expediteur.Role,
                        PiecesJointes = m.PiecesJointes.Select(p => new PieceJointeDto
                        {
                            Id = p.Id,
                            NomFichier = p.NomFichier,
                            CheminFichier = p.CheminFichier,
                            TailleOctets = p.TailleOctets,
                            TypeContenu = p.TypeContenu
                        }).ToList()
                    }).ToList()
            };

            return Ok(response);
        }

        // 4. GET: api/messages/inbox
        // Returns only threads where the current user is the RECIPIENT of at least one message.
        // This strictly excludes threads the user only sent — those belong in /sent.
        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            // A thread belongs in the inbox only when at least one of its messages
            // was addressed TO the current user (DestinataireId), not sent BY them.
            var threads = await _context.Threads
                .Where(t => !t.EstArchive
                         && t.Messages.Any(m => m.DestinataireId == currentUserId))
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .ToListAsync();

            var inboxSummaries = threads.Select(t =>
            {
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).First();
                return new ThreadSummaryDto
                {
                    ThreadId = t.Id,
                    Objet = t.Objet,
                    DerniereActivite = lastMessage.DateEnvoi,
                    DernierMessageCorps = lastMessage.Corps,
                    DernierExpediteurNom = $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}",
                    // Unread count: only messages sent BY someone else TO the current user
                    ADesMessagesNonLus = t.Messages.Any(m => m.DestinataireId == currentUserId
                                                          && m.ExpediteurId != currentUserId
                                                          && !m.EstLu),
                    EstArchive = t.EstArchive
                };
            })
            .OrderByDescending(s => s.DerniereActivite)
            .ToList();

            return Ok(inboxSummaries);
        }

        // 5. GET: api/messages/sent
        // Returns only threads originally initiated (started) by the current user.
        // The first message's ExpediteurId determines ownership — replies from either
        // party are visible when the thread is opened, but the thread row only appears
        // here if the user created the conversation.
        [HttpGet("sent")]
        public async Task<IActionResult> GetSent()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            // Fetch threads where the current user sent at least one message
            // (covers both threads they started and conversations they replied to)
            // and the user is NOT the sole recipient — i.e., they acted as the sender.
            var threads = await _context.Threads
                .Where(t => !t.EstArchive
                         && t.Messages.Any(m => m.ExpediteurId == currentUserId))
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .ToListAsync();

            var sentSummaries = threads.Select(t =>
            {
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).First();
                return new ThreadSummaryDto
                {
                    ThreadId = t.Id,
                    Objet = t.Objet,
                    DerniereActivite = lastMessage.DateEnvoi,
                    DernierMessageCorps = lastMessage.Corps,
                    DernierExpediteurNom = $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}",
                    ADesMessagesNonLus = false, // Sent items have no unread concept for the sender
                    EstArchive = t.EstArchive
                };
            })
            .OrderByDescending(s => s.DerniereActivite)
            .ToList();

            return Ok(sentSummaries);
        }

        // 6. PUT: api/messages/thread/{id}/archive (Toggles archiving parameters if part of participants matrix)
        [HttpPut("thread/{threadId}/archive")]
        public async Task<IActionResult> ToggleArchiveThread(int threadId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var firstMessage = await _context.Messages.Where(m => m.ThreadId == threadId).FirstOrDefaultAsync();
            if (firstMessage == null) return NotFound("Thread context not located.");

            if (firstMessage.ExpediteurId != currentUserId && firstMessage.DestinataireId != currentUserId)
            {
                return Forbid();
            }

            var thread = await _context.Threads.FindAsync(threadId);
            if (thread == null) return NotFound("Thread not found.");

            thread.EstArchive = !thread.EstArchive;
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = thread.Id, EstArchive = thread.EstArchive, Message = $"Thread archive status set to {thread.EstArchive}." });
        }

        // 7. GET: api/messages/archive (Gets archived communication records for this user context)
        [HttpGet("archive")]
        public async Task<IActionResult> GetArchive()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var threads = await _context.Threads
                .Where(t => t.EstArchive && t.Messages.Any(m => m.ExpediteurId == currentUserId || m.DestinataireId == currentUserId))
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

        // 8. GET: api/messages/search (Searches across threads securely checking matching keywords)
        [HttpGet("search")]
        public async Task<IActionResult> SearchMessages([FromQuery] string searchTerm)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            if (string.IsNullOrWhiteSpace(searchTerm)) return BadRequest("Search term cannot be empty.");

            var normalizedTerm = searchTerm.ToLower();

            var matchingThreads = await _context.Threads
                .Where(t => (t.Messages.Any(m => m.ExpediteurId == currentUserId || m.DestinataireId == currentUserId)) &&
                            (t.Objet.ToLower().Contains(normalizedTerm) || t.Messages.Any(m => m.Corps.ToLower().Contains(normalizedTerm))))
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

        // 9. GET: api/messages/contacts (Get selectable targets list)
        [HttpGet("contacts")]
        public async Task<IActionResult> GetContactsList()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

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

        // 10. GET: api/messages/attachments/download/{id}
        // Forces download of an attachment by its DB record ID.
        // Verifies the requesting user is a participant in the parent message's thread (IDOR guard).
        [HttpGet("attachments/download/{id:int}")]
        public async Task<IActionResult> DownloadAttachment(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            // Load the attachment and its parent message (for access check)
            var attachment = await _context.PiecesJointes
                .Include(p => p.Message)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (attachment == null) return NotFound("Pièce jointe introuvable.");

            // IDOR guard: only sender or recipient of the parent message may download
            var msg = attachment.Message;
            if (msg.ExpediteurId != currentUserId && msg.DestinataireId != currentUserId)
            {
                return Forbid("Vous n'êtes pas autorisé à accéder à cette pièce jointe.");
            }

            // Resolve physical path — CheminFichier is stored as "/uploads/<guid.ext>"
            var physicalPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                attachment.CheminFichier.TrimStart('/')   // strip leading slash before Path.Combine
            );

            if (!System.IO.File.Exists(physicalPath))
            {
                return NotFound("Le fichier physique est introuvable sur le serveur.");
            }

            // Return the file with Content-Disposition: attachment to force browser download
            var contentType = string.IsNullOrWhiteSpace(attachment.TypeContenu)
                ? "application/octet-stream"
                : attachment.TypeContenu;

            return PhysicalFile(physicalPath, contentType, attachment.NomFichier);
        }
    }
}