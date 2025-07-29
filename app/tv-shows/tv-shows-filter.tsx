"use client";

import { useSearchParams } from "next/navigation";
import { FilterBar, FilterCategory } from "@/components/ui/filter-bar";

// Filter categories for TV shows
const filterCategories: FilterCategory[] = [
  {
    id: "genre",
    name: "Genre",
    options: [
      { id: "10759", name: "Action & Adventure" },
      { id: "16", name: "Animation" },
      { id: "35", name: "Comedy" },
      { id: "80", name: "Crime" },
      { id: "99", name: "Documentary" },
      { id: "18", name: "Drama" },
      { id: "10751", name: "Family" },
      { id: "10762", name: "Kids" },
      { id: "9648", name: "Mystery" },
      { id: "10763", name: "News" },
      { id: "10764", name: "Reality" },
      { id: "10765", name: "Sci-Fi & Fantasy" },
      { id: "10766", name: "Soap" },
      { id: "10767", name: "Talk" },
      { id: "10768", name: "War & Politics" },
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

export function TVShowsFilter() {
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