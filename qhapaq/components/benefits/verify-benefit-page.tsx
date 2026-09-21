"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";
import { useBenefitSession } from "@/components/benefits/benefit-session";
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

type VerifyResult =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "valid"; benefit: GeneratedBenefit };

export function VerifyBenefitPage() {
  const searchParams = useSearchParams();
  const { verifyBenefit, redeemBenefit, generatedBenefit } =
    useBenefitSession();

  const initialId = searchParams.get("id") ?? "";
  const [benefitId, setBenefitId] = useState(initialId);
  const [result, setResult] = useState<VerifyResult>({ kind: "idle" });
  const [didAutoVerify, setDidAutoVerify] = useState(false);

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
      setBenefitId(found.id);
      setResult({ kind: "valid", benefit: found });
    }
  }, [didAutoVerify, initialId, verifyBenefit]);

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
        message:
          "No matching benefit in this session. Generate a benefit first, then verify its ID.",
      });
      return;
    }

    setBenefitId(found.id);
    setResult({ kind: "valid", benefit: found });
  }

  function handleRedeem() {
    if (result.kind !== "valid") return;
    const redeemed = redeemBenefit(result.benefit.id);
    if (redeemed) {
      setResult({ kind: "valid", benefit: redeemed });
    }
  }

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
              disabled={!canVerify}
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
            onRedeem={handleRedeem}
          />
        ) : null}
      </div>
    </div>
  );
}

type ValidBenefitCardProps = {
  benefit: GeneratedBenefit;
  onRedeem: () => void;
};

function ValidBenefitCard({ benefit, onRedeem }: ValidBenefitCardProps) {
  const isRedeemed = benefit.status === "redeemed";

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
            {benefit.projectName}
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {benefit.discount}% discount
          </CardDescription>
          <p className="text-sm text-muted-foreground">{benefit.validFor}</p>
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

        {isRedeemed ? (
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
            <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                Stellar proof
              </p>
              <p className="text-sm font-medium">Coming next</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                On-chain proof will be recorded when the redemption is
                finalized.
              </p>
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
