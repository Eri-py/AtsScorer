using System.Security.Claims;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Extensions;
using AtsScorer.Api.Services.SavedFileServices;
using AtsScorer.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers;

[Authorize]
[Route("api/saved-files")]
[ApiController]
public class SavedFilesController(ISavedFileService savedFileService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SavedFileResponse>>> GetUserFiles()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Result.Unauthorized("User is not authenticated.").ToActionResult();
        }

        var result = await savedFileService.GetUserFilesAsync(userId);
        return result.ToActionResult();
    }
}
