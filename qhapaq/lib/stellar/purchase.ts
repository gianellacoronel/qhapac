/**
 * Server-only Stellar QRP purchase helpers.
 * Import exclusively from Route Handlers / Server Actions — never from client components.
 * The distributor secret key must never be logged, returned, or imported into `use client` modules.
 */
import {
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder,
} from "stellar-sdk";
import { fetchQrpBalance, getQrpAsset } from "./assets";
import { getHorizonServer, stellarConfig } from "./config";
import { getTransactionExplorerUrl } from "./explorer";

export class PurchaseConfigError extends Error {
  readonly code = "CONFIG" as const;

  constructor(message: string) {
    super(message);
    this.name = "PurchaseConfigError";
  }
}

export class PurchaseValidationError extends Error {
  readonly code:
    | "INVALID_ADDRESS"
    | "INVALID_AMOUNT"
    | "NO_TRUSTLINE"
    | "INSUFFICIENT_DISTRIBUTOR"
    | "ACCOUNT_NOT_FOUND";

  constructor(
    code: PurchaseValidationError["code"],
    message: string
  ) {
    super(message);
    this.name = "PurchaseValidationError";
    this.code = code;
  }
}

export class PurchaseSubmitError extends Error {
  readonly code = "SUBMIT" as const;

  constructor(message: string) {
    super(message);
    this.name = "PurchaseSubmitError";
  }
}

export type PurchaseResult = {
  hash: string;
  explorerUrl: string;
  amount: string;
  investorAddress: string;
  distributorAddress: string;
};

/** Public distributor address from env (safe to expose). */
export function requireQrpDistributorPublicKey(): string {
  const address = process.env.NEXT_PUBLIC_QRP_DISTRIBUTOR?.trim();
  if (!address) {
    throw new PurchaseConfigError(
      "Missing NEXT_PUBLIC_QRP_DISTRIBUTOR environment variable."
    );
  }
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new PurchaseConfigError(
      "NEXT_PUBLIC_QRP_DISTRIBUTOR is not a valid Stellar public key."
    );
  }
  return address;
}

function loadDistributorKeypair(): Keypair {
  const secret = process.env.QHAPAQ_DISTRIBUTOR_SECRET_KEY?.trim();
  if (!secret) {
    throw new PurchaseConfigError(
      "Missing QHAPAQ_DISTRIBUTOR_SECRET_KEY server environment variable."
    );
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(secret);
  } catch {
    throw new PurchaseConfigError(
      "QHAPAQ_DISTRIBUTOR_SECRET_KEY is not a valid Stellar secret key."
    );
  }

  const expectedPublic = requireQrpDistributorPublicKey();
  if (keypair.publicKey() !== expectedPublic) {
    throw new PurchaseConfigError(
      "Distributor secret key does not match NEXT_PUBLIC_QRP_DISTRIBUTOR."
    );
  }

  return keypair;
}

/**
 * QRP purchase amounts: positive integers greater than zero.
 * Returns a normalized string suitable for Operation.payment.
 */
export function parseQrpPurchaseAmount(raw: unknown): string {
  if (typeof raw !== "string" && typeof raw !== "number") {
    throw new PurchaseValidationError(
      "INVALID_AMOUNT",
      "Enter a valid QRP amount greater than zero."
    );
  }

  const asString =
    typeof raw === "number" ? String(raw) : raw.trim().replace(/,/g, "");

  if (!asString) {
    throw new PurchaseValidationError(
      "INVALID_AMOUNT",
      "Enter a valid QRP amount greater than zero."
    );
  }

  if (!/^[1-9]\d*$/.test(asString)) {
    throw new PurchaseValidationError(
      "INVALID_AMOUNT",
      "Amount must be a positive integer greater than zero."
    );
  }

  const value = Number(asString);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new PurchaseValidationError(
      "INVALID_AMOUNT",
      "Enter a valid QRP amount greater than zero."
    );
  }

  return asString;
}

export function parseInvestorAddress(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new PurchaseValidationError(
      "INVALID_ADDRESS",
      "A valid Stellar investor address is required."
    );
  }

  const address = raw.trim();
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new PurchaseValidationError(
      "INVALID_ADDRESS",
      "Investor address is not a valid Stellar public key."
    );
  }

  return address;
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

  return "Failed to submit purchase transaction to Stellar.";
}

async function assertInvestorCanReceive(investorAddress: string): Promise<void> {
  let investorBalance;
  try {
    investorBalance = await fetchQrpBalance(investorAddress);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not load investor account.";
    if (message.includes("was not found")) {
      throw new PurchaseValidationError("ACCOUNT_NOT_FOUND", message);
    }
    throw new PurchaseSubmitError(message);
  }

  if (!investorBalance.hasTrustline) {
    throw new PurchaseValidationError(
      "NO_TRUSTLINE",
      "Your wallet does not have a QRP trustline yet. Add QRP in Freighter (trust the issuer) before purchasing, then try again."
    );
  }
}

async function assertDistributorHasBalance(
  distributorAddress: string,
  amount: string
): Promise<void> {
  const distributorBalance = await fetchQrpBalance(distributorAddress);

  if (!distributorBalance.hasTrustline) {
    throw new PurchaseConfigError(
      "Distributor wallet has no QRP trustline configured."
    );
  }

  if (Number(distributorBalance.balance) < Number(amount)) {
    throw new PurchaseValidationError(
      "INSUFFICIENT_DISTRIBUTOR",
      "The distributor does not have enough QRP to complete this purchase."
    );
  }
}

/**
 * Build, sign (server-side with distributor), and submit a classic QRP payment
 * from the distributor to the investor on Stellar Testnet.
 * Never logs or returns the secret key.
 */
export async function submitQrpPurchase(params: {
  investorAddress: string;
  amount: string;
}): Promise<PurchaseResult> {
  const investorAddress = parseInvestorAddress(params.investorAddress);
  const amount = parseQrpPurchaseAmount(params.amount);
  const keypair = loadDistributorKeypair();
  const distributorAddress = keypair.publicKey();

  if (investorAddress === distributorAddress) {
    throw new PurchaseValidationError(
      "INVALID_ADDRESS",
      "Investor address cannot be the distributor wallet."
    );
  }

  await assertInvestorCanReceive(investorAddress);
  await assertDistributorHasBalance(distributorAddress, amount);

  const horizon = getHorizonServer();

  let account;
  try {
    account = await horizon.loadAccount(distributorAddress);
  } catch {
    throw new PurchaseSubmitError(
      "Could not load the QRP distributor wallet on Stellar Testnet."
    );
  }

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: investorAddress,
        asset: getQrpAsset(),
        amount,
      })
    )
    .addMemo(Memo.text("Qhapaq QRP"))
    .setTimeout(180)
    .build();

  transaction.sign(keypair);

  try {
    const response = await horizon.submitTransaction(transaction);
    return {
      hash: response.hash,
      explorerUrl: getTransactionExplorerUrl(response.hash),
      amount,
      investorAddress,
      distributorAddress,
    };
  } catch (error: unknown) {
    throw new PurchaseSubmitError(toSubmitErrorMessage(error));
  }
}
