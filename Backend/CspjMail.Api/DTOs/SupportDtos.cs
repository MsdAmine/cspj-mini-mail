using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CspjMail.Api.DTOs
{
    public class CreateTicketDto
    {
        [Required(ErrorMessage = "Le sujet est obligatoire.")]
        [StringLength(200, ErrorMessage = "Le sujet ne peut pas dépasser 200 caractères.")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "La catégorie est obligatoire.")]
        public string Category { get; set; } = "Other"; // AccessRequest, GroupIssue, AccountUpdate, Other

        [Required(ErrorMessage = "La priorité est obligatoire.")]
        public string Priority { get; set; } = "Normal"; // Low, Normal, Urgent

        [Required(ErrorMessage = "La description ou message initial est obligatoire.")]
        public string Message { get; set; } = string.Empty;
    }

    public class CreateTicketMessageDto
    {
        [Required(ErrorMessage = "Le contenu du message est obligatoire.")]
        public string Content { get; set; } = string.Empty;
    }

    public class UpdateTicketStatusDto
    {
        [Required(ErrorMessage = "Le statut est obligatoire.")]
        public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
    }

    public class TicketMessageDto
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class TicketResponseDto
    {
        public int Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public string CreatedByEmail { get; set; } = string.Empty;
        public string CreatedByRole { get; set; } = string.Empty;
        public string? CreatedByInstitution { get; set; }
        public int? AssignedAdminId { get; set; }
        public string? AssignedAdminName { get; set; }
        public string? AssignedAdminEmail { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int MessagesCount { get; set; }
        public List<TicketMessageDto> Messages { get; set; } = new();
    }
}
