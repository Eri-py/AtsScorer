using AtsScorer.Api.Dtos;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.AuthServices.LoginService;

public interface ILoginService
{
    /// <summary>
    /// Authenticates a user with their email and password, returning auth tokens on success.
    /// </summary>
    /// <param name="request">The login request containing email and password. See <see cref="LoginRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    public Task<Result<AuthResult>> LoginAsync(LoginRequest request, CancellationToken ct);
}
