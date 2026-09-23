"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { stellarConfig } from "@/lib/stellar/config";
import { cn } from "@/lib/utils";

type StellarTermProps = {
  /** Override the visible label (defaults to localized “Stellar”). */
  children?: ReactNode;
  /** Shorter explanation for dense UI. */
  brief?: boolean;
  className?: string;
};

/**
 * The word “Stellar” itself is the tooltip trigger.
 * Hover on desktop, tap/click on touch, keyboard-focusable.
 */
export function StellarTerm({
  children,
  brief = false,
  className,
}: StellarTermProps) {
  const t = useTranslations("stellar");
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        delay={200}
        closeOnClick={false}
        aria-label={t("helpAria")}
        className={cn(
          "inline cursor-help bg-transparent p-0 align-baseline",
          "font-[inherit] text-[length:inherit] leading-[inherit] text-inherit",
          "underline decoration-dotted decoration-current/40 underline-offset-[0.2em]",
          "transition-[text-decoration-color] hover:decoration-current/70",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {children ?? t("term")}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[16.5rem] flex-col items-start gap-0 whitespace-normal px-3 py-2 text-left text-xs leading-relaxed font-normal"
      >
        {brief ? t("brief") : t("description")}
      </TooltipContent>
    </Tooltip>
  );
}

type StellarNetworkLabelProps = {
  brief?: boolean;
  className?: string;
  termClassName?: string;
};

/**
 * Renders the configured network name (e.g. “Stellar Testnet”)
 * with “Stellar” as an explainable tooltip term.
 */
export function StellarNetworkLabel({
  brief = true,
  className,
  termClassName,
}: StellarNetworkLabelProps) {
  const suffix = stellarConfig.displayName.replace(/^Stellar\s*/u, "");

  return (
    <span className={cn("inline", className)}>
      <StellarTerm brief={brief} className={termClassName} />
      {suffix ? ` ${suffix}` : null}
    </span>
  );
}

/** next-intl rich-text tag: wrap “Stellar” in messages as `<stellar>…</stellar>`. */
export function stellarRichTag(brief = true) {
  return {
    stellar: (chunks: ReactNode) => (
      <StellarTerm brief={brief}>{chunks}</StellarTerm>
    ),
  };
}
