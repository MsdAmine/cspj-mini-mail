using Microsoft.AspNetCore.Http;

namespace CspjMail.Api.DTOs
{
    // Payload used to start a brand new conversation thread
    public class CreateThreadDto
    {
        public string Objet { get; set; } = null!;
        public string Corps { get; set; } = null!;
        public int DestinataireId { get; set; }
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
        public List<MessageDisplayDto> Messages { get; set; } = new();
        public List<ContactDto> Destinataires { get; set; } = new();
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