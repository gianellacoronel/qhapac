"use client";

import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { BenefitQr } from "@/components/benefits/benefit-qr";
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
import { Separator } from "@/components/ui/separator";
import type { GeneratedBenefit } from "@/lib/benefits/types";
import { formatBenefitDate } from "@/lib/benefits/utils";

type GeneratedBenefitViewProps = {
  benefit: GeneratedBenefit;
};

export function GeneratedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  if (benefit.status === "redeemed") {
    return <RedeemedBenefitView benefit={benefit} />;
  }

  return (
    <Card className="w-full max-w-md shadow-xs">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-4" aria-hidden />
          Benefit generated
        </div>
        <div className="space-y-1">
          <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
            {benefit.discount}% OFF
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {benefit.projectName}
          </CardDescription>
          <p className="text-sm text-muted-foreground">{benefit.validFor}</p>
        </div>
      </CardHeader>

      <CardContent className="gap-5">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Benefit ID
          </p>
          <p className="font-mono text-lg font-semibold tracking-wide">
            {benefit.id}
          </p>
        </div>

        <div className="flex justify-center">
          <BenefitQr benefitId={benefit.id} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Valid for one redemption
        </p>
      </CardContent>

      <CardFooter>
        <Link
          href={`/benefits/verify?id=${encodeURIComponent(benefit.id)}`}
          className="w-full"
        >
          <Button className="w-full">
            <ShieldCheck data-icon="inline-start" />
            Verify benefit
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function RedeemedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  return (
    <Card className="w-full max-w-md shadow-xs">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden />
            Benefit redeemed
          </div>
          <Badge variant="outline">Redeemed</Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
            {benefit.discount}% OFF
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {benefit.projectName}
          </CardDescription>
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
            <p className="text-sm font-medium">Redeemed</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Redeemed on
            </p>
            <p className="text-sm font-medium">
              {benefit.redeemedAt
                ? formatBenefitDate(benefit.redeemedAt)
                : "—"}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Stellar proof
          </p>
          <p className="text-sm font-medium">Coming next</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            On-chain proof will be recorded when the redemption is finalized.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
