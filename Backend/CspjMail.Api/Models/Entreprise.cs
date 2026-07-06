using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CspjMail.Api.Models;

public partial class Entreprise
{
    [Key]
    public int Id { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string Nom { get; set; } = null!;

    public bool EstSousTraitant { get; set; }

    public DateTime DateCreation { get; set; }

    [InverseProperty("Entreprise")]
    public virtual ICollection<Utilisateur> Utilisateurs { get; set; } = new List<Utilisateur>();
}
