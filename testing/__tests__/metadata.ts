import { fmt_bad_format, RpcAssertParams, isStringOrNull } from "./test-utils";

export interface Nep178ContractMetadata {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  base_uri: string | null;
  reference: string | null;
  reference_hash: string | null;
}

export async function assert_nep177_compliance(
  { test, contract, caller }: RpcAssertParams,
  contract_name: string
) {
  const response: Nep178ContractMetadata = await caller.call(
    contract,
    "nft_metadata",
    {}
  );

  test.true(
    response.spec === "nft-1.0.0",
    fmt_bad_format(contract_name, "response.spec", response.spec)
  );

  test.true(
    typeof response.name === "string",
    fmt_bad_format(contract_name, "response.name", response.name)
  );

  test.true(
    typeof response.symbol === "string",
    fmt_bad_format(contract_name, "response.symbol", response.symbol)
  );

  test.true(
    isStringOrNull(response.icon),
    fmt_bad_format(contract_name, "response.icon", response.icon)
  );

  test.true(
    isStringOrNull(response.base_uri),
    fmt_bad_format(contract_name, "response.base_uri", response.base_uri)
  );

  test.true(
    isStringOrNull(response.reference),
    fmt_bad_format(contract_name, "response.reference", response.reference)
  );

  test.true(
    isStringOrNull(response.reference_hash),
    fmt_bad_format(
      contract_name,
      "response.reference_hash",
      response.reference_hash
    )
  );
}
