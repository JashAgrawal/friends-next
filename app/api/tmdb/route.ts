import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || !url.startsWith('https://api.themoviedb.org/3')) {
      return NextResponse.json({ error: 'Invalid TMDB URL' }, { status: 400 });
    }
    
    // Replace the placeholder with the actual API key
    const apiUrl = url.includes('api_key=') 
      ? url 
      : `${url}&api_key=${process.env.TMDB_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `TMDB API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in TMDB API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}