using System.ComponentModel.DataAnnotations.Schema;

namespace CspjMail.Api.Models;

/// <summary>
/// Junction table: records every participant (creator + all recipients) for a thread.
/// This is the primary authorization engine for both 1-to-1 and group threads.
/// </summary>
public class ThreadParticipant
{
    public int ThreadId { get; set; }
    public int UserId { get; set; }

    /// <summary>
    /// Soft-delete flag: when true this participant has deleted the thread from their own view.
    /// Other participants are unaffected.
    /// </summary>
    public bool IsDeletedForUser { get; set; } = false;

    public bool IsStarred { get; set; } = false;

    [ForeignKey("ThreadId")]
    public virtual Thread Thread { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual Utilisateur Utilisateur { get; set; } = null!;
}
