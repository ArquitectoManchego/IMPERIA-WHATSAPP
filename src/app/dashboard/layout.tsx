import Sidebar from "@/components/Sidebar";
import NewChatModal from "@/components/NewChatModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden mesh-bg">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden pb-16 md:pb-0">
        {children}
      </main>
      <NewChatModal />
    </div>
  );
}

