import MyList from "@/components/MyList";
import { generateMyListMetadata, generateBreadcrumbStructuredData } from "@/lib/seo-utils";

export const metadata = generateMyListMetadata();

export default function MyListPage() {
  // Generate breadcrumb structured data
  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "My List", url: "/my-list" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <div className="min-h-screen bg-black pt-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My List</h1>
            <p className="text-gray-400">Movies and TV shows you&apos;ve saved to watch later</p>
          </div>
          
          <MyList isPage={true} />
        </div>
      </div>
    </>
  );
}