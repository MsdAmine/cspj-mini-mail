using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CspjMail.Api.Models;

[Index("Email", Name = "UQ__Utilisat__A9D1053454370B33", IsUnique = true)]
public partial class Utilisateur
{
    [Key]
    public int Id { get; set; }

    [StringLength(150)]
    [Unicode(false)]
    public string Email { get; set; } = null!;

    [StringLength(255)]
    [Unicode(false)]
    public string MotDePasseHash { get; set; } = null!;

    [StringLength(50)]
    [Unicode(false)]
    public string Nom { get; set; } = null!;

    [StringLength(50)]
    [Unicode(false)]
    public string Prenom { get; set; } = null!;

    [StringLength(30)]
    [Unicode(false)]
    public string Role { get; set; } = null!;

    public int EntrepriseId { get; set; }

    public bool Actif { get; set; }

    public DateTime DateCreation { get; set; }

    [ForeignKey("EntrepriseId")]
    [InverseProperty("Utilisateurs")]
    public virtual Entreprise Entreprise { get; set; } = null!;

    [InverseProperty("Expediteur")]
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    [StringLength(6)]
    [Unicode(false)]
    public string? TwoFactorCode { get; set; }

    public DateTime? TwoFactorExpiry { get; set; }
}
