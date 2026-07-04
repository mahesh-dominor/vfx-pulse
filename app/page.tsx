import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardGrid from "@/components/dashboard/DashboardGrid";

export default function Home() {
  return (
    <main className="flex h-screen bg-[#070B14] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-8">
          <DashboardGrid />
        </div>
      </div>
    </main>
  );
}