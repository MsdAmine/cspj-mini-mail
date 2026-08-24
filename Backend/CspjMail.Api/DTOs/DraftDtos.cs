using System;
using System.Collections.Generic;

namespace CspjMail.Api.DTOs
{
    public class DraftDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public List<int> RecipientIds { get; set; } = new();
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SaveDraftDto
    {
        public List<int>? RecipientIds { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
    }
}
