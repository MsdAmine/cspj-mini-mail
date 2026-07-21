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
        public string EntrepriseNom { get; set; } = null!;
    }

    public class CreateUserDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Nom { get; set; } = null!;
        public string Prenom { get; set; } = null!;
        public string Role { get; set; } = null!; // Administrateur, Fonctionnaire, Association
        public int EntrepriseId { get; set; }
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
        public int EntrepriseId { get; set; }
        public string EntrepriseNom { get; set; } = null!;
        public bool Actif { get; set; }
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
}