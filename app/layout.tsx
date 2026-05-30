import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qualtrics Backup — open-source, no storage",
  description:
    "Back up Qualtrics surveys, responses, metadata, and QSF files in your browser. Public source code; API tokens are never stored.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
        <footer className="border-t border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
          <a
            href="https://github.com/giladfeldman/qualtricsbackupapp"
            className="underline underline-offset-2"
          >
            View source on GitHub
          </a>
          {" · "}
          <a
            href="https://github.com/giladfeldman/qualtricsbackupapp/blob/main/SECURITY.md"
            className="underline underline-offset-2"
          >
            Security
          </a>
          {" · "}
          <a
            href="https://github.com/giladfeldman/qualtricsbackupapp/blob/main/PRIVACY.md"
            className="underline underline-offset-2"
          >
            Privacy
          </a>
        </footer>
      </body>
    </html>
  );
}
