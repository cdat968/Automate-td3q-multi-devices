"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormField from "./FormField";
import SocialLoginButtons from "./SocialLoginButtons";
import LoadingButton from "@/components/ui/LoadingButton";
import { useNotification } from "@/contexts/NotificationContext";

export default function RegisterForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { notify } = useNotification();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic UI-only validation
    const newErrors: Record<string, string> = {};
    if (!form.fullName) newErrors.fullName = "Họ và tên không được để trống";
    if (!form.email) newErrors.email = "Email không được để trống";
    if (!form.password) newErrors.password = "Mật khẩu không được để trống";
    if (form.password && form.password.length < 6) newErrors.password = "Mật khẩu phải từ 6 ký tự";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        notify("error", data.error || "Có lỗi xảy ra, vui lòng thử lại sau");
        return;
      }

      // Success -> Notify and redirect
      notify("success", "Đăng ký thành công! Hãy kiểm tra email để xác thực.");
      router.push("/login?registered=1");
    } catch (err) {
      notify("error", "Không thể kết nối tới server");
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    console.log("Google login clicked");
  }

  function handleGithubLogin() {
    console.log("GitHub login clicked");
  }

  return (
    <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-surface">
      <div className="w-full max-w-md">
        {/* Mobile-only logo */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <span className="material-symbols-outlined text-primary">terminal</span>
          <span className="font-bold text-on-surface text-sm uppercase tracking-widest">
            GameFlow
          </span>
        </div>

        {/* Register Card */}
        <div className="glass-card relative rounded-[2rem] p-8 md:p-12 shadow-2xl">
          <div className="active-horizon absolute top-0 left-12 right-12 rounded-full" />

          <header className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-on-surface mb-2">Create account</h2>
            <p className="text-on-surface-variant">
              Set up your automation workspace
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              id="fullName"
              label="Họ và tên"
              type="text"
              placeholder="John Doe"
              icon="person"
              error={errors.fullName}
              inputProps={{
                name: "fullName",
                value: form.fullName,
                onChange: handleChange,
                autoComplete: "name",
              }}
            />

            <FormField
              id="email"
              label="Email address"
              type="email"
              placeholder="operator@protocol.com"
              icon="alternate_email"
              error={errors.email}
              inputProps={{
                name: "email",
                value: form.email,
                onChange: handleChange,
                autoComplete: "email",
              }}
            />

            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              icon="lock"
              error={errors.password}
              inputProps={{
                name: "password",
                value: form.password,
                onChange: handleChange,
                autoComplete: "new-password",
              }}
            />

            <FormField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon="lock"
              error={errors.confirmPassword}
              inputProps={{
                name: "confirmPassword",
                value: form.confirmPassword,
                onChange: handleChange,
                autoComplete: "new-password",
              }}
            />

            {/* Submit */}
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 active:scale-[0.98] uppercase tracking-widest text-sm mt-2"
            >
              Create account
            </LoadingButton>
          </form>

          <div className="mt-6">
            <SocialLoginButtons
              onGoogleClick={handleGoogleLogin}
              onGithubClick={handleGithubLogin}
            />
          </div>

          {/* Footer link */}
          <div className="mt-12 text-center">
            <p className="text-sm text-on-surface-variant">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline decoration-primary/40 underline-offset-4 ml-1"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex justify-center gap-6">
          {["Privacy Protocol", "Service Terms", "System Status"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-[10px] uppercase tracking-widest text-outline hover:text-on-surface-variant transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
