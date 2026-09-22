import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return children;
}
