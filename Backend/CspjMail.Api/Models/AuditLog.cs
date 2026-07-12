using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CspjMail.Api.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        public DateTime DateHeure { get; set; }

        [StringLength(255)]
        public string TypeAction { get; set; } = null!;

        [StringLength(255)]
        public string Utilisateur { get; set; } = null!;

        [Column(TypeName = "nvarchar(max)")]
        public string Description { get; set; } = null!;
    }
}
