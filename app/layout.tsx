import "@rainbow-me/rainbowkit/styles.css";

import { Chakra_Petch } from "next/font/google";
import "./globals.css";
import { ContextProvider } from "@/context";
import Script from "next/script";

const raleway = Chakra_Petch({
  weight: "500",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <title>NFT Marketplace | Buy and Sell Non-Fungible Tokens</title>
        <meta
          name="description"
          content="NFT Marketplace to buy and sell Non-Fungible Tokens"
        />
        <meta
          property="og:title"
          content="NFT Marketplace | Buy and Sell Non-Fungible Tokens"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="icon" href="/icons/icon-512x512.png" sizes="512x512" />
      </head>
      <body className={raleway.className}>
        <ContextProvider>{children} </ContextProvider>
      </body>
      <Script
        src="https://kit.fontawesome.com/d45b25ceeb.js"
        crossorigin="anonymous"
      />
    </html>
  );
}
