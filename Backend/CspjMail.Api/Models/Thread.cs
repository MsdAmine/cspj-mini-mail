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

    [InverseProperty("Thread")]
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}
