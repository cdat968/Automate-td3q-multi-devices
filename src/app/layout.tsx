import type { Metadata } from "next";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameFlow AutoPilot | Command Center",
  description: "Manage automation workflows and scripts across multiple devices.",
};

// Root layout: minimal shell — only fonts, globals, html/body
// Route-specific layouts (auth, dashboard) handle their own UI structure
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
