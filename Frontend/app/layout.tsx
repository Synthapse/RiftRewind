import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiftRewind",
  description: "League of Legends match history and replay viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
