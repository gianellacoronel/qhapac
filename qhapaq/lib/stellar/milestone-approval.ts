/**
 * Server-only Stellar milestone-approval helpers.
 * Import exclusively from Route Handlers / Server Actions — never from client components.
 *
 * The Testnet self-payment proves that the Admin Wallet registered/approved a
 * milestone in Qhapaq. It does NOT prove the physical milestone occurred.
 */
import {
  Asset,
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";
import { getAdminAddress } from "@/lib/auth/role";
import { buildMilestoneApprovalMemo } from "@/lib/milestones/memo";
import { getHorizonServer, stellarConfig } from "./config";
import { getTransactionExplorerUrl } from "./explorer";

/** Tiny native XLM self-payment used as on-chain milestone approval proof. */
export const MILESTONE_APPROVAL_XLM_AMOUNT = "0.0001";

export class MilestoneApprovalConfigError extends Error {
  readonly code = "CONFIG" as const;

  constructor(message: string) {
    super(message);
    this.name = "MilestoneApprovalConfigError";
  }
}

export class MilestoneApprovalSubmitError extends Error {
  readonly code = "SUBMIT" as const;

  constructor(message: string) {
    super(message);
    this.name = "MilestoneApprovalSubmitError";
  }
}

export type MilestoneApprovalProofResult = {
  hash: string;
  explorerUrl: string;
  milestoneId: string;
  memo: string;
  approvedBy: string;
};

function loadAdminKeypair(): Keypair {
  const secret = process.env.QHAPAQ_ADMIN_SECRET_KEY?.trim();
  if (!secret) {
    throw new MilestoneApprovalConfigError(
      "Missing QHAPAQ_ADMIN_SECRET_KEY server environment variable."
    );
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(secret);
  } catch {
    throw new MilestoneApprovalConfigError(
      "QHAPAQ_ADMIN_SECRET_KEY is not a valid Stellar secret key."
    );
  }

  const expectedAdmin = getAdminAddress();
  if (!expectedAdmin) {
    throw new MilestoneApprovalConfigError(
      "Missing or invalid NEXT_PUBLIC_QRP_ADMIN public admin address."
    );
  }

  if (keypair.publicKey() !== expectedAdmin) {
    throw new MilestoneApprovalConfigError(
      "Admin wallet configuration does not match NEXT_PUBLIC_QRP_ADMIN."
    );
  }

  return keypair;
}

function toSubmitErrorMessage(error: unknown): string {
  const horizonError = error as {
    response?: {
      data?: {
        extras?: {
          result_codes?: {
            transaction?: string;
            operations?: string[];
          };
        };
        title?: string;
        detail?: string;
      };
    };
    message?: string;
  };

  const codes = horizonError.response?.data?.extras?.result_codes;
  if (codes) {
    const ops = codes.operations?.join(", ");
    return `Transaction rejected (${codes.transaction ?? "unknown"}${
      ops ? `: ${ops}` : ""
    }).`;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Failed to submit milestone approval transaction to Stellar.";
}

/**
 * Build, sign (server-side), and submit a Testnet proof transaction.
 * Memo identifies the milestone. Does not transfer QRP.
 * Never logs or returns the secret key.
 */
export async function submitMilestoneApprovalProof(
  milestoneId: string
): Promise<MilestoneApprovalProofResult> {
  const keypair = loadAdminKeypair();
  const horizon = getHorizonServer();
  const memo = buildMilestoneApprovalMemo(milestoneId);

  let account;
  try {
    account = await horizon.loadAccount(keypair.publicKey());
  } catch {
    throw new MilestoneApprovalSubmitError(
      "Could not load the Admin Wallet on Stellar Testnet."
    );
  }

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: keypair.publicKey(),
        asset: Asset.native(),
        amount: MILESTONE_APPROVAL_XLM_AMOUNT,
      })
    )
    .addMemo(Memo.text(memo))
    .setTimeout(180)
    .build();

  transaction.sign(keypair);

  try {
    const response = await horizon.submitTransaction(transaction);
    return {
      hash: response.hash,
      explorerUrl: getTransactionExplorerUrl(response.hash),
      milestoneId,
      memo,
      approvedBy: keypair.publicKey(),
    };
  } catch (error: unknown) {
    throw new MilestoneApprovalSubmitError(toSubmitErrorMessage(error));
  }
}
