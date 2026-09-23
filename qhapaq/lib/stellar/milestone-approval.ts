/**
 * Server-only Stellar milestone-approval helpers.
 * Import exclusively from Route Handlers / Server Actions — never from client components.
 *
 * The Testnet self-payment proves that the Admin Wallet registered/approved a
 * milestone evidence hash in Qhapaq. It does NOT prove the physical milestone occurred.
 *
 * On-chain: Memo.hash(SHA-256 of the evidence file).
 * Off-chain/IPFS: CID + metadata (milestoneId, description, fileName, …).
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
import {
  getMilestoneShortCode,
  sha256BytesFromHex,
} from "@/lib/milestones/evidence";
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
  /** Short human ref (e.g. QHP-MS-01) — also stored in Pinata metadata. */
  shortCode: string;
  /** Hex SHA-256 that was placed in Memo.hash. */
  contentHash: string;
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
 * Build, sign (server-side Admin Wallet), and submit a Testnet proof transaction.
 * Memo.hash carries the SHA-256 of the evidence file.
 * Never logs or returns the secret key.
 */
export async function submitMilestoneApprovalProof(input: {
  milestoneId: string;
  contentHash: string;
}): Promise<MilestoneApprovalProofResult> {
  const shortCode = getMilestoneShortCode(input.milestoneId);
  if (!shortCode) {
    throw new MilestoneApprovalSubmitError("Unknown milestone id.");
  }

  let hashBytes: Buffer;
  try {
    hashBytes = sha256BytesFromHex(input.contentHash);
  } catch {
    throw new MilestoneApprovalSubmitError(
      "Invalid evidence content hash for Stellar memo."
    );
  }

  const keypair = loadAdminKeypair();
  const horizon = getHorizonServer();

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
    .addMemo(Memo.hash(hashBytes))
    .setTimeout(180)
    .build();

  transaction.sign(keypair);

  try {
    const response = await horizon.submitTransaction(transaction);
    return {
      hash: response.hash,
      explorerUrl: getTransactionExplorerUrl(response.hash),
      milestoneId: input.milestoneId,
      shortCode,
      contentHash: input.contentHash.toLowerCase(),
      approvedBy: keypair.publicKey(),
    };
  } catch (error: unknown) {
    throw new MilestoneApprovalSubmitError(toSubmitErrorMessage(error));
  }
}
