import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: {
    default: "AlphaPay — TZS ⇄ INR money transfer",
    template: "%s · AlphaPay",
  },
  description:
    "Send money between Tanzania and India. See live TZS/INR rates, place an order, and get cash or a bank transfer delivered.",
  applicationName: "AlphaPay",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AlphaPay",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-edge py-6 text-center text-xs text-muted">
          AlphaPay — moving money between Tanzania 🇹🇿 and India 🇮🇳
        </footer>
      </body>
    </html>
  );
}
