"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { purchaseErrorKey } from "@/lib/i18n/errors";
import { requestQrpPurchase } from "@/lib/participation/purchase-client";
import {
  estimateUsdValue,
  formatQrp,
  type ProjectData,
} from "@/lib/project/data";
import { shortenAddress } from "@/lib/stellar/wallet";
import { shortenHash } from "@/lib/stellar/explorer";

type ParticipateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData;
  investorAddress: string | null;
  formattedBalance: string | null;
  hasTrustline: boolean | null;
  isConnected: boolean;
  isTestnet: boolean;
  isLoadingBalance: boolean;
  onPurchaseSuccess?: () => Promise<void> | void;
};

type PurchaseSuccessState = {
  transactionHash: string;
  explorerUrl: string;
  amount: string;
};

export function ParticipateDialog({
  open,
  onOpenChange,
  project,
  investorAddress,
  formattedBalance,
  hasTrustline,
  isConnected,
  isTestnet,
  isLoadingBalance,
  onPurchaseSuccess,
}: ParticipateDialogProps) {
  const t = useTranslations("purchase");
  const locale = useLocale();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PurchaseSuccessState | null>(null);

  const numericAmount = Number(amount);

  const validationError = useMemo(() => {
    if (!amount.trim()) return null;
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/.test(amount.trim())) {
      return t("validationDecimals");
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return t("validationPositive");
    }
    return null;
  }, [amount, numericAmount, t]);

  const missingTrustline =
    isConnected && isTestnet && hasTrustline === false && !isLoadingBalance;

  const canConfirm =
    isConnected &&
    isTestnet &&
    Boolean(investorAddress) &&
    !isLoadingBalance &&
    !isSubmitting &&
    !success &&
    !missingTrustline &&
    !validationError &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  function resetLocalState() {
    setAmount("");
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (isSubmitting) return;
      resetLocalState();
    }
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!canConfirm || !investorAddress) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await requestQrpPurchase({
        investorAddress,
        amount: amount.trim(),
      });

      if (!result.success) {
        setError(t(purchaseErrorKey(result.error)));
        return;
      }

      setSuccess({
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        amount: result.amount,
      });

      await onPurchaseSuccess?.();
    } catch {
      setError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {t("title", { token: project.token, projectName: project.name })}
          </DialogTitle>
          <DialogDescription>
            {t("description", { token: project.token })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {t("currentBalance", { token: project.token })}
            </p>
            {!isConnected ? (
              <p className="mt-1 text-lg font-medium text-muted-foreground">
                {t("connectWallet")}
              </p>
            ) : !isTestnet ? (
              <p className="mt-1 text-lg font-medium text-destructive">
                {t("switchToTestnet")}
              </p>
            ) : isLoadingBalance ? (
              <p className="mt-1 text-lg font-medium text-muted-foreground">
                {t("loading")}
              </p>
            ) : (
              <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                {formattedBalance ?? "0"}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {project.token}
                </span>
              </p>
            )}
            {investorAddress && isConnected ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("investor", { address: shortenAddress(investorAddress) })}
              </p>
            ) : null}
          </div>

          {missingTrustline ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{t("trustlineTitle")}</AlertTitle>
              <AlertDescription>{t("trustlineDescription")}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="participate-amount">
              {t("amountLabel", { token: project.token })}
            </Label>
            <Input
              id="participate-amount"
              type="text"
              inputMode="decimal"
              placeholder="10"
              value={amount}
              disabled={
                !isConnected ||
                !isTestnet ||
                Boolean(success) ||
                isSubmitting ||
                missingTrustline
              }
              onChange={(event) => {
                setError(null);
                setAmount(event.target.value);
              }}
            />
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border/80 px-4 py-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {t("estimatedValue")}
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
              {amount.trim() && !validationError
                ? estimateUsdValue(
                    numericAmount,
                    project.referenceValueUsd,
                    locale
                  )
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("reference", {
                token: project.token,
                value: project.referenceValueUsd,
              })}
            </p>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{t("failedTitle")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>{t("successTitle")}</AlertTitle>
              <AlertDescription className="space-y-2">
                <span className="block">
                  {t("successDescription", {
                    amount: formatQrp(success.amount, locale),
                    token: project.token,
                  })}
                </span>
                <a
                  href={success.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {t("viewOnExplorer", {
                    hash: shortenHash(success.transactionHash),
                  })}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            {success ? t("done") : t("close")}
          </Button>
          {!success ? (
            <Button disabled={!canConfirm} onClick={() => void handleConfirm()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                  {t("purchasing")}
                </>
              ) : (
                t("confirm")
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
