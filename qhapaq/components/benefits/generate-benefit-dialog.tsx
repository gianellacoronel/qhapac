"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BenefitDefinition } from "@/lib/benefits/types";

type GenerateBenefitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit: BenefitDefinition;
  onConfirm: () => void;
  isGenerating?: boolean;
};

export function GenerateBenefitDialog({
  open,
  onOpenChange,
  benefit,
  onConfirm,
  isGenerating = false,
}: GenerateBenefitDialogProps) {
  const t = useTranslations("benefits");

  const validFor = t.has(`definitions.${benefit.id}.validFor`)
    ? t(`definitions.${benefit.id}.validFor`)
    : benefit.validFor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {t("generateDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("generateDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 rounded-xl border border-border/80 bg-muted/40 p-5">
          <div className="space-y-1">
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {t("percentOff", { discount: benefit.discount })}
            </p>
            <p className="text-base font-medium">{benefit.projectName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {t("validForLabel")}
            </p>
            <p className="text-sm font-medium">{validFor}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            disabled={isGenerating}
            onClick={onConfirm}
          >
            {t("generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
