"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
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
import { ParticipateDialog } from "@/components/project/participate-dialog";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { estimateUsdValue, type ProjectData } from "@/lib/project/data";

type InvestmentCardProps = {
  project: ProjectData;
  address: string | null;
  isConnected: boolean;
  isTestnet: boolean;
};

export function InvestmentCard({
  project,
  address,
  isConnected,
  isTestnet,
}: InvestmentCardProps) {
  const [open, setOpen] = useState(false);
  const { formatted, balance, hasTrustline, isLoading, error, refresh } =
    useQrpBalance(isConnected && isTestnet ? address : null);

  return (
    <>
      <Card className="w-full shadow-xs">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardDescription>Your participation</CardDescription>
              <CardTitle className="font-heading text-xl">
                {project.name}
              </CardTitle>
            </div>
            <Badge variant="outline">{project.token}</Badge>
          </div>
        </CardHeader>

        <CardContent className="gap-5">
          <Separator />

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Balance</p>
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
                    {project.token}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈{" "}
                  {estimateUsdValue(balance ?? "0", project.referenceValueUsd)}
                </p>
              </>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Benefits</p>
            <p className="flex items-center gap-2 font-medium">
              <Gift className="size-4 text-primary" aria-hidden />
              {project.mainBenefit}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Link href="/benefits" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              View benefits
            </Button>
          </Link>
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            Participate
          </Button>
        </CardFooter>
      </Card>

      <ParticipateDialog
        open={open}
        onOpenChange={setOpen}
        project={project}
        investorAddress={address}
        formattedBalance={formatted}
        hasTrustline={hasTrustline}
        isConnected={isConnected}
        isTestnet={isTestnet}
        isLoadingBalance={isLoading}
        onPurchaseSuccess={refresh}
      />
    </>
  );
}
