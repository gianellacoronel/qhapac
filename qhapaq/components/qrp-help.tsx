"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type QrpHelpProps = {
  /** Shorter explanation for dense UI (balances, inline amounts). */
  brief?: boolean;
  className?: string;
};

/**
 * Compact "?" help for QRP. Hover on desktop, tap/click on touch, keyboard-focusable.
 */
export function QrpHelp({ brief = false, className }: QrpHelpProps) {
  const t = useTranslations("qrp");
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        delay={200}
        closeOnClick={false}
        aria-label={t("helpAria")}
        className={cn(
          "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full",
          "border border-current/35 text-[0.625rem] leading-none font-semibold",
          "text-muted-foreground transition-colors",
          "hover:border-current/55 hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          "align-super",
          className,
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        ?
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

type QrpLabelProps = {
  brief?: boolean;
  className?: string;
  helpClassName?: string;
  /** When false, renders only the QRP text (use when a sibling already has help). */
  showHelp?: boolean;
};

/** Renders “QRP” with an optional adjacent help icon. */
export function QrpLabel({
  brief = true,
  className,
  helpClassName,
  showHelp = true,
}: QrpLabelProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span>QRP</span>
      {showHelp ? <QrpHelp brief={brief} className={helpClassName} /> : null}
    </span>
  );
}
