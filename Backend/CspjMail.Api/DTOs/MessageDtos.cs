namespace CspjMail.Api.DTOs
{
    // Payload used to start a brand new conversation thread
    public class CreateThreadDto
    {
        public string Objet { get; set; } = null!;
        public string Corps { get; set; } = null!;
        public int DestinataireId { get; set; }
    }

    // Payload used to reply to an existing thread
    public class ReplyMessageDto
    {
        public string Corps { get; set; } = null!;
    }

    // Data structure returned to the frontend representing a single thread conversation view
    public class ThreadDetailsDto
    {
        public int ThreadId { get; set; }
        public string Objet { get; set; } = null!;
        public DateTime DateCreation { get; set; }
        public bool EstArchive { get; set; }
        public List<MessageDisplayDto> Messages { get; set; } = new();
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
}