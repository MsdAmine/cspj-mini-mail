using System;
using System.Collections.Generic;

namespace CspjMail.Api.Models;

public partial class Entreprise
{
    public int Id { get; set; }

    public string Nom { get; set; } = null!;

    // Changed from EstSousTraitant to align with the database rename
    public bool EstAssociation { get; set; }

    public DateTime DateCreation { get; set; }

    public virtual ICollection<Utilisateur> Utilisateurs { get; set; } = new List<Utilisateur>();
}