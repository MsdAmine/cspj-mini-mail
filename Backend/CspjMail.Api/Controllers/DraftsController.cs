using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CspjMail.Api.DTOs;
using CspjMail.Api.Models;
using CspjMail.Api.Services;

namespace CspjMail.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DraftsController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;
        private readonly IHtmlSanitizerService _sanitizer;

        public DraftsController(CspjMiniMailDbContext context, IHtmlSanitizerService sanitizer)
        {
            _context = context;
            _sanitizer = sanitizer;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private static List<int> ParseRecipientIds(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return new List<int>();
            try
            {
                return (JsonSerializer.Deserialize<List<int>>(raw) ?? new List<int>())
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();
            }
            catch
            {
                // Fallback to comma-separated
                return raw.Split(',', StringSplitOptions.RemoveEmptyEntries)
                          .Select(s => int.TryParse(s.Trim(), out int id) && id > 0 ? (int?)id : null)
                          .Where(id => id.HasValue)
                          .Select(id => id!.Value)
                          .Distinct()
                          .ToList();
            }
        }

        // 1. GET: api/drafts
        [HttpGet]
        public async Task<IActionResult> GetDrafts()
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return Unauthorized();

            var drafts = await _context.Drafts
                .Where(d => d.UserId == currentUserId.Value)
                .OrderByDescending(d => d.UpdatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.UserId,
                    d.RecipientIds,
                    d.Subject,
                    d.Body,
                    d.CreatedAt,
                    d.UpdatedAt
                })
                .ToListAsync();

            var result = drafts.Select(d => new DraftDto
            {
                Id = d.Id,
                UserId = d.UserId,
                RecipientIds = ParseRecipientIds(d.RecipientIds),
                Subject = d.Subject,
                Body = d.Body,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            });

            return Ok(result);
        }

        // 2. GET: api/drafts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDraftById(int id)
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return Unauthorized();

            var draft = await _context.Drafts
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == currentUserId.Value);

            if (draft == null)
            {
                return NotFound("Brouillon introuvable.");
            }

            var dto = new DraftDto
            {
                Id = draft.Id,
                UserId = draft.UserId,
                RecipientIds = ParseRecipientIds(draft.RecipientIds),
                Subject = draft.Subject,
                Body = draft.Body,
                CreatedAt = draft.CreatedAt,
                UpdatedAt = draft.UpdatedAt
            };

            return Ok(dto);
        }

        // 3. POST: api/drafts
        [HttpPost]
        public async Task<IActionResult> CreateDraft([FromBody] SaveDraftDto dto)
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return Unauthorized();

            var validRecipientIds = dto.RecipientIds?
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var sanitizedSubject = _sanitizer.SanitizePlainText(dto.Subject);
            var sanitizedBody = _sanitizer.SanitizeHtml(dto.Body);

            var draft = new Draft
            {
                UserId = currentUserId.Value,
                RecipientIds = validRecipientIds != null && validRecipientIds.Any()
                    ? JsonSerializer.Serialize(validRecipientIds)
                    : null,
                Subject = sanitizedSubject,
                Body = sanitizedBody,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Drafts.Add(draft);
            await _context.SaveChangesAsync();

            var responseDto = new DraftDto
            {
                Id = draft.Id,
                UserId = draft.UserId,
                RecipientIds = ParseRecipientIds(draft.RecipientIds),
                Subject = draft.Subject,
                Body = draft.Body,
                CreatedAt = draft.CreatedAt,
                UpdatedAt = draft.UpdatedAt
            };

            return CreatedAtAction(nameof(GetDraftById), new { id = draft.Id }, responseDto);
        }

        // 4. PUT: api/drafts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDraft(int id, [FromBody] SaveDraftDto dto)
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return Unauthorized();

            var draft = await _context.Drafts
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == currentUserId.Value);

            if (draft == null)
            {
                return NotFound("Brouillon introuvable.");
            }

            var validRecipientIds = dto.RecipientIds?
                .Where(rid => rid > 0)
                .Distinct()
                .ToList();

            draft.RecipientIds = validRecipientIds != null && validRecipientIds.Any()
                ? JsonSerializer.Serialize(validRecipientIds)
                : null;
            draft.Subject = _sanitizer.SanitizePlainText(dto.Subject);
            draft.Body = _sanitizer.SanitizeHtml(dto.Body);
            draft.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var responseDto = new DraftDto
            {
                Id = draft.Id,
                UserId = draft.UserId,
                RecipientIds = ParseRecipientIds(draft.RecipientIds),
                Subject = draft.Subject,
                Body = draft.Body,
                CreatedAt = draft.CreatedAt,
                UpdatedAt = draft.UpdatedAt
            };

            return Ok(responseDto);
        }

        // 5. DELETE: api/drafts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDraft(int id)
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue) return Unauthorized();

            var draft = await _context.Drafts
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == currentUserId.Value);

            if (draft == null)
            {
                return NotFound("Brouillon introuvable.");
            }

            _context.Drafts.Remove(draft);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Brouillon supprimé avec succès." });
        }
    }
}
