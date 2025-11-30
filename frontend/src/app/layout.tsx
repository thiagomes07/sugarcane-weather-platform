import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers"; // <-- ADICIONE ISSO

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clima Cana | Dados Climáticos Inteligentes para Cana-de-Açúcar",
    template: "%s | Clima Cana",
  },
  description:
    "Plataforma de monitoramento climático especializada em cana-de-açúcar. Dados precisos, análises contextualizadas e comunidade de produtores compartilhando conhecimento.",
  keywords: [
    "clima",
    "cana-de-açúcar",
    "agricultura",
    "agronegócio",
    "meteorologia",
    "produtores rurais",
    "previsão do tempo",
    "cultivo",
    "plantio",
    "colheita",
  ],
  authors: [{ name: "Clima Cana" }],
  creator: "Clima Cana",
  publisher: "Clima Cana",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Clima Cana | Inteligência Climática para sua Lavoura",
    description:
      "Monitoramento climático especializado com análises para cultivo de cana-de-açúcar",
    url: "/",
    siteName: "Clima Cana",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Clima Cana - Monitoramento Climático",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clima Cana | Inteligência Climática para sua Lavoura",
    description:
      "Monitoramento climático especializado com análises para cultivo de cana-de-açúcar",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D5F2E" />
      </head>
      <body
        className="antialiased font-sans min-h-screen flex flex-col"
        suppressHydrationWarning={true}
      >
        {/* ENVOLVA COM PROVIDERS */}
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            expand={false}
            duration={5000}
          />
        </Providers>
      </body>
    </html>
  );
}
