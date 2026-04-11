// (auth)/layout.tsx — minimal centered layout for login, register, forgot-password
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}
