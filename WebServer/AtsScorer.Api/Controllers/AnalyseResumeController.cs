using AtsScorer.Api.Extensions;
using AtsScorer.Api.GrpcContracts;
using AtsScorer.Api.Services.AnalyseResumeServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers
{
    [Authorize]
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
            var analysisResult = await analyseResume.AnalyseResumeAsync(
                resume: file,
                fileName: fileName,
                jobDescription: jobDescription
            );
            return analysisResult.ToActionResult();
        }
    }
}
