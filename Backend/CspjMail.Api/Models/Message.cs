using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CspjMail.Api.Models;

public partial class Message
{
    [Key]
    public int Id { get; set; }

    public int ThreadId { get; set; }

    public int ExpediteurId { get; set; }

    /// <summary>
    /// Populated for 1-to-1 messages. Null for group thread messages —
    /// authorization is handled via ThreadParticipant in that case.
    /// </summary>
    public int? DestinataireId { get; set; }

    [Column(TypeName = "text")]
    public string Corps { get; set; } = null!;

    public DateTime DateEnvoi { get; set; }

    public bool EstLu { get; set; }

    [ForeignKey("ExpediteurId")]
    [InverseProperty("Messages")]
    public virtual Utilisateur Expediteur { get; set; } = null!;

    // Nullable navigation — only populated for 1-to-1 messages
    [ForeignKey("DestinataireId")]
    public virtual Utilisateur? Destinataire { get; set; }

    [InverseProperty("Message")]
    public virtual ICollection<PiecesJointe> PiecesJointes { get; set; } = new List<PiecesJointe>();

    [ForeignKey("ThreadId")]
    [InverseProperty("Messages")]
    public virtual Thread Thread { get; set; } = null!;
}