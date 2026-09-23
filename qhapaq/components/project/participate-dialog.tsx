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
import { QrpLabel } from "@/components/qrp-help";
import { purchaseErrorKey, trustlineErrorKey } from "@/lib/i18n/errors";
import { requestQrpPurchase } from "@/lib/participation/purchase-client";
import {
  estimateUsdValue,
  formatQrp,
  type ProjectData,
} from "@/lib/project/data";
import {
  createQrpTrustline,
  TrustlineError,
  type TrustlinePhase,
} from "@/lib/stellar/transactions";
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
  /** Refresh balance after QRP is added so the UI can switch to Participate. */
  onTrustlineSuccess?: () => Promise<void> | void;
};

type FlowPhase =
  | "idle"
  | "preparing"
  | TrustlinePhase
  | "trustline_added"
  | "purchasing"
  | "confirming_purchase"
  | "success";

type TrustlineSuccessState = {
  hash: string;
  explorerUrl: string;
};

type PurchaseSuccessState = {
  transactionHash: string;
  explorerUrl: string;
  amount: string;
  trustlineHash?: string;
  trustlineExplorerUrl?: string;
};

function phaseLabelKey(phase: FlowPhase): string | null {
  switch (phase) {
    case "preparing":
    case "building":
      return "statusPreparing";
    case "signing":
      return "statusConfirmInWallet";
    case "submitting":
      return "statusAddingQrp";
    case "confirming":
      return "statusConfirmingTrustline";
    case "trustline_added":
      return "statusTrustlineAdded";
    case "purchasing":
      return "statusPurchasing";
    case "confirming_purchase":
      return "statusConfirmingPurchase";
    default:
      return null;
  }
}

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
  onTrustlineSuccess,
}: ParticipateDialogProps) {
  const t = useTranslations("purchase");
  const locale = useLocale();
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [trustlineSuccess, setTrustlineSuccess] =
    useState<TrustlineSuccessState | null>(null);
  const [success, setSuccess] = useState<PurchaseSuccessState | null>(null);
  /** Set after a successful in-session trustline so purchase can proceed. */
  const [trustlineReady, setTrustlineReady] = useState(false);

  const isBusy = phase !== "idle" && phase !== "success" && phase !== "trustline_added";
  const numericAmount = Number(amount);

  const needsTrustline =
    isConnected &&
    isTestnet &&
    !isLoadingBalance &&
    !trustlineReady &&
    hasTrustline === false;

  const canParticipate =
    isConnected &&
    isTestnet &&
    !needsTrustline &&
    (trustlineReady || hasTrustline === true);

  const validationError = useMemo(() => {
    if (!amount.trim()) return null;
    if (!/^[1-9]\d*$/.test(amount.trim())) {
      return t("validationInteger");
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return t("validationPositive");
    }
    return null;
  }, [amount, numericAmount, t]);

  const canAddQrp =
    isConnected &&
    isTestnet &&
    Boolean(investorAddress) &&
    !isLoadingBalance &&
    !isBusy &&
    !success &&
    needsTrustline;

  const canPurchase =
    canParticipate &&
    Boolean(investorAddress) &&
    !isLoadingBalance &&
    !isBusy &&
    !success &&
    !validationError &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  const statusLabelKey = phaseLabelKey(phase);

  function resetLocalState() {
    setAmount("");
    setError(null);
    setSuccess(null);
    setTrustlineSuccess(null);
    setPhase("idle");
    setTrustlineReady(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (isBusy) return;
      resetLocalState();
    }
    onOpenChange(next);
  }

  async function handleAddQrp() {
    if (!canAddQrp || !investorAddress) return;

    setPhase("preparing");
    setError(null);

    try {
      const trustlineResult = await createQrpTrustline({
        sourceAddress: investorAddress,
        onPhaseChange: (next) => setPhase(next),
      });

      setTrustlineReady(true);
      setPhase("trustline_added");

      if (
        trustlineResult.hash &&
        trustlineResult.explorerUrl &&
        !trustlineResult.alreadyExisted
      ) {
        setTrustlineSuccess({
          hash: trustlineResult.hash,
          explorerUrl: trustlineResult.explorerUrl,
        });
      }

      await onTrustlineSuccess?.();
    } catch (err) {
      if (err instanceof TrustlineError) {
        setError(t(trustlineErrorKey(err.code)));
      } else {
        setError(t("errors.trustline_failed"));
      }
      setPhase("idle");
    }
  }

  async function handlePurchase() {
    if (!canPurchase || !investorAddress) return;

    setPhase("purchasing");
    setError(null);

    try {
      const result = await requestQrpPurchase({
        investorAddress,
        amount: amount.trim(),
      });

      if (!result.success) {
        if (trustlineReady || hasTrustline === true) {
          setError(t("errors.purchase_after_trustline"));
        } else {
          setError(t(purchaseErrorKey(result.error)));
        }
        setPhase(trustlineReady ? "trustline_added" : "idle");
        return;
      }

      setPhase("confirming_purchase");

      setSuccess({
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        amount: result.amount,
        trustlineHash: trustlineSuccess?.hash,
        trustlineExplorerUrl: trustlineSuccess?.explorerUrl,
      });
      setPhase("success");

      await onPurchaseSuccess?.();
    } catch {
      setError(
        trustlineReady || hasTrustline === true
          ? t("errors.purchase_after_trustline")
          : t("genericError")
      );
      setPhase(trustlineReady ? "trustline_added" : "idle");
    }
  }

  const showTrustlineReady =
    !needsTrustline &&
    !success &&
    (trustlineReady || phase === "trustline_added");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {t("title", { projectName: project.name })}
          </DialogTitle>
          <DialogDescription>
            {needsTrustline
              ? t("descriptionNeedsQrp", { token: project.token })
              : t("description", { token: project.token })}
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
                <QrpLabel
                  brief
                  className="text-base font-normal text-muted-foreground"
                />
              </p>
            )}
            {investorAddress && isConnected ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("investor", { address: shortenAddress(investorAddress) })}
              </p>
            ) : null}
          </div>

          {needsTrustline && !isBusy && !success ? (
            <Alert>
              <AlertCircle />
              <AlertTitle>{t("addQrpTitle")}</AlertTitle>
              <AlertDescription>{t("addQrpDescription")}</AlertDescription>
            </Alert>
          ) : null}

          {showTrustlineReady ? (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>{t("statusTrustlineAdded")}</AlertTitle>
              <AlertDescription className="space-y-2">
                <span className="block">{t("trustlineReadyDescription")}</span>
                {trustlineSuccess ? (
                  <a
                    href={trustlineSuccess.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {t("viewTrustlineOnExplorer", {
                      hash: shortenHash(trustlineSuccess.hash),
                    })}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          {!needsTrustline ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="participate-amount">
                  {t("amountLabel", { token: project.token })}
                </Label>
                <Input
                  id="participate-amount"
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  placeholder="10"
                  value={amount}
                  disabled={Boolean(success) || isBusy}
                  onChange={(event) => {
                    setError(null);
                    const next = event.target.value;
                    if (next === "" || /^\d+$/.test(next)) {
                      setAmount(next);
                    }
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
            </>
          ) : null}

          {isBusy && statusLabelKey ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              {t(statusLabelKey)}
            </p>
          ) : null}

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
                {success.trustlineHash && success.trustlineExplorerUrl ? (
                  <a
                    href={success.trustlineExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {t("viewTrustlineOnExplorer", {
                      hash: shortenHash(success.trustlineHash),
                    })}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
                <a
                  href={success.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {t("viewPurchaseOnExplorer", {
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
            disabled={isBusy}
            onClick={() => handleOpenChange(false)}
          >
            {success ? t("done") : t("close")}
          </Button>
          {!success ? (
            needsTrustline ? (
              <Button
                disabled={!canAddQrp}
                onClick={() => void handleAddQrp()}
              >
                {isBusy ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      data-icon="inline-start"
                    />
                    {statusLabelKey ? t(statusLabelKey) : t("statusAddingQrp")}
                  </>
                ) : (
                  t("addQrp")
                )}
              </Button>
            ) : (
              <Button
                disabled={!canPurchase}
                onClick={() => void handlePurchase()}
              >
                {isBusy ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      data-icon="inline-start"
                    />
                    {statusLabelKey ? t(statusLabelKey) : t("purchasing")}
                  </>
                ) : (
                  t("participate")
                )}
              </Button>
            )
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
