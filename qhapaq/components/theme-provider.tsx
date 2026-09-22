"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  scriptProps,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // React 19 warns when a <script> remounts on the client (e.g. locale
  // change). Keep a normal script on the server for FOUC prevention; on the
  // client, mark it as JSON so React skips the warning. next-themes already
  // sets suppressHydrationWarning on that script.
  const resolvedScriptProps =
    typeof window === "undefined"
      ? scriptProps
      : { ...scriptProps, type: "application/json" as const };

  return (
    <NextThemesProvider {...props} scriptProps={resolvedScriptProps}>
      {children}
    </NextThemesProvider>
  );
}
