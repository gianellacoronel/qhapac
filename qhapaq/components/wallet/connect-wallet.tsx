"use client";

import {
  AlertCircle,
  ChevronDown,
  Loader2,
  LogOut,
  Unplug,
  User,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { useRouter } from "@/i18n/navigation";
import { stellarConfig } from "@/lib/stellar/config";
import { shortenAddress } from "@/lib/stellar/wallet";

type ConnectWalletProps = {
  wallet?: ReturnType<typeof useWallet>;
  /** Compact control for the top navigation bar. */
  variant?: "default" | "navbar";
};

export function ConnectWallet({
  wallet: walletProp,
  variant = "default",
}: ConnectWalletProps) {
  const t = useTranslations("wallet");
  const tProfile = useTranslations("profile");
  const router = useRouter();
  const internalWallet = useWallet();
  const wallet = walletProp ?? internalWallet;
  const isNavbar = variant === "navbar";

  const {
    address,
    isConnected,
    isTestnet,
    isFreighterAvailable,
    isLoading,
    error,
    errorCode,
    connect,
    disconnect,
    clearError,
  } = wallet;

  const displayError =
    errorCode === "wrong_network"
      ? t("wrongNetworkMessage", { network: stellarConfig.displayName })
      : errorCode === "unexpected"
        ? t("unexpectedError")
        : error;

  if (isLoading && !isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className={isNavbar ? "h-8 w-28" : "h-9 w-36"} />
      </div>
    );
  }

  return (
    <div
      className={
        isNavbar
          ? "flex flex-col items-end gap-2"
          : "flex flex-col items-start gap-3"
      }
    >
      {!isConnected ? (
        <Button
          onClick={() => {
            void connect().catch(() => {
              /* error surfaced via wallet.error */
            });
          }}
          disabled={isLoading || isFreighterAvailable === false}
          size={isNavbar ? "sm" : "lg"}
        >
          {isLoading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Wallet data-icon="inline-start" />
          )}
          {t("connect")}
        </Button>
      ) : isNavbar ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="font-mono"
                aria-label={tProfile("accountMenuAria", {
                  address: shortenAddress(address!),
                })}
              />
            }
          >
            {shortenAddress(address!)}
            <ChevronDown data-icon="inline-end" className="opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                router.push("/profile");
              }}
            >
              <User />
              {tProfile("viewProfile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={disconnect}
            >
              <LogOut />
              {t("disconnect")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Wallet data-icon="inline-start" />
            {shortenAddress(address!)}
          </Badge>
          <Badge variant={isTestnet ? "outline" : "destructive"}>
            {isTestnet ? stellarConfig.displayName : t("wrongNetwork")}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            aria-label={t("disconnectAria")}
          >
            <Unplug data-icon="inline-start" />
            {t("disconnect")}
          </Button>
        </div>
      )}

      {isFreighterAvailable === false ? (
        <Alert className={isNavbar ? "max-w-xs" : undefined}>
          <AlertCircle />
          <AlertTitle>{t("freighterRequiredTitle")}</AlertTitle>
          <AlertDescription>
            {t("freighterRequiredDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      {displayError ? (
        <Alert
          variant="destructive"
          className={isNavbar ? "max-w-xs" : undefined}
        >
          <AlertCircle />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>
            <span className="block">{displayError}</span>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2"
              onClick={clearError}
            >
              {t("dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
