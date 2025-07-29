"use server";

import puppeteer, { Browser, Page } from "puppeteer";

interface VideoExtractionResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  metadata?: {
    title?: string;
    duration?: number;
    quality?: string;
    format?: string;
  };
}

interface VideoSource {
  url: string;
  quality?: string;
  format?: string;
  type?: string;
}

/**
 * Enhanced video URL extractor with better error handling and multiple strategies
 * WARNING: Only use this for content you own or have permission to access
 */
class VideoExtractor {
  private browser: Browser | null = null;
  private readonly timeout = 60000;
  private readonly userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-blink-features=AutomationControlled",
          "--autoplay-policy=no-user-gesture-required",
          "--disable-dev-shm-usage",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-extensions",
        ],
      });
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Extract video URL with multiple strategies and better error handling
   */
  async extractVideoUrl(embedUrl: string): Promise<VideoExtractionResult> {
    try {
      await this.initBrowser();
      if (!this.browser) {
        throw new Error("Failed to initialize browser");
      }

      const page = await this.browser.newPage();
      await this.setupPage(page);

      const mediaRequests: VideoSource[] = [];

      // Enhanced request interception
      await page.setRequestInterception(true);

      page.on("request", (request) => {
        const url = request.url();
        const resourceType = request.resourceType();

        // Capture various media types
        if (this.isMediaRequest(url, resourceType)) {
          const source: VideoSource = {
            url,
            format: this.getFormatFromUrl(url),
            type: resourceType,
          };

          mediaRequests.push(source);
          console.log(`🎥 Media request captured: ${url}`);
        }

        request.continue();
      });

      // Listen for response to get additional metadata
      page.on("response", async (response) => {
        const url = response.url();
        if (this.isMediaRequest(url)) {
          const headers = response.headers();
          const contentType = headers["content-type"];
          const contentLength = headers["content-length"];

          // console.log(
          //   `📊 Media response: ${url}, Type: ${contentType}, Size: ${contentLength}`
          // );
        }
      });

      const result = await this.tryMultipleStrategies(
        page,
        embedUrl,
        mediaRequests
      );
      await page.close();

      return result;
    } catch (error: any) {
      console.error("❌ Extraction failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async setupPage(page: Page): Promise<void> {
    await page.setUserAgent(this.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);

    // Inject console capture
    await page.evaluateOnNewDocument(() => {
      const originalLog = console.log;
      (window as any).capturedLogs = [];
      console.log = (...args: any[]) => {
        (window as any).capturedLogs.push(args.join(" "));
        originalLog.apply(console, args);
      };
    });
  }

  private isMediaRequest(url: string, resourceType?: string): boolean {
    const mediaPatterns = [
      /\.m3u8(\?.*)?$/i,
      /\.mp4(\?.*)?$/i,
      /\.webm(\?.*)?$/i,
      /\.mkv(\?.*)?$/i,
      /\.ts(\?.*)?$/i,
      /\/stream\//i,
      /\/hls\//i,
      /\/dash\//i,
      /\/video\//i,
      /\/media\//i,
      /playlist\.m3u8/i,
      /manifest\.mpd/i,
    ];

    const isMediaUrl = mediaPatterns.some((pattern) => pattern.test(url));
    const isMediaResource =
      resourceType === "media" ||
      resourceType === "fetch" ||
      resourceType === "xhr";

    return isMediaUrl || (isMediaResource && url.includes("video"));
  }

  private getFormatFromUrl(url: string): string {
    if (url.includes(".m3u8")) return "HLS";
    if (url.includes(".mpd")) return "DASH";
    if (url.includes(".mp4")) return "MP4";
    if (url.includes(".webm")) return "WebM";
    return "Unknown";
  }

  private async tryMultipleStrategies(
    page: Page,
    embedUrl: string,
    mediaRequests: VideoSource[]
  ): Promise<VideoExtractionResult> {
    // Strategy 1: Direct navigation and wait for media requests
    console.log("🔍 Strategy 1: Direct navigation");
    const strategy1Result = await this.strategy1DirectNavigation(
      page,
      embedUrl,
      mediaRequests
    );
    console.log(strategy1Result.videoUrl)
    if (strategy1Result.success) return strategy1Result;

    // Strategy 2: Iframe extraction
    console.log("🔍 Strategy 2: Iframe extraction");
    const strategy2Result = await this.strategy2IframeExtraction(
      page,
      mediaRequests
    );
    console.log(strategy2Result.videoUrl)
    if (strategy2Result.success) return strategy2Result;

    // Strategy 3: JavaScript execution and DOM analysis
    console.log("🔍 Strategy 3: DOM analysis");
    const strategy3Result = await this.strategy3DomAnalysis(page);
    console.log(strategy3Result.videoUrl)
    if (strategy3Result.success) return strategy3Result;

    // Strategy 4: Network log analysis
    console.log("🔍 Strategy 4: Network analysis");
    return this.strategy4NetworkAnalysis(mediaRequests);
  }

  private async strategy1DirectNavigation(
    page: Page,
    embedUrl: string,
    mediaRequests: VideoSource[]
  ): Promise<VideoExtractionResult> {
    try {
      await page.goto(embedUrl, {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      // Wait for potential lazy-loaded content
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Try to trigger video loading by clicking play buttons
      await this.triggerVideoLoad(page);

      if (mediaRequests.length > 0) {
        const bestSource = this.selectBestVideoSource(mediaRequests);
        return {
          success: true,
          videoUrl: bestSource.url,
          metadata: {
            format: bestSource.format,
            quality: bestSource.quality,
          },
        };
      }

      return { success: false, error: "No media requests captured" };
    } catch (error: any) {
      return { success: false, error: `Strategy 1 failed: ${error.message}` };
    }
  }

  private async strategy2IframeExtraction(
    page: Page,
    mediaRequests: VideoSource[]
  ): Promise<VideoExtractionResult> {
    try {
      const iframes = await page.$$("iframe");

      for (const iframe of iframes) {
        const frame = await iframe.contentFrame();
        if (!frame) continue;

        // Wait for iframe content to load
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Try to extract sources from iframe
        const iframeSources = await frame.evaluate(() => {
          const sources: string[] = [];

          // Check video elements
          const videos = document.querySelectorAll("video");
          videos.forEach((video) => {
            if (video.src && !video.src.startsWith("blob:")) {
              sources.push(video.src);
            }
          });

          // Check source elements
          const sourceElements = document.querySelectorAll("source");
          sourceElements.forEach((source) => {
            if (source.src) sources.push(source.src);
          });

          return sources;
        });

        if (iframeSources.length > 0) {
          return {
            success: true,
            videoUrl: iframeSources[0],
            metadata: { format: this.getFormatFromUrl(iframeSources[0]) },
          };
        }
      }

      return { success: false, error: "No sources found in iframes" };
    } catch (error: any) {
      return { success: false, error: `Strategy 2 failed: ${error.message}` };
    }
  }

  private async strategy3DomAnalysis(
    page: Page
  ): Promise<VideoExtractionResult> {
    try {
      const result = await page.evaluate(() => {
        const sources: string[] = [];

        // Check all script tags for video URLs
        const scripts = Array.from(document.querySelectorAll("script"));
        const urlRegex = /(https?:\/\/[^\s"'`]+\.(m3u8|mp4|webm|mkv))/gi;

        scripts.forEach((script) => {
          const content = script.textContent || script.innerHTML;
          let match;
          while ((match = urlRegex.exec(content)) !== null) {
            sources.push(match[1]);
          }
        });

        // Check for player configuration objects
        const playerConfigRegex = /(?:source|src|url)["']\s*:\s*["']([^"']+)/gi;
        const pageContent = document.documentElement.innerHTML;
        let match;
        while ((match = playerConfigRegex.exec(pageContent)) !== null) {
          if (
            match[1].includes("http") &&
            (match[1].includes(".m3u8") || match[1].includes(".mp4"))
          ) {
            sources.push(match[1]);
          }
        }

        return sources;
      });

      if (result.length > 0) {
        return {
          success: true,
          videoUrl: result[0],
          metadata: { format: this.getFormatFromUrl(result[0]) },
        };
      }

      return { success: false, error: "No sources found in DOM analysis" };
    } catch (error: any) {
      return { success: false, error: `Strategy 3 failed: ${error.message}` };
    }
  }

  private strategy4NetworkAnalysis(
    mediaRequests: VideoSource[]
  ): VideoExtractionResult {
    if (mediaRequests.length === 0) {
      return { success: false, error: "No media requests captured" };
    }

    const bestSource = this.selectBestVideoSource(mediaRequests);
    return {
      success: true,
      videoUrl: bestSource.url,
      metadata: {
        format: bestSource.format,
        quality: bestSource.quality,
      },
    };
  }

  private selectBestVideoSource(sources: VideoSource[]): VideoSource {
    // Prioritize by format preference
    const formatPriority = ["MP4", "WebM", "HLS", "DASH", "Unknown"];

    return sources.sort((a, b) => {
      const aIndex = formatPriority.indexOf(a.format || "Unknown");
      const bIndex = formatPriority.indexOf(b.format || "Unknown");
      return aIndex - bIndex;
    })[0];
  }

  private async triggerVideoLoad(page: Page): Promise<void> {
    try {
      // Try to find and click play buttons
      const playSelectors = [
        'button[aria-label*="play" i]',
        'button[title*="play" i]',
        ".play-button",
        ".vjs-play-control",
        '[data-testid*="play"]',
        'button:has(svg[data-icon="play"])',
      ];

      for (const selector of playSelectors) {
        try {
          await page.click(selector, { delay: 1000 });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          break;
        } catch {
          // Continue to next selector
        }
      }

      // Try to trigger video load by scrolling
      await page.evaluate(() => {
        const videos = document.querySelectorAll("video");
        videos.forEach((video) => {
          video.scrollIntoView();
          video.load();
        });
      });
    } catch (error) {
      console.log("Could not trigger video load:", error);
    }
  }
}

// Usage example
export async function extractVideoUrl(
  embedUrl: string
): Promise<VideoExtractionResult> {
  const extractor = new VideoExtractor();
  try {
    const result = await extractor.extractVideoUrl(embedUrl);
    return result;
  } finally {
    await extractor.closeBrowser();
  }
}

// Helper function for batch processing
export async function extractMultipleVideos(
  embedUrls: string[]
): Promise<VideoExtractionResult[]> {
  const extractor = new VideoExtractor();
  const results: VideoExtractionResult[] = [];

  try {
    for (const url of embedUrls) {
      const result = await extractor.extractVideoUrl(url);
      results.push(result);

      // Add delay between requests to be respectful
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } finally {
    await extractor.closeBrowser();
  }

  return results;
}
