"use client"

import { MovieRow } from "./MovieRow"

// Sample movie data for testing
const sampleMovies = [
  {
    id: 1,
    title: "Sample Movie 1",
    poster_path: "/sample-poster-1.jpg",
    backdrop_path: "/sample-backdrop-1.jpg",
    overview: "This is a sample movie for testing.",
    vote_average: 8.5,
    release_date: "2023-01-01",
    genre_ids: [28, 12, 878],
    media_type: "movie"
  },
  {
    id: 2,
    title: "Sample Movie 2",
    poster_path: "/sample-poster-2.jpg",
    backdrop_path: "/sample-backdrop-2.jpg",
    overview: "This is another sample movie for testing.",
    vote_average: 7.8,
    release_date: "2023-02-15",
    genre_ids: [35, 10749],
    media_type: "movie"
  },
  {
    id: 3,
    name: "Sample TV Show",
    poster_path: "/sample-poster-3.jpg",
    backdrop_path: "/sample-backdrop-3.jpg",
    overview: "This is a sample TV show for testing.",
    vote_average: 9.2,
    first_air_date: "2023-03-10",
    genre_ids: [18, 10765],
    media_type: "tv"
  },
  {
    id: 4,
    title: "Sample Movie 4",
    poster_path: "/sample-poster-4.jpg",
    backdrop_path: "/sample-backdrop-4.jpg",
    overview: "This is yet another sample movie for testing.",
    vote_average: 6.9,
    release_date: "2023-04-20",
    genre_ids: [27, 53],
    media_type: "movie"
  },
  {
    id: 5,
    name: "Sample TV Show 2",
    poster_path: "/sample-poster-5.jpg",
    backdrop_path: "/sample-backdrop-5.jpg",
    overview: "This is another sample TV show for testing.",
    vote_average: 8.1,
    first_air_date: "2023-05-05",
    genre_ids: [80, 9648],
    media_type: "tv"
  },
  {
    id: 6,
    title: "Sample Movie 6",
    poster_path: "/sample-poster-6.jpg",
    backdrop_path: "/sample-backdrop-6.jpg",
    overview: "This is the sixth sample movie for testing.",
    vote_average: 7.5,
    release_date: "2023-06-15",
    genre_ids: [12, 14],
    media_type: "movie"
  },
  {
    id: 7,
    title: "Sample Movie 7",
    poster_path: "/sample-poster-7.jpg",
    backdrop_path: "/sample-backdrop-7.jpg",
    overview: "This is the seventh sample movie for testing.",
    vote_average: 8.3,
    release_date: "2023-07-20",
    genre_ids: [28, 878],
    media_type: "movie"
  },
  {
    id: 8,
    name: "Sample TV Show 3",
    poster_path: "/sample-poster-8.jpg",
    backdrop_path: "/sample-backdrop-8.jpg",
    overview: "This is the third sample TV show for testing.",
    vote_average: 7.7,
    first_air_date: "2023-08-10",
    genre_ids: [10759, 10765],
    media_type: "tv"
  }
]

export default function MovieRowTest() {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-white">MovieRow Component Test</h1>
      
      <div className="space-y-12">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">Regular Row</h2>
          <MovieRow 
            title="Trending Now" 
            movies={sampleMovies} 
            seeMoreHref="/movies/explore?genre=trending" 

          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">Row with See More</h2>
          <MovieRow 
            title="Popular Movies" 
            movies={sampleMovies} 
            seeMoreHref="/movies/explore?genre=popular" 
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">Loading State</h2>
          <MovieRow 
            title="Loading Row" 
            isLoading={true} 
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">Error State</h2>
          <MovieRow 
            title="Error Row" 
            error={true} 
          />
        </div>
      </div>
    </div>
  )
}