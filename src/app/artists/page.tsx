import ArtistsManagement from "@/components/artists/ArtistsManagement";
import TopNav from "@/components/layout/TopNav";

export const dynamic = "force-dynamic";

export default function ArtistsPage() {

  return (
    <main className="min-h-screen bg-[#070B14] p-8">
      <TopNav />
      <h1 className="mb-6 text-3xl font-semibold text-slate-100">Artists</h1>
      <ArtistsManagement />
    </main>
  );
}
