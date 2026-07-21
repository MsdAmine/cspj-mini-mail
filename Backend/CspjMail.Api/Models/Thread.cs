using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CspjMail.Api.Models;

public partial class Thread
{
    [Key]
    public int Id { get; set; }

    [StringLength(255)]
    [Unicode(false)]
    public string Objet { get; set; } = null!;

    public DateTime DateCreation { get; set; }

    public bool EstArchive { get; set; }

    /// <summary>True when this thread has more than one recipient (group messaging).</summary>
    public bool EstGroupe { get; set; }

    /// <summary>Optional display name for group threads (e.g. "Équipe RH").</summary>
    [StringLength(200)]
    [Unicode(false)]
    public string? TitreGroupe { get; set; }

    [InverseProperty("Thread")]
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    /// <summary>All participants (creator + recipients) recorded at thread creation.</summary>
    [InverseProperty("Thread")]
    public virtual ICollection<ThreadParticipant> Participants { get; set; } = new List<ThreadParticipant>();
}
