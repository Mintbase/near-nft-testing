import {
  fmt_bad_format,
  is_null_or_primitive,
  RpcAssertParams,
} from "./test-utils";

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
    is_null_or_primitive(response.icon, "string"),
    fmt_bad_format(contract_name, "response.icon", response.icon)
  );

  test.true(
    is_null_or_primitive(response.base_uri, "string"),
    fmt_bad_format(contract_name, "response.base_uri", response.base_uri)
  );

  test.true(
    is_null_or_primitive(response.reference, "string"),
    fmt_bad_format(contract_name, "response.reference", response.reference)
  );

  test.true(
    is_null_or_primitive(response.reference_hash, "string"),
    fmt_bad_format(
      contract_name,
      "response.reference_hash",
      response.reference_hash
    )
  );
}
