import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sales Brain",
  description: "Plataforma de inteligência comercial para mensuração de demanda perdida",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
