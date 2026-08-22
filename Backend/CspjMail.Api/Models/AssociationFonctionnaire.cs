using System.ComponentModel.DataAnnotations.Schema;

namespace CspjMail.Api.Models;

/// <summary>
/// Junction table that links an Association user to their designated
/// Fonctionnaire point(s)-of-contact. Managed by Administrators only.
/// </summary>
public class AssociationFonctionnaire
{
    /// <summary>ID of the Association user (Role = "Association").</summary>
    public int AssociationId { get; set; }

    /// <summary>ID of the assigned Fonctionnaire user (Role = "Fonctionnaire").</summary>
    public int FonctionnaireId { get; set; }

    // Navigation properties
    [ForeignKey("AssociationId")]
    public virtual Utilisateur Association { get; set; } = null!;

    [ForeignKey("FonctionnaireId")]
    public virtual Utilisateur Fonctionnaire { get; set; } = null!;
}
