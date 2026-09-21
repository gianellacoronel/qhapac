"use client";

import Link from "next/link";
import { AlertCircle, Gift, RefreshCw, Sparkles } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { estimateUsdValue, huaralResort } from "@/lib/project/data";

type ParticipationCardProps = {
  address: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  projectName?: string;
  onParticipate?: () => void;
};

export function ParticipationCard({
  address,
  isConnected,
  isTestnet,
  projectName = huaralResort.name,
  onParticipate,
}: ParticipationCardProps) {
  const { formatted, balance, hasTrustline, isLoading, error, refresh } =
    useQrpBalance(isConnected && isTestnet ? address : null);

  return (
    <Card className="w-full max-w-md shadow-xs">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>Your participation</CardDescription>
            <CardTitle className="font-heading text-xl">
              {projectName}
            </CardTitle>
          </div>
          <Badge variant="outline">{huaralResort.token}</Badge>
        </div>
      </CardHeader>

      <CardContent className="gap-5">
        <Separator />

        <div className="space-y-1">
          {!isConnected ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-muted-foreground">
              Connect wallet
            </p>
          ) : !isTestnet ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-destructive">
              Switch to Testnet
            </p>
          ) : isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : error ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-destructive">
              —
            </p>
          ) : (
            <>
              <p className="font-heading text-3xl font-semibold tracking-tight">
                {formatted ?? "0"}{" "}
                <span className="text-lg font-normal text-muted-foreground">
                  {huaralResort.token}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                ≈{" "}
                {estimateUsdValue(
                  balance ?? "0",
                  huaralResort.referenceValueUsd,
                )}
              </p>
            </>
          )}
          {isConnected &&
          isTestnet &&
          hasTrustline === false &&
          !isLoading &&
          !error ? (
            <p className="text-xs text-muted-foreground">
              No QRP trustline found on this account yet.
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Benefits</p>
          <p className="flex items-center gap-2 font-medium">
            <Gift className="size-4 text-primary" aria-hidden />
            {huaralResort.mainBenefit}
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load QRP balance</AlertTitle>
            <AlertDescription>
              <span className="block">{error}</span>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2"
                onClick={() => {
                  void refresh();
                }}
              >
                <RefreshCw data-icon="inline-start" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href="/benefits" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            View benefits
          </Button>
        </Link>
        {onParticipate ? (
          <Button className="w-full sm:w-auto" onClick={onParticipate}>
            Participate
          </Button>
        ) : (
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full">
              <Sparkles data-icon="inline-start" />
              Participate
            </Button>
          </Link>
        )}
        {isConnected && isTestnet && !error ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:ml-auto sm:w-auto"
            disabled={isLoading}
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
