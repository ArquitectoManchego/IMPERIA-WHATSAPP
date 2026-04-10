import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden mesh-bg">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
