"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { stellarConfig } from "@/lib/stellar/config";

type ParticipationCardProps = {
  address: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  projectName?: string;
  assetLabel?: string;
};

export function ParticipationCard({
  address,
  isConnected,
  isTestnet,
  projectName = "Huaral Resort",
  assetLabel = "Qhapaq",
}: ParticipationCardProps) {
  const { formatted, hasTrustline, isLoading, error, refresh, balance } =
    useQrpBalance(isConnected && isTestnet ? address : null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{assetLabel}</CardDescription>
            <CardTitle className="font-heading text-xl">{projectName}</CardTitle>
          </div>
          <Badge variant="outline">{stellarConfig.displayName}</Badge>
        </div>
      </CardHeader>

      <CardContent className="gap-4">
        <Separator />

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Your participation</p>
          {!isConnected ? (
            <p className="text-2xl font-medium tracking-tight text-muted-foreground">
              Connect wallet
            </p>
          ) : !isTestnet ? (
            <p className="text-2xl font-medium tracking-tight text-destructive">
              Switch to Testnet
            </p>
          ) : isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : error ? (
            <p className="text-2xl font-medium tracking-tight text-destructive">
              —
            </p>
          ) : (
            <p className="text-2xl font-medium tracking-tight">
              {formatted ?? "0"}{" "}
              <span className="text-base font-normal text-muted-foreground">
                QRP
              </span>
            </p>
          )}
          {isConnected && isTestnet && hasTrustline === false && !isLoading && !error ? (
            <p className="text-xs text-muted-foreground">
              No QRP trustline found on this account yet.
            </p>
          ) : null}
          {isConnected && isTestnet && balance != null && !isLoading && !error ? (
            <p className="text-xs text-muted-foreground">
              Live balance from Stellar Horizon
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Network</p>
          <p className="font-medium">{stellarConfig.displayName}</p>
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

        {isConnected && isTestnet && !error ? (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            disabled={isLoading}
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshCw data-icon="inline-start" />
            Refresh balance
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
