"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/language-context";
import { BrokerProvider } from "@/contexts/broker-context";

export default function SessionWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        <BrokerProvider>
          {children}
        </BrokerProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
