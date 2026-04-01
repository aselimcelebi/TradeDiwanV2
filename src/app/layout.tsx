import "./globals.css";
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionWrapper from "@/components/session-wrapper";

export const metadata = {
  title: "TradeDiwan — Professional Trading Journal",
  description: "Profesyonel trading journal, analitik ve performans takibi",
  keywords: "trading, journal, analytics, forex, crypto, borsa, işlem günlüğü",
  authors: [{ name: "TradeDiwan" }],
  metadataBase: new URL("https://app.tradediwan.com"),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        <SessionWrapper session={session}>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
