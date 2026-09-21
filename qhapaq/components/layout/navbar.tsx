"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";

export function Navbar() {
  const t = useTranslations("navbar");
  const pathname = usePathname();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/portfolio", label: t("portfolio") },
    { href: "/benefits", label: t("benefits") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/qhapaq-mark.svg"
            alt=""
            width={32}
            height={32}
            className="size-8"
            priority
          />
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Qhapaq
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t("mainNav")}>
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <ConnectWallet wallet={wallet} variant="navbar" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border/70 bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label={t("mobileNav")}>
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-4 border-t border-border/70 pt-4">
            <Suspense fallback={null}>
              <LanguageSwitcher />
            </Suspense>
            <ConnectWallet wallet={wallet} variant="navbar" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
