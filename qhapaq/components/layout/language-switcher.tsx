"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeFlags: Record<AppLocale, string> = {
  es: "🇪🇸",
  en: "🇺🇸",
};

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(href, { locale: nextLocale });
    });
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-border/70 p-0.5"
      role="group"
      aria-label={t("es") + " / " + t("en")}
    >
      {routing.locales.map((item) => {
        const active = item === locale;
        return (
          <Button
            key={item}
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            aria-pressed={active}
            aria-label={t("switchTo", { locale: t(item) })}
            className={cn(
              "h-7 gap-1 px-2 text-xs font-medium",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => switchLocale(item)}
          >
            <span>{t(item)}</span>
          </Button>
        );
      })}
    </div>
  );
}
