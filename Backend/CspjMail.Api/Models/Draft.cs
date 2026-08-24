using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CspjMail.Api.Models
{
    public class Draft
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public string? RecipientIds { get; set; }

        [MaxLength(255)]
        public string? Subject { get; set; }

        public string? Body { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual Utilisateur User { get; set; } = null!;
    }
}
