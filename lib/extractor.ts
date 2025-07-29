import puppeteer from "puppeteer";

export async function getVideoStreamURL(vidsrcEmbedUrl: string): Promise<string | null> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Opening ${vidsrcEmbedUrl}...`);
    await page.goto(vidsrcEmbedUrl, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector("iframe", { timeout: 10000 });
    const frameHandle = await page.$("iframe");

    if (!frameHandle) throw new Error("No iframe found on the page.");

    const frame = await frameHandle.contentFrame();
    if (!frame) throw new Error("Failed to access iframe content.");

    console.log("✅ Iframe loaded. Scanning for video source...");
    // await frame.waitForTimeout(5000); // let JS load

    const videoSrc: string | null = await frame.evaluate(() => {
      // 1. Check <video> tag
      const video = document.querySelector("video");
      if (video?.src) return video.src;

      // 2. Check <source> tag
      const source = document.querySelector("source");
      if (source?.src) return source.src;

      // 3. Look inside scripts for .m3u8 or .mp4
      const scripts = Array.from(document.querySelectorAll("script")).map(s => s.textContent || "");
      const regex = /(https?:\/\/[^\s"'\\]+?\.(m3u8|mp4))/i;

      for (const script of scripts) {
        const match = script.match(regex);
        if (match) return match[1];
      }

      return null;
    });

    return videoSrc;
  } catch (err: any) {
    console.error("❌ Error extracting video URL:", err.message || err);
    return null;
  } finally {
    await browser.close();
  }
}
