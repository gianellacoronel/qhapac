"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  estimateUsdValue,
  formatQrp,
  type ProjectData,
} from "@/lib/project/data";

type ParticipateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData;
  balance: string | null;
  formattedBalance: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  isLoadingBalance: boolean;
};

export function ParticipateDialog({
  open,
  onOpenChange,
  project,
  balance,
  formattedBalance,
  isConnected,
  isTestnet,
  isLoadingBalance,
}: ParticipateDialogProps) {
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const numericAmount = Number(amount);
  const balanceNumber = balance != null ? Number(balance) : null;

  const validationError = useMemo(() => {
    if (!amount.trim()) return null;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return "Enter a valid amount greater than zero.";
    }
    if (balanceNumber != null && numericAmount > balanceNumber) {
      return `Amount exceeds your available ${project.token} balance.`;
    }
    return null;
  }, [amount, balanceNumber, numericAmount, project.token]);

  const canConfirm =
    isConnected &&
    isTestnet &&
    !isLoadingBalance &&
    !validationError &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAmount("");
      setConfirmed(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Participate in {project.name}
          </DialogTitle>
          <DialogDescription>
            Choose how much {project.token} to allocate. This dialog is UI-only
            for Day 2 — no tokens are moved until a later Freighter settlement
            step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Current {project.token} balance
            </p>
            {!isConnected ? (
              <p className="mt-1 text-lg font-medium text-muted-foreground">
                Connect wallet
              </p>
            ) : !isTestnet ? (
              <p className="mt-1 text-lg font-medium text-destructive">
                Switch to Testnet
              </p>
            ) : isLoadingBalance ? (
              <p className="mt-1 text-lg font-medium text-muted-foreground">
                Loading…
              </p>
            ) : (
              <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                {formattedBalance ?? "0"}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {project.token}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="participate-amount">Amount ({project.token})</Label>
            <Input
              id="participate-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              value={amount}
              disabled={!isConnected || !isTestnet || confirmed}
              onChange={(event) => {
                setConfirmed(false);
                setAmount(event.target.value);
              }}
            />
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border/80 px-4 py-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Estimated participation value
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
              {amount.trim() && !validationError
                ? estimateUsdValue(numericAmount, project.referenceValueUsd)
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reference: 1 {project.token} = ${project.referenceValueUsd}
            </p>
          </div>

          {confirmed ? (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>Selection saved in UI</AlertTitle>
              <AlertDescription>
                {formatQrp(numericAmount)} {project.token} selected for{" "}
                {project.name}. No blockchain transaction was submitted.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
          <Button
            disabled={!canConfirm || confirmed}
            onClick={() => setConfirmed(true)}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
