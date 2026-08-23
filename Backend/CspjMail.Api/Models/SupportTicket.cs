using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CspjMail.Api.Models;

public partial class SupportTicket
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string TicketNumber { get; set; } = null!;

    [Required]
    [StringLength(200)]
    public string Subject { get; set; } = null!;

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "Other"; // AccessRequest, GroupIssue, AccountUpdate, Other

    [Required]
    [StringLength(50)]
    public string Priority { get; set; } = "Normal"; // Low, Normal, Urgent

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed

    public int CreatedByUserId { get; set; }

    public int? AssignedAdminId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("CreatedByUserId")]
    public virtual Utilisateur CreatedByUser { get; set; } = null!;

    [ForeignKey("AssignedAdminId")]
    public virtual Utilisateur? AssignedAdmin { get; set; }

    public virtual ICollection<TicketMessage> Messages { get; set; } = new List<TicketMessage>();
}
