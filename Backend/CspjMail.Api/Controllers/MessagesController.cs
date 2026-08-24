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

        // ─── Shared helpers ────────────────────────────────────────────────────────

        /// <summary>Returns the allowed MIME types for file uploads.</summary>
        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
        };

        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB per file

        /// <summary>Saves uploaded files and adds PiecesJointe records. Returns BadRequest on error.</summary>
        private async Task<IActionResult?> ProcessAttachmentsAsync(
            List<IFormFile> attachments, int messageId)
        {
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

            foreach (var file in attachments)
            {
                if (file.Length <= 0) continue;

                if (file.Length > MaxFileSizeBytes)
                    return BadRequest($"Le fichier '{file.FileName}' dépasse la limite de 10 Mo autorisée.");

                if (!AllowedMimeTypes.Contains(file.ContentType))
                    return BadRequest($"Le type de fichier '{file.ContentType}' n'est pas autorisé.");

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(uploadDir, fileName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                _context.PiecesJointes.Add(new PiecesJointe
                {
                    MessageId = messageId,
                    NomFichier = file.FileName,
                    CheminFichier = "/uploads/" + fileName,
                    TailleOctets = (int)file.Length,
                    TypeContenu = file.ContentType,
                    DateTeleversement = DateTime.UtcNow
                });
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                // Cleanup orphan files on DB failure
                foreach (var file in attachments.Where(f => f.Length > 0))
                {
                    var orphanName = Path.Combine(uploadDir,
                        _context.PiecesJointes.Local
                            .Where(p => p.NomFichier == file.FileName)
                            .Select(p => Path.GetFileName(p.CheminFichier))
                            .FirstOrDefault() ?? string.Empty);
                    if (System.IO.File.Exists(orphanName))
                        System.IO.File.Delete(orphanName);
                }
                throw;
            }

            return null; // null means no error
        }

        /// <summary>True when the user is a registered participant of the thread.</summary>
        private async Task<bool> IsParticipantAsync(int threadId, int userId)
        {
            return await _context.ThreadParticipants
                .AnyAsync(tp => tp.ThreadId == threadId && tp.UserId == userId);
        }

        // ─── 1. POST: api/messages/thread ─────────────────────────────────────────
        [HttpPost("thread")]
        public async Task<IActionResult> StartThread([FromForm] CreateThreadDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized();

            // ── Resolve recipient list ───────────────────────────────────────────
            List<int> recipientIds;

            if (dto.DestinataireIds != null && dto.DestinataireIds.Count >= 1)
            {
                recipientIds = dto.DestinataireIds.Distinct().Where(id => id != currentUserId).ToList();
            }
            else if (dto.DestinataireId.HasValue && dto.DestinataireId.Value > 0)
            {
                recipientIds = new List<int> { dto.DestinataireId.Value };
            }
            else
            {
                return BadRequest("Au moins un destinataire est requis.");
            }

            if (recipientIds.Count == 0)
                return BadRequest("Au moins un destinataire valide est requis.");

            // ── Validate all recipients exist ────────────────────────────────────
            foreach (var rid in recipientIds)
            {
                var exists = await _context.Utilisateurs.AnyAsync(u => u.Id == rid);
                if (!exists) return BadRequest($"L'utilisateur destinataire (ID {rid}) est introuvable.");
            }

            // ── Determine mode ───────────────────────────────────────────────────
            // Broadcast (Diffusion): multiple recipients WITHOUT a group title, or explicit EstDiffusion flag.
            bool isBroadcast = dto.EstDiffusion ||
                               (recipientIds.Count > 1 && string.IsNullOrWhiteSpace(dto.TitreGroupe));

            // Group: multiple recipients WITH a title (shared chatroom).
            bool isGroup = !isBroadcast && recipientIds.Count > 1;

            if (isGroup && string.IsNullOrWhiteSpace(dto.TitreGroupe))
                return BadRequest("Un nom de groupe est requis pour une discussion de groupe.");

            // ════════════════════════════════════════════════════════════════════
            // BROADCAST PATH — create N independent 1-to-1 threads
            // ════════════════════════════════════════════════════════════════════
            if (isBroadcast)
            {
                var currentUser = await _context.Utilisateurs.FindAsync(currentUserId);
                var senderEmail = currentUser?.Email ?? "Inconnu";

                // Pre-save uploaded files to disk ONCE so we can share the physical paths.
                var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

                // Build a list of (originalFileName, savedFileName, size, contentType) tuples.
                var savedFiles = new List<(string OriginalName, string SavedPath, long Size, string ContentType)>();
                if (dto.Attachments != null)
                {
                    foreach (var file in dto.Attachments)
                    {
                        if (file.Length <= 0) continue;

                        if (file.Length > MaxFileSizeBytes)
                            return BadRequest($"Le fichier '{file.FileName}' dépasse la limite de 10 Mo autorisée.");

                        if (!AllowedMimeTypes.Contains(file.ContentType))
                            return BadRequest($"Le type de fichier '{file.ContentType}' n'est pas autorisé.");

                        var savedName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                        var fullPath  = Path.Combine(uploadDir, savedName);

                        using var stream = new FileStream(fullPath, FileMode.Create);
                        await file.CopyToAsync(stream);

                        savedFiles.Add((file.FileName, "/uploads/" + savedName, file.Length, file.ContentType));
                    }
                }

                var createdThreadIds = new List<int>();

                foreach (var recipientId in recipientIds)
                {
                    // 1. Create thread
                    var broadcastThread = new Models.Thread
                    {
                        Objet         = dto.Objet,
                        DateCreation  = DateTime.UtcNow,
                        EstArchive    = false,
                        EstGroupe     = false,
                        TitreGroupe   = null
                    };
                    _context.Threads.Add(broadcastThread);
                    await _context.SaveChangesAsync();

                    // 2. ThreadParticipant records (sender + this recipient)
                    _context.ThreadParticipants.Add(new ThreadParticipant { ThreadId = broadcastThread.Id, UserId = currentUserId });
                    _context.ThreadParticipants.Add(new ThreadParticipant { ThreadId = broadcastThread.Id, UserId = recipientId });
                    await _context.SaveChangesAsync();

                    // 3. Initial message
                    var broadcastMessage = new Message
                    {
                        ThreadId       = broadcastThread.Id,
                        ExpediteurId   = currentUserId,
                        DestinataireId = recipientId,
                        Corps          = dto.Corps,
                        DateEnvoi      = DateTime.UtcNow,
                        EstLu          = false
                    };
                    _context.Messages.Add(broadcastMessage);
                    await _context.SaveChangesAsync();

                    // 4. Attachment references — one DB row per thread, same physical file
                    foreach (var (origName, savedPath, size, contentType) in savedFiles)
                    {
                        _context.PiecesJointes.Add(new PiecesJointe
                        {
                            MessageId          = broadcastMessage.Id,
                            NomFichier         = origName,
                            CheminFichier      = savedPath,
                            TailleOctets       = (int)size,
                            TypeContenu        = contentType,
                            DateTeleversement  = DateTime.UtcNow
                        });
                    }
                    if (savedFiles.Count > 0) await _context.SaveChangesAsync();

                    createdThreadIds.Add(broadcastThread.Id);
                }

                // 5. Single audit entry for the entire broadcast
                _context.AuditLogs.Add(new AuditLog
                {
                    DateHeure  = DateTime.UtcNow,
                    TypeAction = "BROADCAST_MESSAGE",
                    Utilisateur = senderEmail,
                    Description = $"Diffusion envoyée à {recipientIds.Count} destinataire(s) : {dto.Objet}"
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    ThreadIds   = createdThreadIds,
                    Count       = createdThreadIds.Count,
                    Message     = $"Diffusion envoyée : {createdThreadIds.Count} discussion(s) créée(s).",
                    EstDiffusion = true
                });
            }

            // ════════════════════════════════════════════════════════════════════
            // NORMAL PATH — single thread (1-to-1 OR group chatroom)
            // ════════════════════════════════════════════════════════════════════

            // ── Create thread ────────────────────────────────────────────────────
            var newThread = new Models.Thread
            {
                Objet = dto.Objet,
                DateCreation = DateTime.UtcNow,
                EstArchive = false,
                EstGroupe = isGroup,
                TitreGroupe = isGroup ? dto.TitreGroupe!.Trim() : null
            };

            _context.Threads.Add(newThread);
            await _context.SaveChangesAsync();

            // ── Record all participants (creator + recipients) ───────────────────
            var allParticipantIds = new List<int> { currentUserId };
            allParticipantIds.AddRange(recipientIds);
            allParticipantIds = allParticipantIds.Distinct().ToList();

            foreach (var pid in allParticipantIds)
            {
                _context.ThreadParticipants.Add(new ThreadParticipant
                {
                    ThreadId = newThread.Id,
                    UserId = pid
                });
            }
            await _context.SaveChangesAsync();

            // ── Create the first message ─────────────────────────────────────────
            // For 1-to-1: populate DestinataireId. For groups: leave it null.
            var initialMessage = new Message
            {
                ThreadId = newThread.Id,
                ExpediteurId = currentUserId,
                DestinataireId = isGroup ? null : recipientIds[0],
                Corps = dto.Corps,
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };

            _context.Messages.Add(initialMessage);
            await _context.SaveChangesAsync();

            // ── Process attachments ──────────────────────────────────────────────
            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var attachErr = await ProcessAttachmentsAsync(dto.Attachments, initialMessage.Id);
                if (attachErr != null) return attachErr;
            }

            // ── Audit log ────────────────────────────────────────────────────────
            var normalUser = await _context.Utilisateurs.FindAsync(currentUserId);
            var normalSenderEmail = normalUser?.Email ?? "Inconnu";

            _context.AuditLogs.Add(new AuditLog
            {
                DateHeure = DateTime.UtcNow,
                TypeAction = isGroup ? "CREATE_GROUP_THREAD" : "SEND_MESSAGE",
                Utilisateur = normalSenderEmail,
                Description = isGroup
                    ? $"Discussion de groupe créée : « {dto.TitreGroupe} » avec {recipientIds.Count} participants."
                    : $"Nouvelle discussion initiée : {dto.Objet}"
            });
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = newThread.Id, Message = "Thread created successfully.", EstGroupe = isGroup });
        }

        // ─── 2. POST: api/messages/thread/{id}/reply ──────────────────────────────
        [HttpPost("thread/{threadId}/reply")]
        public async Task<IActionResult> ReplyToThread(int threadId, [FromForm] ReplyMessageDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized();

            // ── Auth: current user must be a registered participant ──────────────
            if (!await IsParticipantAsync(threadId, currentUserId))
            {
                // Backward-compat fallback: check legacy DestinataireId on the first message
                var firstMsg = await _context.Messages
                    .Where(m => m.ThreadId == threadId)
                    .OrderBy(m => m.DateEnvoi)
                    .FirstOrDefaultAsync();

                if (firstMsg == null) return NotFound("La discussion n'existe pas.");
                if (firstMsg.ExpediteurId != currentUserId && firstMsg.DestinataireId != currentUserId)
                    return Forbid("Vous n'êtes pas autorisé à répondre dans cette discussion.");
            }

            var thread = await _context.Threads
                .Include(t => t.Participants)
                .FirstOrDefaultAsync(t => t.Id == threadId);

            if (thread == null) return NotFound("Discussion introuvable.");

            // ── Determine DestinataireId ─────────────────────────────────────────
            // For group threads: null. For 1-to-1: the other party.
            int? replyDestinataireId = null;
            if (!thread.EstGroupe)
            {
                var firstMessage = await _context.Messages
                    .Where(m => m.ThreadId == threadId)
                    .OrderBy(m => m.DateEnvoi)
                    .FirstOrDefaultAsync();

                replyDestinataireId = firstMessage?.ExpediteurId == currentUserId
                    ? firstMessage?.DestinataireId
                    : firstMessage?.ExpediteurId;
            }

            var replyMessage = new Message
            {
                ThreadId = threadId,
                ExpediteurId = currentUserId,
                DestinataireId = replyDestinataireId,
                Corps = dto.Corps,
                DateEnvoi = DateTime.UtcNow,
                EstLu = false
            };

            _context.Messages.Add(replyMessage);
            await _context.SaveChangesAsync();

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var attachErr = await ProcessAttachmentsAsync(dto.Attachments, replyMessage.Id);
                if (attachErr != null) return attachErr;
            }

            var currentUser = await _context.Utilisateurs.FindAsync(currentUserId);
            _context.AuditLogs.Add(new AuditLog
            {
                DateHeure = DateTime.UtcNow,
                TypeAction = "REPLY_MESSAGE",
                Utilisateur = currentUser?.Email ?? "Inconnu",
                Description = $"Réponse envoyée dans la discussion ID {threadId}"
            });
            await _context.SaveChangesAsync();

            return Ok(new { MessageId = replyMessage.Id, Message = "Reply successfully sent." });
        }

        // ─── 3. GET: api/messages/thread/{id} ────────────────────────────────────
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
                .Include(t => t.Participants)
                    .ThenInclude(tp => tp.Utilisateur)
                        .ThenInclude(u => u.Entreprise)
                .FirstOrDefaultAsync(t => t.Id == threadId);

            if (thread == null) return NotFound("Thread not found.");

            // ── IDOR Authorization Gate ──────────────────────────────────────────
            // Primary check: ThreadParticipant table (works for both 1-to-1 and group).
            bool isParticipant = thread.Participants.Any(tp => tp.UserId == currentUserId);

            // Backward-compat fallback for old threads without participant rows.
            if (!isParticipant)
            {
                var sampleMsg = thread.Messages.FirstOrDefault();
                if (sampleMsg == null ||
                    (sampleMsg.ExpediteurId != currentUserId && sampleMsg.DestinataireId != currentUserId))
                {
                    return Forbid("Accès refusé à cette discussion.");
                }
            }

            // ── Mark incoming messages as read ───────────────────────────────────
            var unread = thread.Messages.Where(m => m.ExpediteurId != currentUserId && !m.EstLu);
            foreach (var msg in unread) msg.EstLu = true;
            await _context.SaveChangesAsync();

            // ── Build participant lists ───────────────────────────────────────────
            // All participants from junction table (preferred path)
            List<ContactDto> allParticipants;
            if (thread.Participants.Any())
            {
                allParticipants = thread.Participants
                    .Select(tp => new ContactDto
                    {
                        Id = tp.Utilisateur.Id,
                        Email = tp.Utilisateur.Email,
                        NomComplet = $"{tp.Utilisateur.Prenom} {tp.Utilisateur.Nom}",
                        Role = tp.Utilisateur.Role,
                        InstitutionNom = tp.Utilisateur.Entreprise?.Nom ?? "Structure inconnue"
                    }).ToList();
            }
            else
            {
                // Fallback: derive from message Expediteur/DestinataireId columns
                var participantIds = thread.Messages
                    .SelectMany(m => new[] { (int?)m.ExpediteurId, m.DestinataireId })
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                allParticipants = await _context.Utilisateurs
                    .Where(u => participantIds.Contains(u.Id))
                    .Include(u => u.Entreprise)
                    .Select(u => new ContactDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        NomComplet = $"{u.Prenom} {u.Nom}",
                        Role = u.Role,
                        InstitutionNom = u.Entreprise != null ? u.Entreprise.Nom : "Structure inconnue"
                    }).ToListAsync();
            }

            // "Destinataires" = everyone except the current user (for the thread header)
            var destinataires = allParticipants.Where(p => p.Id != currentUserId).ToList();

            var response = new ThreadDetailsDto
            {
                ThreadId = thread.Id,
                Objet = thread.Objet,
                DateCreation = thread.DateCreation,
                EstArchive = thread.EstArchive,
                IsStarred = thread.Participants.Any(tp => tp.UserId == currentUserId && tp.IsStarred),
                EstGroupe = thread.EstGroupe,
                TitreGroupe = thread.TitreGroupe,
                Destinataires = destinataires,
                TousLesParticipants = allParticipants,
                Messages = thread.Messages
                    .OrderBy(m => m.DateEnvoi)
                    .Select(m => new MessageDisplayDto
                    {
                        MessageId = m.Id,
                        Corps = m.Corps,
                        DateEnvoi = m.DateEnvoi,
                        EstLu = m.EstLu,
                        ExpediteurId = m.ExpediteurId,
                        ExpediteurNomComplet = m.Expediteur != null
                            ? $"{m.Expediteur.Prenom} {m.Expediteur.Nom}"
                            : "Utilisateur inconnu",
                        ExpediteurRole = m.Expediteur?.Role ?? "Inconnu",
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

        // ─── 3.9 GET: api/messages/unread-count ──────────────────────────────────
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

                var unreadCount = await _context.Threads
                    .Where(t => t.EstArchive == false &&
                        !t.Participants.Any(tp => tp.UserId == currentUserId && tp.IsDeletedForUser) &&
                        (
                            (t.Participants.Any(tp => tp.UserId == currentUserId) && t.Messages.Any(m => m.ExpediteurId != currentUserId)) ||
                            t.Messages.Any(m => m.DestinataireId == currentUserId)
                        ) &&
                        t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu &&
                            (m.DestinataireId == currentUserId || t.Participants.Any(tp => tp.UserId == currentUserId))))
                    .CountAsync();

                return Ok(new { unreadCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // ─── 4. GET: api/messages/inbox ───────────────────────────────────────────
        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

                var threads = await _context.Threads
                    .Where(t => t.EstArchive == false &&
                        // Ensure soft-delete filters handle nulls safely
                        !t.Participants.Any(tp => (tp.UserId == currentUserId && (tp.IsDeletedForUser))) &&
                        (
                            (t.Participants.Any(tp => tp.UserId == currentUserId) &&
                             t.Messages.Any(m => m.ExpediteurId != currentUserId)) ||
                            t.Messages.Any(m => m.DestinataireId == currentUserId)
                        ))
                    .Select(t => new ThreadSummaryDto
                    {
                        ThreadId = t.Id,
                        Objet = t.Objet,
                        DerniereActivite = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null 
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.DateEnvoi 
                            : t.DateCreation,
                        DernierMessageCorps = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null 
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Corps 
                            : string.Empty,
                        DernierExpediteurNom = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null && t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur != null 
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur.Prenom + " " + t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur.Nom
                            : "Inconnu",
                        ADesMessagesNonLus = t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu &&
                            (m.DestinataireId == currentUserId || t.Participants.Any(tp => tp.UserId == currentUserId))),
                        EstArchive = t.EstArchive,
                        IsStarred = t.Participants.Where(tp => tp.UserId == currentUserId).Select(tp => (bool?)tp.IsStarred).FirstOrDefault() ?? false,
                        EstGroupe = t.EstGroupe,
                        TitreGroupe = t.TitreGroupe,
                        NombreParticipants = t.Participants.Any() ? t.Participants.Count : 2
                    })
                    .OrderByDescending(s => s.DerniereActivite)
                    .ToListAsync();

                return Ok(threads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // ─── 5. GET: api/messages/sent ────────────────────────────────────────────
        [HttpGet("sent")]
        public async Task<IActionResult> GetSent()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

                var threads = await _context.Threads
                    .Where(t => t.EstArchive == false &&
                        !t.Participants.Any(tp => tp.UserId == currentUserId && tp.IsDeletedForUser) &&
                        t.Messages.Any(m => m.ExpediteurId == currentUserId))
                    .Select(t => new ThreadSummaryDto
                    {
                        ThreadId = t.Id,
                        Objet = t.Objet,
                        DerniereActivite = t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null 
                            ? t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.DateEnvoi
                            : t.DateCreation,
                        DernierMessageCorps = t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null
                            ? t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Corps
                            : string.Empty,
                        DernierExpediteurNom = t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null && t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Destinataire != null
                            ? t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Destinataire.Prenom + " " + t.Messages.Where(m => m.ExpediteurId == currentUserId).OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Destinataire.Nom
                            : t.Participants.Where(tp => tp.UserId != currentUserId).Select(tp => tp.Utilisateur.Prenom + " " + tp.Utilisateur.Nom).FirstOrDefault() ?? "Inconnu",
                        ADesMessagesNonLus = false,
                        EstArchive = t.EstArchive,
                        IsStarred = t.Participants.Where(tp => tp.UserId == currentUserId).Select(tp => (bool?)tp.IsStarred).FirstOrDefault() ?? false,
                        EstGroupe = t.EstGroupe,
                        TitreGroupe = t.TitreGroupe,
                        NombreParticipants = t.Participants.Any() ? t.Participants.Count : 2
                    })
                    .OrderByDescending(s => s.DerniereActivite)
                    .ToListAsync();

                return Ok(threads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // ─── 6. PUT: api/messages/thread/{id}/archive ─────────────────────────────
        [HttpPut("thread/{threadId}/archive")]
        public async Task<IActionResult> ToggleArchiveThread(int threadId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            // Primary auth: ThreadParticipant
            bool authorized = await IsParticipantAsync(threadId, currentUserId);

            // Backward-compat: check first message
            if (!authorized)
            {
                var firstMessage = await _context.Messages
                    .Where(m => m.ThreadId == threadId)
                    .FirstOrDefaultAsync();
                if (firstMessage == null) return NotFound("Thread context not located.");
                authorized = firstMessage.ExpediteurId == currentUserId ||
                             firstMessage.DestinataireId == currentUserId;
            }

            if (!authorized) return Forbid();

            var thread = await _context.Threads.FindAsync(threadId);
            if (thread == null) return NotFound("Thread not found.");

            thread.EstArchive = !thread.EstArchive;
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = thread.Id, EstArchive = thread.EstArchive,
                Message = $"Thread archive status set to {thread.EstArchive}." });
        }

        // ─── 6b. PUT: api/messages/thread/{id}/star ──────────────────────────────
        [HttpPut("thread/{threadId}/star")]
        public async Task<IActionResult> ToggleStarThread(int threadId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var participant = await _context.ThreadParticipants
                .FirstOrDefaultAsync(tp => tp.ThreadId == threadId && tp.UserId == currentUserId);

            if (participant == null) return NotFound("Thread context not located for current user.");

            participant.IsStarred = !participant.IsStarred;
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = threadId, IsStarred = participant.IsStarred,
                Message = $"Thread star status set to {participant.IsStarred}." });
        }

        // ─── 7. GET: api/messages/archive ─────────────────────────────────────────
        [HttpGet("archive")]
        public async Task<IActionResult> GetArchive()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

                var threads = await _context.Threads
                    .Where(t => t.EstArchive == true &&
                        !t.Participants.Any(tp => tp.UserId == currentUserId && tp.IsDeletedForUser) &&
                        (t.Participants.Any(tp => tp.UserId == currentUserId) ||
                         t.Messages.Any(m => m.ExpediteurId == currentUserId || m.DestinataireId == currentUserId)))
                    .Select(t => new ThreadSummaryDto
                    {
                        ThreadId = t.Id,
                        Objet = t.Objet,
                        DerniereActivite = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null 
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.DateEnvoi
                            : t.DateCreation,
                        DernierMessageCorps = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Corps
                            : string.Empty,
                        DernierExpediteurNom = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null && t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur != null
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur.Prenom + " " + t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur.Nom
                            : "Inconnu",
                        ADesMessagesNonLus = t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu),
                        EstArchive = t.EstArchive,
                        IsStarred = t.Participants.Where(tp => tp.UserId == currentUserId).Select(tp => (bool?)tp.IsStarred).FirstOrDefault() ?? false,
                        EstGroupe = t.EstGroupe,
                        TitreGroupe = t.TitreGroupe,
                        NombreParticipants = t.Participants.Any() ? t.Participants.Count : 2
                    })
                    .OrderByDescending(s => s.DerniereActivite)
                    .ToListAsync();

                return Ok(threads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // ─── 8. GET: api/messages/search ──────────────────────────────────────────
        [HttpGet("search")]
        public async Task<IActionResult> SearchMessages([FromQuery] string searchTerm)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

                if (string.IsNullOrWhiteSpace(searchTerm)) return BadRequest("Search term cannot be empty.");

                var normalizedTerm = searchTerm.ToLower();

                var matchingThreads = await _context.Threads
                    .Where(t =>
                        (t.Participants.Any(tp => tp.UserId == currentUserId) ||
                         t.Messages.Any(m => m.ExpediteurId == currentUserId || m.DestinataireId == currentUserId)) &&
                        (t.Objet.ToLower().Contains(normalizedTerm) ||
                         (t.TitreGroupe != null && t.TitreGroupe.ToLower().Contains(normalizedTerm)) ||
                         t.Messages.Any(m => m.Corps.ToLower().Contains(normalizedTerm))))
                    .Select(t => new ThreadSummaryDto
                    {
                        ThreadId = t.Id,
                        Objet = t.Objet,
                        DerniereActivite = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.DateEnvoi
                            : t.DateCreation,
                        DernierMessageCorps = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Corps
                            : string.Empty,
                        DernierExpediteurNom = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault() != null && t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur != null
                            ? t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur.Prenom + " " + t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault()!.Expediteur.Nom
                            : "Inconnu",
                        ADesMessagesNonLus = t.Messages.Any(m => m.ExpediteurId != currentUserId && !m.EstLu),
                        EstArchive = t.EstArchive,
                        IsStarred = t.Participants.Where(tp => tp.UserId == currentUserId).Select(tp => (bool?)tp.IsStarred).FirstOrDefault() ?? false,
                        EstGroupe = t.EstGroupe,
                        TitreGroupe = t.TitreGroupe,
                        NombreParticipants = t.Participants.Any() ? t.Participants.Count : 2
                    })
                    .OrderByDescending(s => s.DerniereActivite)
                    .ToListAsync();

                return Ok(matchingThreads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // ─── 9. GET: api/messages/assignable ──────────────────────────────────────
        /// <summary>
        /// Returns the set of users the caller is allowed to add to a group:
        /// - Admin or Fonctionnaire → every active user except self.
        /// - Association           → only the Fonctionnaires explicitly assigned to them.
        /// </summary>
        [HttpGet("assignable")]
        public async Task<IActionResult> GetAssignableUsers()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

            IQueryable<Utilisateur> query;

            if (roleClaim.Equals("Association", StringComparison.OrdinalIgnoreCase))
            {
                // Associations see ONLY their assigned Fonctionnaires
                var assignedIds = await _context.AssociationFonctionnaires
                    .Where(af => af.AssociationId == currentUserId)
                    .Select(af => af.FonctionnaireId)
                    .ToListAsync();

                query = _context.Utilisateurs
                    .Where(u => u.Actif && !u.IsDeleted && assignedIds.Contains(u.Id));
            }
            else
            {
                // Admin and Fonctionnaire see everyone except themselves
                query = _context.Utilisateurs
                    .Where(u => u.Actif && !u.IsDeleted && u.Id != currentUserId);
            }

            var contacts = await query
                .Include(u => u.Entreprise)
                .Select(u => new ContactDto
                {
                    Id             = u.Id,
                    Email          = u.Email,
                    NomComplet     = $"{u.Prenom} {u.Nom}",
                    Role           = u.Role,
                    InstitutionNom = u.Entreprise != null ? u.Entreprise.Nom : "Structure inconnue"
                })
                .ToListAsync();

            return Ok(contacts);
        }

        // ─── 10. GET: api/messages/contacts ────────────────────────────────────────
        [HttpGet("contacts")]
        public async Task<IActionResult> GetContactsList()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var contacts = await _context.Utilisateurs
                .Where(u => u.Actif && !u.IsDeleted && u.Id != currentUserId)
                .Include(u => u.Entreprise)
                .Select(u => new ContactDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    NomComplet = $"{u.Prenom} {u.Nom}",
                    Role = u.Role,
                    InstitutionNom = u.Entreprise != null ? u.Entreprise.Nom : "Structure inconnue"
                })
                .ToListAsync();

            return Ok(contacts);
        }


        // ─── 10. GET: api/messages/attachments/download/{id} ─────────────────────
        [HttpGet("attachments/download/{id:int}")]
        public async Task<IActionResult> DownloadAttachment(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var attachment = await _context.PiecesJointes
                .Include(p => p.Message)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (attachment == null) return NotFound("Pièce jointe introuvable.");

            var msg = attachment.Message;

            // IDOR guard: participant in thread (group or 1-to-1) OR direct message participant
            bool authorized = await IsParticipantAsync(msg.ThreadId, currentUserId);
            if (!authorized)
            {
                authorized = msg.ExpediteurId == currentUserId || msg.DestinataireId == currentUserId;
            }

            if (!authorized)
                return Forbid("Vous n'êtes pas autorisé à accéder à cette pièce jointe.");

            var physicalPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                attachment.CheminFichier.TrimStart('/')
            );

            if (!System.IO.File.Exists(physicalPath))
                return NotFound("Le fichier physique est introuvable sur le serveur.");

            var contentType = string.IsNullOrWhiteSpace(attachment.TypeContenu)
                ? "application/octet-stream"
                : attachment.TypeContenu;

            return PhysicalFile(physicalPath, contentType, attachment.NomFichier);
        }

        // ─── 11. GET: api/messages/direct ─────────────────────────────────────────
        /// <summary>
        /// Returns all non-group (1-to-1) threads the current user participates in,
        /// ordered by most recent activity. Uses EstGroupe == false as the discriminator.
        /// </summary>
        [HttpGet("direct")]
        public async Task<IActionResult> GetDirectMessages()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            var threads = await _context.Threads
                .Where(t => !t.EstArchive &&
                            !t.EstGroupe &&
                            // Exclude threads soft-deleted by this user
                            !t.Participants.Any(tp => tp.UserId == currentUserId && tp.IsDeletedForUser) &&
                            (
                                t.Participants.Any(tp => tp.UserId == currentUserId) ||
                                t.Messages.Any(m => m.ExpediteurId == currentUserId || m.DestinataireId == currentUserId)
                            ))
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .Include(t => t.Participants)
                .ToListAsync();

            var summaries = threads.Select(t =>
            {
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault();
                if (lastMessage == null) return null;

                return new ThreadSummaryDto
                {
                    ThreadId = t.Id,
                    Objet = t.Objet,
                    DerniereActivite = lastMessage.DateEnvoi,
                    DernierMessageCorps = lastMessage.Corps,
                    DernierExpediteurNom = lastMessage.Expediteur != null
                        ? $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}"
                        : "Inconnu",
                    ADesMessagesNonLus = t.Messages.Any(m =>
                        m.ExpediteurId != currentUserId && !m.EstLu &&
                        (m.DestinataireId == currentUserId ||
                         t.Participants.Any(tp => tp.UserId == currentUserId))),
                    EstArchive = t.EstArchive,
                    EstGroupe = false,
                    TitreGroupe = null,
                    NombreParticipants = t.Participants.Count > 0 ? t.Participants.Count : 2
                };
            })
            .Where(s => s != null)
            .OrderByDescending(s => s!.DerniereActivite)
            .ToList();

            return Ok(summaries);
        }

        // ─── 12. GET: api/messages/groups ─────────────────────────────────────────
        /// <summary>
        /// Returns all group threads (EstGroupe == true) the current user participates in,
        /// ordered by most recent activity. Includes participant count and group title.
        /// Works for ALL roles (Admin, Fonctionnaire, Association) by querying purely on
        /// the ThreadParticipant junction table — no role-string comparisons are used.
        /// </summary>
        [HttpGet("groups")]
        public async Task<IActionResult> GetGroupMessages()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

                // Fetch all non-archived group threads where:
                //   1. The current user has a ThreadParticipant row (any role).
                //   2. That row is NOT marked as soft-deleted for this user.
                // Both conditions use plain == comparisons that EF Core can translate.
                var threads = await _context.Threads
                    .Where(t => t.EstGroupe == true &&
                                t.EstArchive == false &&
                                t.Participants.Any(tp => tp.UserId == currentUserId && !tp.IsDeletedForUser))
                    .Include(t => t.Messages)
                        .ThenInclude(m => m.Expediteur)
                    .Include(t => t.Participants)
                        .ThenInclude(tp => tp.Utilisateur)
                    .ToListAsync();

                var summaries = threads.Select(t =>
                {
                    var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault();
                    if (lastMessage == null) return null;

                    return new ThreadSummaryDto
                    {
                        ThreadId = t.Id,
                        Objet = t.Objet,
                        DerniereActivite = lastMessage.DateEnvoi,
                        DernierMessageCorps = lastMessage.Corps,
                        DernierExpediteurNom = lastMessage.Expediteur != null
                            ? $"{lastMessage.Expediteur.Prenom} {lastMessage.Expediteur.Nom}"
                            : "Inconnu",
                        ADesMessagesNonLus = t.Messages.Any(m =>
                            m.ExpediteurId != currentUserId && !m.EstLu &&
                            t.Participants.Any(tp => tp.UserId == currentUserId)),
                        EstArchive = t.EstArchive,
                        EstGroupe = true,
                        TitreGroupe = t.TitreGroupe,
                        NombreParticipants = t.Participants.Count
                    };
                })
                .Where(s => s != null)
                .OrderByDescending(s => s!.DerniereActivite)
                .ToList();

                return Ok(summaries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // ─── 13. POST: api/messages/groups/create ─────────────────────────────────
        /// <summary>
        /// Dedicated endpoint for creating a group thread from the Groups page.
        /// Accepts JSON (not multipart/form-data). At least 1 participant ID is required
        /// in addition to the creator. The creator is always auto-added as participant.
        /// </summary>
        [HttpPost("groups/create")]
        public async Task<IActionResult> CreateGroupThread([FromBody] CreateGroupThreadDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.GroupTitle))
                return BadRequest("اسم المجموعة مطلوب.");

            if (string.IsNullOrWhiteSpace(dto.Corps))
                return BadRequest("نص الرسالة مطلوب.");

            if (dto.ParticipantIds == null || dto.ParticipantIds.Count < 1)
                return BadRequest("يجب اختيار مشارك واحد على الأقل.");

            // Deduplicate and exclude the creator
            var participantIds = dto.ParticipantIds
                .Distinct()
                .Where(id => id != currentUserId)
                .ToList();

            if (participantIds.Count == 0)
                return BadRequest("يجب اختيار مشارك صالح على الأقل.");

            // ── Authorization guard for Association users ────────────────────────────
            // An Association user may only invite their explicitly assigned Fonctionnaires.
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
            if (callerRole.Equals("Association", StringComparison.OrdinalIgnoreCase))
            {
                var allowedIds = await _context.AssociationFonctionnaires
                    .Where(af => af.AssociationId == currentUserId)
                    .Select(af => af.FonctionnaireId)
                    .ToListAsync();

                var forbiddenIds = participantIds.Except(allowedIds).ToList();
                if (forbiddenIds.Any())
                    return StatusCode(403, new
                    {
                        message = "ليس لديك صلاحية إضافة هؤلاء المستخدمين إلى مجموعتك.",
                        forbiddenUserIds = forbiddenIds
                    });
            }

            // Validate all participant IDs exist
            foreach (var pid in participantIds)
            {
                var exists = await _context.Utilisateurs.AnyAsync(u => u.Id == pid && u.Actif && !u.IsDeleted);
                if (!exists)
                    return BadRequest($"المستخدم (ID {pid}) غير موجود أو غير نشط.");
            }

            // ── Create thread ────────────────────────────────────────────────────
            var newThread = new Models.Thread
            {
                Objet        = dto.GroupTitle.Trim(),
                DateCreation = DateTime.UtcNow,
                EstArchive   = false,
                EstGroupe    = true,
                TitreGroupe  = dto.GroupTitle.Trim()
            };
            _context.Threads.Add(newThread);
            await _context.SaveChangesAsync();

            // ── Record all participants (creator + supplied list) ─────────────────
            var allParticipantIds = new List<int> { currentUserId };
            allParticipantIds.AddRange(participantIds);

            foreach (var pid in allParticipantIds)
            {
                _context.ThreadParticipants.Add(new ThreadParticipant
                {
                    ThreadId = newThread.Id,
                    UserId   = pid
                });
            }
            await _context.SaveChangesAsync();

            // ── Create the initial message ────────────────────────────────────────
            var initialMessage = new Message
            {
                ThreadId       = newThread.Id,
                ExpediteurId   = currentUserId,
                DestinataireId = null, // group message — no single recipient
                Corps          = dto.Corps,
                DateEnvoi      = DateTime.UtcNow,
                EstLu          = false
            };
            _context.Messages.Add(initialMessage);
            await _context.SaveChangesAsync();

            // ── Audit log ─────────────────────────────────────────────────────────
            var currentUser = await _context.Utilisateurs.FindAsync(currentUserId);
            _context.AuditLogs.Add(new AuditLog
            {
                DateHeure   = DateTime.UtcNow,
                TypeAction  = "CREATE_GROUP_THREAD",
                Utilisateur = currentUser?.Email ?? "Inconnu",
                Description = $"مجموعة جديدة: « {dto.GroupTitle.Trim()} » ({allParticipantIds.Count} مشاركين)"
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                ThreadId         = newThread.Id,
                TitreGroupe      = newThread.TitreGroupe,
                NombreParticipants = allParticipantIds.Count,
                Message          = "تم إنشاء المجموعة بنجاح."
            });
        }

        // ─── 14. DELETE: api/messages/thread/{id} ─────────────────────────────────
        /// <summary>
        /// Soft-deletes a thread for the current user only.
        /// Sets IsDeletedForUser = true on the ThreadParticipant row so the thread
        /// disappears from every folder for this user while remaining intact for others.
        /// Falls back to a legacy check (DestinataireId / ExpediteurId) for old threads
        /// that predate the ThreadParticipant table.
        /// </summary>
        [HttpDelete("thread/{threadId}")]
        public async Task<IActionResult> DeleteThreadForUser(int threadId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int currentUserId)) return Unauthorized();

            // ── Locate the participant row ─────────────────────────────────────────
            var participant = await _context.ThreadParticipants
                .FirstOrDefaultAsync(tp => tp.ThreadId == threadId && tp.UserId == currentUserId);

            if (participant != null)
            {
                // Modern path: mark as deleted for this user
                participant.IsDeletedForUser = true;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Legacy path: verify the user is genuinely a participant via message columns
                bool legacyAccess = await _context.Messages
                    .AnyAsync(m => m.ThreadId == threadId &&
                                  (m.ExpediteurId == currentUserId || m.DestinataireId == currentUserId));

                if (!legacyAccess)
                    return Forbid("Vous n'êtes pas autorisé à supprimer cette discussion.");

                // For legacy threads insert a participant row marked as deleted
                _context.ThreadParticipants.Add(new ThreadParticipant
                {
                    ThreadId          = threadId,
                    UserId            = currentUserId,
                    IsDeletedForUser  = true
                });
                await _context.SaveChangesAsync();
            }

            // ── Audit log ─────────────────────────────────────────────────────────
            var currentUser = await _context.Utilisateurs.FindAsync(currentUserId);
            _context.AuditLogs.Add(new AuditLog
            {
                DateHeure   = DateTime.UtcNow,
                TypeAction  = "DELETE_THREAD",
                Utilisateur = currentUser?.Email ?? "Inconnu",
                Description = $"Discussion ID {threadId} supprimée (soft-delete) par l'utilisateur."
            });
            await _context.SaveChangesAsync();

            return Ok(new { ThreadId = threadId, Message = "Discussion supprimée avec succès." });
        }
    }
}
