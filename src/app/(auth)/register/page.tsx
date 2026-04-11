// (auth)/register/page.tsx — route: /register
// Composes LoginBrandPanel (Server Component) + RegisterForm (Client Component)
import LoginBrandPanel from "@/components/auth/LoginBrandPanel";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create Account | GameFlow AutoPilot",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-col md:flex-row min-h-screen">
      <LoginBrandPanel />
      <RegisterForm />

      {/* Decorative corner watermark */}
      <div className="fixed bottom-4 right-4 z-0 pointer-events-none opacity-20">
        <span className="text-[8rem] font-black text-primary/5 select-none leading-none">
          AUTO
        </span>
      </div>
    </main>
  );
}
