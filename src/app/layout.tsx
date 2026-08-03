import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookme – Restaurant Booking",
  description: "Multi-tenant restaurant table reservation system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
