using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;


namespace CspjMail.Api.DTOs
{
    // Payload used to start a brand new conversation thread.
    // Supports both 1-to-1 (DestinataireId) and group (DestinataireIds + TitreGroupe) modes.
    public class CreateThreadDto
    {
        public string Objet { get; set; } = null!;
        public string Corps { get; set; } = null!;

        /// <summary>Used for 1-to-1 messages. Ignored when DestinataireIds is provided.</summary>
        public int? DestinataireId { get; set; }

        /// <summary>Used for group messages. When set with ≥2 IDs the thread is marked as a group.</summary>
        public List<int>? DestinataireIds { get; set; }

        /// <summary>Display name for the group (required when creating a group thread).</summary>
        public string? TitreGroupe { get; set; }

        /// <summary>
        /// When true and DestinataireIds contains ≥2 IDs, the controller creates N independent
        /// 1-to-1 threads (one per recipient) instead of a single shared group chatroom.
        /// </summary>
        public bool EstDiffusion { get; set; }

        public List<IFormFile>? Attachments { get; set; }
    }

    // Payload used to reply to an existing thread
    public class ReplyMessageDto
    {
        public string Corps { get; set; } = null!;
        public List<IFormFile>? Attachments { get; set; }
    }

    // Data structure returned to the frontend representing a single thread conversation view
    public class ThreadDetailsDto
    {
        public int ThreadId { get; set; }
        public string Objet { get; set; } = null!;
        public DateTime DateCreation { get; set; }
        public bool EstArchive { get; set; }
        public bool IsStarred { get; set; }
        public bool EstGroupe { get; set; }
        public string? TitreGroupe { get; set; }
        public List<MessageDisplayDto> Messages { get; set; } = new();
        /// <summary>All participants OTHER than the current user (used for the "De/À" header).</summary>
        public List<ContactDto> Destinataires { get; set; } = new();
        /// <summary>All participants including the current user (for group member summary).</summary>
        public List<ContactDto> TousLesParticipants { get; set; } = new();
    }

    public class PieceJointeDto
    {
        public int Id { get; set; }
        public string NomFichier { get; set; } = null!;
        public string CheminFichier { get; set; } = null!;
        public int TailleOctets { get; set; }
        // Nullable: DownloadAttachment already falls back to "application/octet-stream" when null
        public string? TypeContenu { get; set; }
    }

    public class MessageDisplayDto
    {
        public int MessageId { get; set; }
        public string Corps { get; set; } = null!;
        public DateTime DateEnvoi { get; set; }
        public bool EstLu { get; set; }
        public int ExpediteurId { get; set; }
        public string ExpediteurNomComplet { get; set; } = null!;
        public string ExpediteurRole { get; set; } = null!;
        public List<PieceJointeDto> PiecesJointes { get; set; } = new();
    }

    // Represents a single row in the Inbox / Sent / Archive lists
    public class ThreadSummaryDto
    {
        public int ThreadId { get; set; } = default!;
        public string Objet { get; set; } = null!;
        public DateTime DerniereActivite { get; set; }
        public string DernierMessageCorps { get; set; } = null!;
        public string DernierExpediteurNom { get; set; } = null!;
        public bool ADesMessagesNonLus { get; set; }
        public bool EstArchive { get; set; }
        public bool IsStarred { get; set; }
        /// <summary>True if this is a group thread.</summary>
        public bool EstGroupe { get; set; }
        /// <summary>Display name for group threads.</summary>
        public string? TitreGroupe { get; set; }
        /// <summary>Total number of participants (for display in the sidebar).</summary>
        public int NombreParticipants { get; set; }
    }

    // Represents a contact selectable when creating a new thread
    public class ContactDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string NomComplet { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string InstitutionNom { get; set; } = null!;
    }

    public class CreateUserDto
    {
        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;

        [Required]
        [StringLength(128, MinimumLength = 8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères.")]
        public string Password { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Nom { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Prenom { get; set; } = null!;

        [Required]
        [StringLength(30)]
        public string Role { get; set; } = null!; // Administrateur, Fonctionnaire, Association

        [Range(1, int.MaxValue)]
        public int InstitutionId { get; set; }

        public List<int>? FonctionnaireIds { get; set; }
    }

    public class CreateInstitutionDto
    {
        public string Nom { get; set; } = null!;
        public bool EstAssociation { get; set; }
    }

    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalThreads { get; set; }
        public int TotalMessagesSent { get; set; }
    }

    public class UserDetailsDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string Nom { get; set; } = null!;
        public string Prenom { get; set; } = null!;
        public string Role { get; set; } = null!;
        public int InstitutionId { get; set; }
        public string InstitutionNom { get; set; } = null!;
        public bool Actif { get; set; }
        public bool HasTwoFactor { get; set; }
        public DateTime DateCreation { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool Actif { get; set; }
    }

    public class AdminThreadDto
    {
        public int Id { get; set; }
        public string Objet { get; set; } = null!;
        public string Expediteur { get; set; } = null!;
        public string ExpediteurEmail { get; set; } = null!;
        public string Destinataire { get; set; } = null!;
        public string DestinataireEmail { get; set; } = null!;
        public DateTime Date { get; set; }
        public string StatutLecture { get; set; } = null!;
        public string StatutAcheminement { get; set; } = null!;
        public bool HasAttachment { get; set; }
        public string PieceJointeNom { get; set; } = string.Empty;
    }

    public class AuditLogDto
    {
        public int Id { get; set; }
        public DateTime DateHeure { get; set; }
        public string TypeAction { get; set; } = null!;
        public string Utilisateur { get; set; } = null!;
        public string Description { get; set; } = null!;
    }

    /// <summary>
    /// Payload for the dedicated POST /messages/groups/create endpoint.
    /// Accepts JSON (not multipart/form-data) — attachments can be added via reply.
    /// </summary>
    public class CreateGroupThreadDto
    {
        /// <summary>Display name for the group (required).</summary>
        public string GroupTitle { get; set; } = null!;

        /// <summary>Initial message body (HTML allowed).</summary>
        public string Corps { get; set; } = null!;

        /// <summary>IDs of participants to add (excluding the creator, who is auto-added).</summary>
        public List<int> ParticipantIds { get; set; } = new();
    }

    /// <summary>
    /// Payload for PUT /api/admin/users/{id}/assignments.
    /// Provides the full replacement list of Fonctionnaire IDs for an Association user.
    /// </summary>
    public class SetAssignmentsDto
    {
        public List<int> FonctionnaireIds { get; set; } = new();
    }

    public class TransferOwnerDto
    {
        public int NewOwnerId { get; set; }
    }

    public class ResetPasswordDto
    {
        public string? NewPassword { get; set; }
    }

    public class UpdateUserDto
    {
        public string Nom { get; set; } = null!;
        public string Prenom { get; set; } = null!;
        public string Email { get; set; } = null!;
        public int InstitutionId { get; set; }
    }

    public class BulkReadDto
    {
        public List<int> ThreadIds { get; set; } = new();
        public bool IsRead { get; set; } = true;
    }

    public class BulkArchiveDto
    {
        public List<int> ThreadIds { get; set; } = new();
        public bool IsArchived { get; set; } = true;
    }

    public class BulkDeleteDto
    {
        public List<int> ThreadIds { get; set; } = new();
    }
}