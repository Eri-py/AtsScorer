using Amazon;
using Amazon.Runtime;
using Amazon.S3;

namespace AtsScorer.Api.Services.SavedFileServices;

public static class SavedFileServicesRegistration
{
    public static void AddSavedFileServices(this IServiceCollection services, IConfiguration config)
    {
        var accessKey =
            config["S3:AccessKey"]
            ?? throw new InvalidOperationException("Missing S3:AccessKey configuration.");
        var secretKey =
            config["S3:SecretKey"]
            ?? throw new InvalidOperationException("Missing S3:SecretKey configuration.");
        var region = config["S3:Region"] ?? "us-east-1";
        var serviceUrl = config["S3:ServiceUrl"];
        var forcePathStyle =
            bool.TryParse(config["S3:ForcePathStyle"], out var parsedForcePathStyle)
            && parsedForcePathStyle;
        var useHttp = bool.TryParse(config["S3:UseHttp"], out var parsedUseHttp) && parsedUseHttp;

        _ = services.AddSingleton<IAmazonS3>(_ =>
        {
            var awsCredentials = new BasicAWSCredentials(accessKey, secretKey);
            var s3Config = new AmazonS3Config();

            if (string.IsNullOrWhiteSpace(serviceUrl))
            {
                s3Config.RegionEndpoint = RegionEndpoint.GetBySystemName(region);
            }
            else
            {
                s3Config.ServiceURL = serviceUrl;
                s3Config.ForcePathStyle = forcePathStyle;
                s3Config.UseHttp = useHttp;
            }

            return new AmazonS3Client(awsCredentials, s3Config);
        });

        services.AddScoped<ISavedFileService, SavedFileService>();
    }
}
