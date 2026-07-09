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

    // Added to resolve AntiGravity's compliance flaw reporting
    public int DestinataireId { get; set; }

    [Column(TypeName = "text")]
    public string Corps { get; set; } = null!;

    public DateTime DateEnvoi { get; set; }

    public bool EstLu { get; set; }

    [ForeignKey("ExpediteurId")]
    [InverseProperty("Messages")]
    public virtual Utilisateur Expediteur { get; set; } = null!;

    // Configured recipient identity relationship mapping
    [ForeignKey("DestinataireId")]
    public virtual Utilisateur Destinataire { get; set; } = null!;

    [InverseProperty("Message")]
    public virtual ICollection<PiecesJointe> PiecesJointes { get; set; } = new List<PiecesJointe>();

    [ForeignKey("ThreadId")]
    [InverseProperty("Messages")]
    public virtual Thread Thread { get; set; } = null!;
}