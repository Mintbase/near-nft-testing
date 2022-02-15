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

export interface Nep171Token {
  token_id: string;
  owner_id: string;
  metadata?: TokenMetadata;
  approved_account_ids?: any; // FIXME: don't use any
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

// TODO: use this
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

// ---------------------------------- misc ---------------------------------- //
export function is_null_or_primitive(x: any, primitive: string): boolean {
  return x === null || typeof x === primitive;
}

export async function mint_one({ contract, caller }, mint_spec: RpcCallSpec) {}

// ---- xxxx ---- //
