"use client";

import { useSearchParams } from "next/navigation";
import { FilterBar, FilterCategory } from "@/components/ui/filter-bar";

// Filter categories for movies
const filterCategories: FilterCategory[] = [
  {
    id: "genre",
    name: "Genre",
    options: [
      { id: "28", name: "Action" },
      { id: "12", name: "Adventure" },
      { id: "16", name: "Animation" },
      { id: "35", name: "Comedy" },
      { id: "80", name: "Crime" },
      { id: "99", name: "Documentary" },
      { id: "18", name: "Drama" },
      { id: "10751", name: "Family" },
      { id: "14", name: "Fantasy" },
      { id: "36", name: "History" },
      { id: "27", name: "Horror" },
      { id: "10402", name: "Music" },
      { id: "9648", name: "Mystery" },
      { id: "10749", name: "Romance" },
      { id: "878", name: "Sci-Fi" },
      { id: "53", name: "Thriller" },
      { id: "10752", name: "War" },
      { id: "37", name: "Western" },
    ],
  },
  {
    id: "year",
    name: "Year",
    options: [
      { id: "2025", name: "2025" },
      { id: "2024", name: "2024" },
      { id: "2023", name: "2023" },
      { id: "2022", name: "2022" },
      { id: "2021", name: "2021" },
      { id: "2020", name: "2020" },
      { id: "2010s", name: "2010s" },
      { id: "2000s", name: "2000s" },
      { id: "1990s", name: "1990s" },
      { id: "classic", name: "Classic" },
    ],
  },
  {
    id: "rating",
    name: "Rating",
    options: [
      { id: "9", name: "9+" },
      { id: "8", name: "8+" },
      { id: "7", name: "7+" },
      { id: "6", name: "6+" },
      { id: "5", name: "5+" },
    ],
  },
];

export function MoviesFilter() {
  const searchParams = useSearchParams();
  
  // Extract active filters from URL
  const activeFilters: Record<string, string[]> = {};
  filterCategories.forEach(category => {
    const param = searchParams.get(category.id);
    if (param) {
      activeFilters[category.id] = param.split(',');
    } else {
      activeFilters[category.id] = [];
    }
  });

  return <FilterBar categories={filterCategories} activeFilters={activeFilters} />;
}