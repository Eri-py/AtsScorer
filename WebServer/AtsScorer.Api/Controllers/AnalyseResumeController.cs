using System.Security.Claims;
using AtsScorer.Api.Extensions;
using AtsScorer.Api.GrpcContracts;
using AtsScorer.Api.Services.AnalyseResumeServices;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers
{
    [Route("api/analyse-resume")]
    [ApiController]
    public class AnalyseResumeController(IAnalyseResumeService analyseResume) : ControllerBase
    {
        [HttpPost]
        public async Task<ActionResult<AnalyseResumeResponse>> AnalyseResume(
            [FromForm] IFormFile file,
            [FromForm] string fileName,
            [FromForm] string jobDescription
        )
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = Guid.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : null;

            var analysisResult = await analyseResume.AnalyseResumeAsync(
                userId: userId,
                resume: file,
                fileName: fileName,
                jobDescription: jobDescription
            );
            return analysisResult.ToActionResult();
        }
    }
}
