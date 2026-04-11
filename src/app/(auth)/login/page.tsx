// (auth)/login/page.tsx — route: /login
// Composes LoginBrandPanel (Server Component) + LoginForm (Client Component)
import LoginBrandPanel from "@/components/auth/LoginBrandPanel";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In | GameFlow AutoPilot",
};

export default function LoginPage() {
  return (
    <main className="flex flex-col md:flex-row min-h-screen">
      <LoginBrandPanel />
      <LoginForm />

      {/* Decorative corner watermark */}
      <div className="fixed bottom-4 right-4 z-0 pointer-events-none opacity-20">
        <span className="text-[8rem] font-black text-primary/5 select-none leading-none">
          AUTO
        </span>
      </div>
    </main>
  );
}
