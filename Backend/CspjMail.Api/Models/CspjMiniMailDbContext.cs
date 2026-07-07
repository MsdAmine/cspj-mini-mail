using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace CspjMail.Api.Models;

public partial class CspjMiniMailDbContext : DbContext
{
    public CspjMiniMailDbContext()
    {
    }

    public CspjMiniMailDbContext(DbContextOptions<CspjMiniMailDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Entreprise> Entreprises { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<PiecesJointe> PiecesJointes { get; set; }

    public virtual DbSet<Thread> Threads { get; set; }

    public virtual DbSet<Utilisateur> Utilisateurs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Connection string is read from appsettings.json via Program.cs registration.
        // Leaving this empty avoids scaffolding warnings and hardcoded credentials.
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Entreprise>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Entrepri__3214EC074215BC75");

            entity.Property(e => e.DateCreation).HasDefaultValueSql("(getdate())");
    
            // Explicitly configure EF Core to map to the renamed 'EstAssociation' database column
            entity.Property(e => e.EstAssociation)
                .HasColumnName("EstAssociation")
                .HasDefaultValue(true);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Messages__3214EC07E91A7AD3");

            entity.Property(e => e.DateEnvoi).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Expediteur).WithMany(p => p.Messages)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Messages_Utilisateurs");

            entity.HasOne(d => d.Thread).WithMany(p => p.Messages).HasConstraintName("FK_Messages_Threads");
        });

        modelBuilder.Entity<PiecesJointe>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PiecesJo__3214EC07CB28222B");

            entity.Property(e => e.DateTeleversement).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Message).WithMany(p => p.PiecesJointes).HasConstraintName("FK_PiecesJointes_Messages");
        });

        modelBuilder.Entity<Thread>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Threads__3214EC07ADEA7B22");

            entity.Property(e => e.DateCreation).HasDefaultValueSql("(getdate())");
        });

        modelBuilder.Entity<Utilisateur>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Utilisat__3214EC07C448F6EE");

            entity.Property(e => e.Actif).HasDefaultValue(true);
            entity.Property(e => e.DateCreation).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Entreprise).WithMany(p => p.Utilisateurs)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Utilisateurs_Entreprises");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}