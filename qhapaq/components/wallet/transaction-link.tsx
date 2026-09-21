"use client";

import { ExternalLink } from "lucide-react";
import { getTransactionExplorerUrl } from "@/lib/stellar/explorer";

type TransactionLinkProps = {
  hash: string;
  label?: string;
  className?: string;
};

/**
 * Renders a link to the Stellar Testnet explorer for a real transaction hash.
 * Do not pass placeholder or mocked hashes.
 */
export function TransactionLink({
  hash,
  label = "View transaction on Stellar Explorer",
  className,
}: TransactionLinkProps) {
  const href = getTransactionExplorerUrl(hash);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
      }
    >
      {label}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}
