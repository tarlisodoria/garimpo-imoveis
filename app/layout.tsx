import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Rodape } from "../components/site/Rodape";
import { Cabecalho } from "../components/site/Cabecalho";
import { DadosEstruturados } from "../components/site/DadosEstruturados";
import { siteDescription, siteName, siteUrl } from "../lib/site";

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
  metadataBase: new URL(siteUrl),
  title: siteName,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: siteName,
    description: siteDescription,
    siteName,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary",
    title: siteName,
    description: siteDescription,
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DadosEstruturados
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteName,
            url: siteUrl,
            description: siteDescription,
            inLanguage: "pt-BR",
          }}
        />
        <Cabecalho />
        {children}
        <Rodape />
      </body>
    </html>
  );
}
