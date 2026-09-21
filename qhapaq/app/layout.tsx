import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Sans_3, Raleway } from "next/font/google";
import "./globals.css";
import { BenefitSessionProvider } from "@/components/benefits/benefit-session";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qhapaq",
  description:
    "Qhapaq — verifiable participation in real-world projects on Stellar Testnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        sourceSans3.variable,
        ralewayHeading.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <BenefitSessionProvider>
          <Navbar />
          {children}
        </BenefitSessionProvider>
      </body>
    </html>
  );
}
