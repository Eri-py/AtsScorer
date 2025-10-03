using System;
using AtsScorer.Api.Data;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Results;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Services.AuthServices.SignUpServices;

public class SignUpService(AtsScorerDbContext context) : ISignUpService
{
    public async Task<Result<StartSignUpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        var userCount = await context.Users.CountAsync();

        return Result<StartSignUpResponse>.Success(
            new StartSignUpResponse { OtpExpiresAt = $"{userCount} {request.Email}" }
        );
    }

    public Task<Result> VerifyOtpAsync(VerifyOtpRequest request)
    {
        throw new NotImplementedException();
    }

    public Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        throw new NotImplementedException();
    }
}
