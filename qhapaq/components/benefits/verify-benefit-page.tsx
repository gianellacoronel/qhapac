"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useBenefitSession } from "@/components/benefits/benefit-session";
import { BenefitQr } from "@/components/benefits/benefit-qr";
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
import { Link } from "@/i18n/navigation";
import type { GeneratedBenefit } from "@/lib/benefits/types";
import {
  formatBenefitDate,
  normalizeBenefitId,
} from "@/lib/benefits/utils";
import { redemptionErrorKey } from "@/lib/i18n/errors";
import { toIntlLocale } from "@/lib/project/data";
import { shortenHash } from "@/lib/stellar/explorer";

type VerifyResult =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "valid"; benefit: GeneratedBenefit };

export function VerifyBenefitPage() {
  const t = useTranslations("verify");
  const tBenefits = useTranslations("benefits");
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
        message: t("enterId"),
      });
      return;
    }

    const found = verifyBenefit(normalized);
    if (!found) {
      setResult({
        kind: "invalid",
        message: t("notFound"),
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
        setRedeemError(
          tBenefits(redemptionErrorKey(outcome.errorCode))
        );
      }
    });
  }

  const showRedeemLoading =
    isRedeeming ||
    (result.kind === "valid" && result.benefit.status === "redeeming");

  const displayRedeemError =
    redeemError ??
    (result.kind === "valid" && result.benefit.redeemError
      ? tBenefits(redemptionErrorKey(result.benefit.redeemError))
      : null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16">
      <header className="max-w-2xl space-y-3">
        <Link
          href="/benefits"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToBenefits")}
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <Card className="w-full shadow-xs">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {t("enterIdTitle")}
            </CardTitle>
            <CardDescription>{t("exampleFormat")}</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="space-y-2">
              <Label htmlFor="benefit-id">{t("benefitIdLabel")}</Label>
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
              {t("verify")}
            </Button>
          </CardFooter>
        </Card>

        <div className="min-w-0 space-y-6">
          {result.kind === "invalid" ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>{t("unableTitle")}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : null}

          {result.kind === "valid" ? (
            <ValidBenefitCard
              benefit={result.benefit}
              isRedeeming={showRedeemLoading}
              redeemError={displayRedeemError}
              onRedeem={handleRedeem}
            />
          ) : null}
        </div>
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
  const t = useTranslations("verify");
  const tBenefits = useTranslations("benefits");
  const locale = useLocale();
  const isRedeemed = benefit.status === "redeemed";

  const validFor = tBenefits.has(
    `definitions.${benefit.benefitDefinitionId}.validFor`
  )
    ? tBenefits(`definitions.${benefit.benefitDefinitionId}.validFor`)
    : benefit.validFor;

  if (isRedeeming) {
    return (
      <Card className="w-full shadow-xs">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
            {t("recording")}
          </div>
          <CardTitle className="font-heading text-xl">
            {t("verifyingOnChain")}
          </CardTitle>
          <CardDescription>
            {t("creatingProof", { id: benefit.id })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full gap-0 py-0 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-(--card-spacing) py-(--card-spacing)">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
                {isRedeemed ? t("redeemedBenefit") : t("validBenefit")}
              </div>
              <Badge variant={isRedeemed ? "outline" : "secondary"}>
                {isRedeemed
                  ? tBenefits("status.redeemed")
                  : tBenefits("status.valid")}
              </Badge>
            </div>
            <div className="space-y-1">
              <CardTitle className="font-heading text-xl">
                {isRedeemed
                  ? tBenefits("percentOff", { discount: benefit.discount })
                  : benefit.projectName}
              </CardTitle>
              <CardDescription className="text-base text-foreground">
                {isRedeemed
                  ? benefit.projectName
                  : t("discountLabel", { discount: benefit.discount })}
              </CardDescription>
              {!isRedeemed ? (
                <p className="text-sm text-muted-foreground">{validFor}</p>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t("benefitIdLabel")}
                </p>
                <p className="font-mono text-sm font-semibold tracking-wide">
                  {benefit.id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t("statusLabel")}
                </p>
                <p className="text-sm font-medium">
                  {isRedeemed
                    ? tBenefits("status.redeemed")
                    : tBenefits("status.valid")}
                </p>
              </div>
            </div>

            {redeemError ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{t("redemptionFailed")}</AlertTitle>
                <AlertDescription>{redeemError}</AlertDescription>
              </Alert>
            ) : null}

            {isRedeemed && benefit.transactionHash ? (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    {t("redeemedOn")}
                  </p>
                  <p className="text-sm font-medium">
                    {benefit.redeemedAt
                      ? formatBenefitDate(
                          benefit.redeemedAt,
                          toIntlLocale(locale)
                        )
                      : "—"}
                  </p>
                </div>
                <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
                  <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    {t("onChainProof")}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                      {t("transaction")}
                    </p>
                    <p className="font-mono text-sm font-semibold tracking-wide">
                      {shortenHash(benefit.transactionHash)}
                    </p>
                  </div>
                  <TransactionLink
                    hash={benefit.transactionHash}
                    label={t("viewOnExplorer")}
                  />
                </div>
              </>
            ) : null}
          </CardContent>

          {!isRedeemed ? (
            <CardFooter className="mt-auto hidden lg:flex">
              <Button onClick={onRedeem}>{t("redeem")}</Button>
            </CardFooter>
          ) : null}
        </div>

        {!isRedeemed ? (
          <div className="flex flex-col items-center justify-center gap-4 border-t border-border/60 px-(--card-spacing) py-(--card-spacing) lg:w-64 lg:shrink-0 lg:border-t-0 lg:border-l lg:border-border/60">
            <BenefitQr benefitId={benefit.id} />
            <CardFooter className="w-full p-0 lg:hidden">
              <Button className="w-full" onClick={onRedeem}>
                {t("redeem")}
              </Button>
            </CardFooter>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
