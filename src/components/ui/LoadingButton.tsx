import React from "react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
}

export default function LoadingButton({
    isLoading = false,
    children,
    className = "",
    disabled,
    ...props
}: LoadingButtonProps) {
    return (
        <button
            disabled={isLoading || disabled}
            className={`bg-linear-to-r from-primary to-primary-container text-on-primary relative inline-flex items-center justify-center transition-all ${className} ${isLoading || disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
            {...props}
        >
            <span
                className={`inline-flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
                {children}
            </span>
            {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                        className="animate-spin h-5 w-5 text-current"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </span>
            )}
        </button>
    );
}
