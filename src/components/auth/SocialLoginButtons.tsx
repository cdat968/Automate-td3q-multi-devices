// SocialLoginButtons.tsx — ready to wire up signIn('google') / signIn('github') from NextAuth
// To enable: npm install next-auth, then call signIn() in each handleClick

interface SocialLoginButtonsProps {
  onGoogleClick?: () => void;
  onGithubClick?: () => void;
}

export default function SocialLoginButtons({
  onGoogleClick,
  onGithubClick,
}: SocialLoginButtonsProps) {
  return (
    <>
      {/* Divider */}
      <div className="relative my-10 flex items-center">
        <div className="flex-grow border-t border-outline-variant/30"></div>
        <span className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-outline">
          or continue with
        </span>
        <div className="flex-grow border-t border-outline-variant/30"></div>
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onGoogleClick}
          className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M12 5.04c1.74 0 3.3.6 4.53 1.76l3.39-3.39C17.85 1.53 15.15.5 12 .5 7.35.5 3.39 3.17 1.48 7.07l3.91 3.03C6.31 7.37 8.94 5.04 12 5.04z" fill="#EA4335" />
            <path d="M23.49 12.27c0-.8-.07-1.57-.21-2.32H12v4.39h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.46z" fill="#4285F4" />
            <path d="M5.39 14.1c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.48 6.55C.54 8.2 0 10.04 0 12s.54 3.8 1.48 5.45l3.91-3.35z" fill="#FBBC05" />
            <path d="M12 23.5c3.12 0 5.73-1.03 7.64-2.8l-3.66-2.84c-1.06.71-2.42 1.13-3.98 1.13-3.06 0-5.69-2.33-6.61-5.07l-3.91 3.35C3.39 20.83 7.35 23.5 12 23.5z" fill="#34A853" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Google</span>
        </button>

        <button
          type="button"
          onClick={onGithubClick}
          className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-colors"
        >
          <svg className="w-5 h-5 fill-on-surface" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Github</span>
        </button>
      </div>
    </>
  );
}
