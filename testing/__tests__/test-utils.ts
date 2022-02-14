import { BN, KeyPair, NearAccount } from "near-workspaces-ava";
import { ExecutionContext } from "ava";

// ---------------------- interfaces and common types ----------------------- //
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
}

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
