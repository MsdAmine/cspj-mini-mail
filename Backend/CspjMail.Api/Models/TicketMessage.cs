using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CspjMail.Api.Models;

public partial class TicketMessage
{
    [Key]
    public int Id { get; set; }

    public int TicketId { get; set; }

    public int SenderId { get; set; }

    [Required]
    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("TicketId")]
    public virtual SupportTicket Ticket { get; set; } = null!;

    [ForeignKey("SenderId")]
    public virtual Utilisateur Sender { get; set; } = null!;
}
