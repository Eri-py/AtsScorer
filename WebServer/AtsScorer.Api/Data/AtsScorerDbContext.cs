using System;
using AtsScorer.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Data;

public class AtsScorerDbContext(DbContextOptions<AtsScorerDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users { get; set; }
    public DbSet<RefreshTokenEntity> RefreshTokens { get; set; }
    public DbSet<SavedFileEntity> SavedFiles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>().HasIndex(u => u.Email).IsUnique();

        modelBuilder
            .Entity<SavedFileEntity>()
            .HasOne(sf => sf.User)
            .WithMany(u => u.SavedFiles)
            .HasForeignKey(sf => sf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedFileEntity>().HasIndex(sf => sf.UserId);
        modelBuilder.Entity<SavedFileEntity>().HasIndex(sf => sf.ObjectKey).IsUnique();
    }
}
