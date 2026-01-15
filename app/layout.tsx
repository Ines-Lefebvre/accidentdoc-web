import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Accident Doc | Lettres de réserves AT/MP",
  description:
    "Générez votre lettre de réserves pour accident du travail ou maladie professionnelle. Rédigée par IA, validée par avocat. 69€.",
  keywords: [
    "lettre de réserves",
    "accident du travail",
    "AT/MP",
    "maladie professionnelle",
    "CPAM",
    "employeur",
  ],
  authors: [{ name: "Maître Carine Bailly Lacresse" }],
  openGraph: {
    title: "Accident Doc | Lettres de réserves AT/MP",
    description:
      "Générez votre lettre de réserves pour accident du travail. 69€, validée par avocat.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
