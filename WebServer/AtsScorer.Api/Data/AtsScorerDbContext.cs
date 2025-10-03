using System;
using AtsScorer.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Data;

public class AtsScorerDbContext(DbContextOptions<AtsScorerDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>().HasIndex(u => u.Email).IsUnique();
    }
}
