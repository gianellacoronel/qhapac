"use client";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Your benefit
          </DialogTitle>
          <DialogDescription>
            Generate a unique, verifiable digital benefit linked to your
            participation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 rounded-xl border border-border/80 bg-muted/40 p-5">
          <div className="space-y-1">
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {benefit.discount}% OFF
            </p>
            <p className="text-base font-medium">{benefit.projectName}</p>
          </div>
          <div className="space-y-1 border-t border-border/70 pt-4">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Valid for
            </p>
            <p className="text-sm font-medium">{benefit.validFor}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            disabled={isGenerating}
            onClick={onConfirm}
          >
            Generate benefit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
