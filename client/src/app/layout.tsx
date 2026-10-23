import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "PlacementOS | Executive Readiness & Interview Intelligence",
  description:
    "Streamlined placement readiness platform tracking target company interview patterns, coding gaps, resume scoring, and AI question generation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500/25 selection:text-amber-200">
        <AuthProvider>
          <div className="flex flex-col lg:flex-row min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
              <footer className="border-t border-white/[0.04] py-6 text-center text-[11px] text-zinc-600">
                PlacementOS • Executive Intelligence & Interview Readiness
              </footer>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
