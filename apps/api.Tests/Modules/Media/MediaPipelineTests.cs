using api.Modules.Media;
using FluentAssertions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace api.Tests.Modules.Media;

public sealed class MediaPipelineTests
{
    [Theory]
    [InlineData("banner", 1920, 1080)]
    [InlineData("book-cover", 1200, 1800)]
    [InlineData("avatar", 512, 512)]
    [InlineData("generic-media", 2048, 2048)]
    public async Task Processor_applies_profile_bounds(string profile, int maxWidth, int maxHeight)
    {
        using var source = new Image<Rgba32>(3000, 2200);
        await using var input = new MemoryStream();
        await source.SaveAsPngAsync(input); input.Position = 0;

        var result = await new ImageSharpMediaProcessor().ProcessAsync(input, profile, CancellationToken.None);

        result.Width.Should().BeLessThanOrEqualTo(maxWidth);
        result.Height.Should().BeLessThanOrEqualTo(maxHeight);
        result.MimeType.Should().Be("image/jpeg");
        result.Bytes.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Processor_rejects_unknown_profile()
    {
        await using var input = new MemoryStream([1, 2, 3]);
        var action = () => new ImageSharpMediaProcessor().ProcessAsync(input, "unknown", CancellationToken.None);
        await action.Should().ThrowAsync<ArgumentException>();
    }
}
