import { Suspense } from "react";
import { Metadata } from "next";
import { SearchPageClient } from "./search-client";
import { generateSearchMetadata, generateBreadcrumbStructuredData } from "@/lib/seo-utils";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  return generateSearchMetadata(params.q);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Search", url: "/search" },
    ...(query ? [{ name: `Results for "${query}"`, url: `/search?q=${encodeURIComponent(query)}` }] : []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <Suspense fallback={<div className="container mx-auto px-4 pt-24 pb-8">Loading...</div>}>
        <SearchPageClient initialQuery={query} />
      </Suspense>
    </>
  );
}
