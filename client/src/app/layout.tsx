import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Placement Preparation Platform | Smart Interview & Weakness Intelligence",
  description:
    "End-to-end placement readiness ecosystem connecting company interview patterns, coding track weaknesses, resume scoring, and grounded AI question generation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
            Placement Preparation Platform • Engineered with Next.js, Express, PostgreSQL & AI Intelligence
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
