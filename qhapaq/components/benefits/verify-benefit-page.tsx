"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
} from "lucide-react";
import { useBenefitSession } from "@/components/benefits/benefit-session";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { GeneratedBenefit } from "@/lib/benefits/types";
import {
  formatBenefitDate,
  normalizeBenefitId,
} from "@/lib/benefits/utils";
import { shortenHash } from "@/lib/stellar/explorer";

type VerifyResult =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "valid"; benefit: GeneratedBenefit };

export function VerifyBenefitPage() {
  const searchParams = useSearchParams();
  const { verifyBenefit, markVerified, redeemBenefit, generatedBenefit } =
    useBenefitSession();

  const initialId = searchParams.get("id") ?? "";
  const [benefitId, setBenefitId] = useState(initialId);
  const [result, setResult] = useState<VerifyResult>({ kind: "idle" });
  const [didAutoVerify, setDidAutoVerify] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [isRedeeming, startRedeemTransition] = useTransition();

  useEffect(() => {
    if (initialId) {
      setBenefitId(initialId);
    }
  }, [initialId]);

  useEffect(() => {
    if (didAutoVerify || !initialId) return;
    const found = verifyBenefit(normalizeBenefitId(initialId));
    setDidAutoVerify(true);
    if (found) {
      const verified = markVerified(found.id) ?? found;
      setBenefitId(verified.id);
      setResult({ kind: "valid", benefit: verified });
    }
  }, [didAutoVerify, initialId, markVerified, verifyBenefit]);

  // Keep verified result in sync when the same benefit is redeemed.
  useEffect(() => {
    setResult((current) => {
      if (current.kind !== "valid" || !generatedBenefit) return current;
      if (
        normalizeBenefitId(generatedBenefit.id) !==
        normalizeBenefitId(current.benefit.id)
      ) {
        return current;
      }
      if (current.benefit === generatedBenefit) return current;
      return { kind: "valid", benefit: generatedBenefit };
    });
  }, [generatedBenefit]);

  const canVerify = useMemo(
    () => normalizeBenefitId(benefitId).length > 0,
    [benefitId]
  );

  function handleVerify() {
    const normalized = normalizeBenefitId(benefitId);
    setRedeemError(null);

    if (!normalized) {
      setResult({
        kind: "invalid",
        message: "Enter a benefit ID to verify.",
      });
      return;
    }

    const found = verifyBenefit(normalized);
    if (!found) {
      setResult({
        kind: "invalid",
        message: "This benefit could not be verified.",
      });
      return;
    }

    const verified = markVerified(found.id) ?? found;
    setBenefitId(verified.id);
    setResult({ kind: "valid", benefit: verified });
  }

  function handleRedeem() {
    if (result.kind !== "valid") return;
    setRedeemError(null);

    startRedeemTransition(async () => {
      const outcome = await redeemBenefit(result.benefit.id);
      setResult({ kind: "valid", benefit: outcome.benefit });
      if (!outcome.ok) {
        setRedeemError(outcome.message);
      }
    });
  }

  const showRedeemLoading =
    isRedeeming ||
    (result.kind === "valid" && result.benefit.status === "redeeming");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16">
      <header className="max-w-2xl space-y-3">
        <Link
          href="/benefits"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to benefits
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Verify benefit
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Enter the benefit ID to confirm it is valid for this session.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="w-full max-w-md shadow-xs">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Enter the benefit ID
            </CardTitle>
            <CardDescription>
              Example format: QHP-8F42A1
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="space-y-2">
              <Label htmlFor="benefit-id">Benefit ID</Label>
              <Input
                id="benefit-id"
                value={benefitId}
                onChange={(event) => setBenefitId(event.target.value)}
                placeholder="QHP-8F42A1"
                autoComplete="off"
                spellCheck={false}
                className="font-mono uppercase tracking-wide"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleVerify();
                  }
                }}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={!canVerify || showRedeemLoading}
              onClick={handleVerify}
            >
              Verify
            </Button>
          </CardFooter>
        </Card>

        {result.kind === "invalid" ? (
          <Alert variant="destructive" className="max-w-md">
            <CircleAlert />
            <AlertTitle>Unable to verify</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : null}

        {result.kind === "valid" ? (
          <ValidBenefitCard
            benefit={result.benefit}
            isRedeeming={showRedeemLoading}
            redeemError={redeemError ?? result.benefit.redeemError ?? null}
            onRedeem={handleRedeem}
          />
        ) : null}
      </div>
    </div>
  );
}

type ValidBenefitCardProps = {
  benefit: GeneratedBenefit;
  isRedeeming: boolean;
  redeemError: string | null;
  onRedeem: () => void;
};

function ValidBenefitCard({
  benefit,
  isRedeeming,
  redeemError,
  onRedeem,
}: ValidBenefitCardProps) {
  const isRedeemed = benefit.status === "redeemed";

  if (isRedeeming) {
    return (
      <Card className="w-full max-w-md shadow-xs">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Recording redemption...
          </div>
          <CardTitle className="font-heading text-xl">
            Verifying on Stellar Testnet
          </CardTitle>
          <CardDescription>
            Creating an on-chain proof for benefit {benefit.id}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xs">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden />
            {isRedeemed ? "Benefit redeemed" : "Valid benefit"}
          </div>
          <Badge variant={isRedeemed ? "outline" : "secondary"}>
            {isRedeemed ? "Redeemed" : "Valid"}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="font-heading text-xl">
            {isRedeemed ? `${benefit.discount}% OFF` : benefit.projectName}
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {isRedeemed
              ? benefit.projectName
              : `${benefit.discount}% discount`}
          </CardDescription>
          {!isRedeemed ? (
            <p className="text-sm text-muted-foreground">{benefit.validFor}</p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Benefit ID
            </p>
            <p className="font-mono text-sm font-semibold tracking-wide">
              {benefit.id}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Status
            </p>
            <p className="text-sm font-medium">
              {isRedeemed ? "Redeemed" : "Valid"}
            </p>
          </div>
        </div>

        {redeemError ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Redemption failed</AlertTitle>
            <AlertDescription>{redeemError}</AlertDescription>
          </Alert>
        ) : null}

        {isRedeemed && benefit.transactionHash ? (
          <>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                Redeemed on
              </p>
              <p className="text-sm font-medium">
                {benefit.redeemedAt
                  ? formatBenefitDate(benefit.redeemedAt)
                  : "—"}
              </p>
            </div>
            <Separator />
            <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                On-chain proof
              </p>
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Transaction
                </p>
                <p className="font-mono text-sm font-semibold tracking-wide">
                  {shortenHash(benefit.transactionHash)}
                </p>
              </div>
              <TransactionLink
                hash={benefit.transactionHash}
                label="View on Stellar Explorer"
              />
            </div>
          </>
        ) : null}
      </CardContent>

      {!isRedeemed ? (
        <CardFooter>
          <Button className="w-full" onClick={onRedeem}>
            Redeem benefit
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
