import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TourProvider } from "@/components/TourProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import VLibras from "@/components/VLibras";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Painel de Acompanhamento Infantil",
  description: "Prefeitura do Rio - Acompanhamento de crianças em vulnerabilidade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AccessibilityProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <TooltipProvider>
              <TourProvider>
                {children}
                <Toaster position="top-right" richColors />
                <VLibras />
              </TourProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
