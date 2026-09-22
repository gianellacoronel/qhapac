"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep SSR and the first client render identical; only read the theme after mount.
  const isDark = mounted && resolvedTheme === "dark";

  function toggleTheme() {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={toggleTheme}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      className="fixed right-4 bottom-4 z-50 size-12 rounded-full border-border/80 bg-background/90 shadow-md backdrop-blur-sm hover:bg-muted"
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </Button>
  );
}
