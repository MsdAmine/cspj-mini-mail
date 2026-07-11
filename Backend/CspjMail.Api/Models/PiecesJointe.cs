using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CspjMail.Api.Models;

public partial class PiecesJointe
{
    [Key]
    public int Id { get; set; }

    public int MessageId { get; set; }

    [StringLength(255)]
    [Unicode(false)]
    public string NomFichier { get; set; } = null!;

    [StringLength(500)]
    [Unicode(false)]
    public string CheminFichier { get; set; } = null!;

    public int TailleFichier { get; set; }

    public DateTime DateTeleversement { get; set; }

    [ForeignKey("MessageId")]
    [InverseProperty("PiecesJointes")]
    public virtual Message Message { get; set; } = null!;
}
