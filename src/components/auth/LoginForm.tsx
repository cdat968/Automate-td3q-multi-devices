"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import FormField from "./FormField";
import SocialLoginButtons from "./SocialLoginButtons";
import LoadingButton from "@/components/ui/LoadingButton";
import VerificationHelpCard from "./VerificationHelpCard";
import { useNotification } from "@/contexts/NotificationContext";
import { AuthError } from "@/types/auth.types";
import {
    validateLoginForm,
    hasErrors,
    type LoginFormState,
    type LoginErrors,
} from "@/lib/auth/validation";

export default function LoginForm() {
    const [form, setForm] = useState<LoginFormState>({
        email: "",
        password: "",
        remember: false,
    });
    const [errors, setErrors] = useState<LoginErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);
    const router = useRouter();
    const { notify } = useNotification();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        // Clear field error on change
        if (errors[name as keyof LoginErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const validationErrors = validateLoginForm(form);
        if (hasErrors(validationErrors)) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);

        try {
            const res = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (res?.error) {
                let errorMsg = res.error;
                switch (res.error) {
                    case AuthError.INVALID_CREDENTIALS:
                        errorMsg = "Email hoặc mật khẩu không chính xác.";
                        notify("error", errorMsg);
                        break;
                    case AuthError.ACCOUNT_PENDING:
                        errorMsg =
                            "Tài khoản của bạn chưa kích hoạt. Vui lòng kiểm tra email!";
                        notify("warning", errorMsg);
                        setPendingEmail(form.email);
                        break;
                    case AuthError.ACCOUNT_BLOCKED:
                        errorMsg = "Tài khoản của bạn đã bị khoá.";
                        notify("error", errorMsg);
                        break;
                    default:
                        notify("error", errorMsg);
                        break;
                }
                return;
            }

            if (res?.ok) {
                notify("success", "Đăng nhập thành công!");
                router.refresh(); // force next.js update context/session
                router.push("/home");
            }
        } catch (err) {
            notify("error", "Không thể kết nối đến máy chủ");
        } finally {
            setIsLoading(false);
        }
    }

    // TODO: Wire up to signIn('google') / signIn('github') from next-auth
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
                    <span className="material-symbols-outlined text-primary">
                        terminal
                    </span>
                    <span className="font-bold text-on-surface text-sm uppercase tracking-widest">
                        GameFlow
                    </span>
                </div>

                {/* Login Card */}
                <div className="glass-card relative rounded-[2rem] p-8 md:p-12 shadow-2xl">
                    <div className="active-horizon absolute top-0 left-12 right-12 rounded-full" />

                    <header className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-on-surface mb-2">
                            Welcome back
                        </h2>
                        <p className="text-on-surface-variant">
                            Sign in to manage your automation workspace
                        </p>
                    </header>

                    <form
                        className="space-y-6"
                        onSubmit={handleSubmit}
                        noValidate
                    >
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
                            rightSlot={
                                <Link
                                    href="#"
                                    className="text-xs text-primary hover:text-primary-container transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            }
                            inputProps={{
                                name: "password",
                                value: form.password,
                                onChange: handleChange,
                                autoComplete: "current-password",
                            }}
                        />

                        {/* Remember device */}
                        <div className="flex items-center gap-3 py-2">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={form.remember}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary/40 focus:ring-offset-surface"
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm text-on-surface-variant select-none"
                            >
                                Remember this device
                            </label>
                        </div>

                        {/* Submit */}
                        <LoadingButton
                            type="submit"
                            isLoading={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 active:scale-[0.98] uppercase tracking-widest text-sm"
                        >
                            Sign In
                        </LoadingButton>
                    </form>

                    <SocialLoginButtons
                        onGoogleClick={handleGoogleLogin}
                        onGithubClick={handleGithubLogin}
                    />

                    {/* Footer link */}
                    <div className="mt-12 text-center">
                        <p className="text-sm text-on-surface-variant">
                            Chưa có tài khoản?{" "}
                            <Link
                                href="/register"
                                className="text-primary font-semibold hover:underline decoration-primary/40 underline-offset-4 ml-1"
                            >
                                Đăng ký
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-8 flex justify-center gap-6">
                    {["Privacy Protocol", "Service Terms", "System Status"].map(
                        (item) => (
                            <Link
                                key={item}
                                href="#"
                                className="text-[10px] uppercase tracking-widest text-outline hover:text-on-surface-variant transition-colors"
                            >
                                {item}
                            </Link>
                        ),
                    )}
                </div>

                {/* Optional Verification Help Card Rendered After Login Form */}
                {pendingEmail && (
                    <VerificationHelpCard
                        email={pendingEmail}
                        onDismiss={() => setPendingEmail(null)}
                    />
                )}
            </div>
        </div>
    );
}
