using AtsScorer.Api.Data;
using AtsScorer.Api.Services.AnalyseResumeServices;
using AtsScorer.Api.Services.AuthServices;
using AtsScorer.Api.Services.EmailServices;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(
            name: builder.Configuration["ClientOrigin:Name"]!,
            policy =>
            {
                policy
                    .WithOrigins(
                        builder.Configuration["ClientOrigin:Local"]!,
                        builder.Configuration["ClientOrigin:Network"]!
                    )
                    .AllowAnyHeader()
                    .AllowCredentials();
            }
        );
    });
}

builder.Services.AddMemoryCache();
builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddEmailServices(builder.Environment);
builder.Services.AddResumeAnalysisServices(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors(builder.Configuration["ClientOrigin:Name"]!);

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
