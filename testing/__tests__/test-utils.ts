import { BN, KeyPair, NearAccount } from "near-workspaces-ava";
import { ExecutionContext } from "ava";

// ---------------------- interfaces and common types ----------------------- //
// TODO: shitty name
export interface RpcAssertParams {
  test: ExecutionContext;
  contract: NearAccount;
  caller: NearAccount;
}

export interface NftRpcAssertParams extends RpcAssertParams {
  token_id: string;
  owner_id?: string;
}

export interface RpcCallSpec {
  method: string;
  args: Record<string, unknown>;
  opts?: RpcCallOpts;
}

export interface RpcCallOpts {
  gas?: string | BN;
  attachedDeposit?: string | BN;
  signWithKey?: KeyPair;
}

// ---------------------- NEP interfaces and narrowing ---------------------- //
// TODO: can I get these types from some SDK?

export type Nep171Token = {
  token_id: string;
  owner_id: string;
  metadata?: TokenMetadata;
  approved_account_ids?: Record<string, number>; // FIXME: different in the standard
};

export function isNep171Token(x: any): x is Nep171Token {
  // TODO: strengthen approved_account_ids requirements
  return (
    typeof x.token_id === "string" &&
    typeof x.owner_id === "string" &&
    is_null_or_predicate(x.metadata, isTokenMetadata) &&
    is_null_or_predicate(x.approved_account_ids, (o) => o instanceof Object)
  );
}

export type TokenMetadata = {
  title: string | null; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description: string | null; // free-form description
  media: string | null; // URL to associated media, preferably to decentralized, content-addressed storage
  media_hash: string | null; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies: number | null; // number of copies of this set of metadata in existence when token was minted.
  issued_at: number | null; // When token was issued or minted, Unix epoch in milliseconds
  expires_at: number | null; // When token expires, Unix epoch in milliseconds
  starts_at: number | null; // When token starts being valid, Unix epoch in milliseconds
  updated_at: number | null; // When token was last updated, Unix epoch in milliseconds
  extra: string | null; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference: string | null; // URL to an off-chain JSON file with more info.
  reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

export function isTokenMetadata(x: any): x is TokenMetadata {
  return (
    isStringOrNull(x.title) &&
    isStringOrNull(x.description) &&
    isStringOrNull(x.media) &&
    isStringOrNull(x.media_hash) &&
    isNumberOrNull(x.copies) &&
    isNumberOrNull(x.issued_at) &&
    isNumberOrNull(x.expires_at) &&
    isNumberOrNull(x.starts_at) &&
    isNumberOrNull(x.updated_at) &&
    isNumberOrNull(x.extra) &&
    isStringOrNull(x.reference) &&
    isStringOrNull(x.reference_hash)
  );
}

interface NftEventLogData {
  standard: "nep171";
  version: "1.0.0";
  event: "nft_mint" | "nft_burn" | "nft_transfer";
  data: NftMintLog[] | NftTransferLog[] | NftBurnLog[];
}
export function isNftEventLogData(x: any): x is NftEventLogData {
  if (x.standard !== "nep171") return false;
  if (x.version !== "1.0.0") return false;
  if (x.event === "nft_mint") return is_predicate_array(x.data, isNftMintLog);
  if (x.event === "nft_transfer")
    return is_predicate_array(x.data, isNftTransferLog);
  if (x.event === "nft_burn") return is_predicate_array(x.data, isNftBurnLog);
  return false;
}

interface NftMintLog {
  owner_id: string;
  token_ids: string[];
  memo?: string;
}
export function isNftMintLog(x: any): x is NftMintLog {
  return (
    typeof x.owner_id === "string" &&
    isStringArray(x.token_ids) &&
    isStringOrNull(x.memo)
  );
}

interface NftBurnLog {
  owner_id: string;
  authorized_id?: string;
  token_ids: string[];
  memo?: string;
}
export function isNftBurnLog(x: any): x is NftBurnLog {
  return (
    typeof x.owner_id === "string" &&
    isStringOrNull(x.authorized_id) &&
    isStringArray(x.token_ids) &&
    isStringOrNull(x.memo)
  );
}

interface NftTransferLog {
  authorized_id?: string;
  old_owner_id: string;
  new_owner_id: string;
  token_ids: string[];
  memo?: string;
}
export function isNftTransferLog(x: any): x is NftTransferLog {
  return (
    typeof x.old_owner_id === "string" &&
    typeof x.new_owner_id === "string" &&
    isStringOrNull(x.authorized_id) &&
    isStringArray(x.token_ids) &&
    isStringOrNull(x.memo)
  );
}

// export type Payout = {
//   // TODO:
// };

// export function isPayout(x: any): x is Payout {
//   // TODO:
//   return false;
// }

export type MintCallback = (args: {
  caller: NearAccount;
  contract: NearAccount;
}) => Promise<[string, string]>;

// ------------------------------- assertions ------------------------------- //

// ------------------------------- formatting ------------------------------- //
export function fmt_base_log(
  contract: string,
  method: string,
  standard: string
): string {
  return `${contract} doesn't comply to \`${method}\` (${standard})`;
}

export function fmt_bad_format(
  contract: string,
  what: string,
  what_contents: any
): string {
  return `${contract} has bad format for ${what}: ${JSON.stringify(
    what_contents
  )}`;
}

// ----------------------------- type narrowing ----------------------------- //
export function isStringArray(x: any): x is string[] {
  return is_predicate_array(x, (e) => typeof e === "string");
}
export function isNumberArray(x: any): x is number[] {
  return is_predicate_array(x, (e) => typeof e === "number");
}
export function isBooleanArray(x: any): x is boolean[] {
  return is_predicate_array(x, (e) => typeof e === "boolean");
}

export function isStringOrNull(x: any): x is string | null {
  return is_null_or_predicate(x, (e) => typeof e === "string");
}
export function isNumberOrNull(x: any): x is number | null {
  return is_null_or_predicate(x, (e) => typeof e === "number");
}
export function isBooleanOrNull(x: any): x is boolean | null {
  return is_null_or_predicate(x, (e) => typeof e === "boolean");
}

// ---------------------------------- misc ---------------------------------- //
export type PrimitiveName = "string" | "number" | "boolean";

// export function is_null_or_primitive(
//   x: any,
//   primitive: PrimitiveName
// ): boolean {
//   return x === null || typeof x === primitive;
// }

export function is_null_or_predicate(
  x: any,
  predicate: (_: any) => boolean
): boolean {
  return x === null || predicate(x);
}

// export function is_primitive_array(x: any, primitive: PrimitiveName): boolean {
//   return is_predicate_array(x, (e) => typeof e === primitive);
// }

export function is_predicate_array(
  x: any,
  predicate: (_: any) => boolean
): boolean {
  if (!(x instanceof Array)) return false;
  return x.every((e) => predicate(e));
}

// export async function mint_one({ contract, caller }, mint_spec: RpcCallSpec) {}

// ---- xxxx ---- //
