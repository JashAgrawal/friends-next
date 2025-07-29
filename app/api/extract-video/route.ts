import { NextRequest, NextResponse } from "next/server";
import { extractVideoUrl } from "@/lib/video-extractor";
import { getEmbedUrl } from "@/lib/server-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serverId = searchParams.get("serverId");
  const mediaType = searchParams.get("mediaType");
  const id = searchParams.get("id");
  const seasonNumber = searchParams.get("seasonNumber");
  const episodeNumber = searchParams.get("episodeNumber");
  
  if (!serverId || !mediaType || !id) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }
  
  try {
    // Get the embed URL for the selected server
    const embedUrl = getEmbedUrl(
      parseInt(serverId),
      mediaType,
      id,
      seasonNumber || undefined,
      episodeNumber || undefined
    );
    
    // Extract the direct video URL from the embed URL
    const videoUrl = await extractVideoUrl(embedUrl);
    
    if (!videoUrl) {
      return NextResponse.json(
        { 
          error: "Could not extract video URL",
          embedUrl: embedUrl,
          fallbackToIframe: true
        },
        { status: 200 }
      );
    }
    
    // If the extracted URL is the same as the embed URL, we need to use iframe fallback
    if (videoUrl.videoUrl === embedUrl) {
      return NextResponse.json({
        videoUrl: null,
        embedUrl: embedUrl,
        fallbackToIframe: true
      });
    }
    
    return NextResponse.json({ 
      videoUrl:videoUrl.videoUrl,
      embedUrl,
      fallbackToIframe: false
    });
  } catch (error) {
    console.error("Error extracting video URL:", error);
    return NextResponse.json(
      { 
        error: "Failed to extract video URL",
        embedUrl: getEmbedUrl(
          parseInt(serverId),
          mediaType,
          id,
          seasonNumber || undefined,
          episodeNumber || undefined
        ),
        fallbackToIframe: true
      },
      { status: 200 }
    );
  }
}