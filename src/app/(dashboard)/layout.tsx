import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
// Sidebar + Header are rendered once here; pages only render their content
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lấy chi tiết User Object từ DB/JWT thông qua NextAuth.
  // Middleware đã đảm bảo vòng ngoài, ở đây KHÔNG CẦN CHẶN bằng `if (!session) redirect(...)`
  // Nút thắt hiệu năng (bottleneck) đã được tháo.
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-dvh bg-surface-dim">
      {/* Tuỳ ý truyền prop user={session?.user} vào Sidebar, Header tại đây */}
      <Sidebar />
      <Header />
      <main className="app-content">
        <div className="app-content-inner space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
