import { Nep171Token, RpcAssertParams } from "./test-utils";

export async function assert_nep181_compliance(
  args: RpcAssertParams & {
    nft_total_supply_expected: string;
    nft_tokens_args: { from_index?: string; limit?: number };
    nft_tokens_expected: Nep171Token[];
    nft_supply_for_owner_args: { account_id: string };
    nft_supply_for_owner_expected: string;
    nft_tokens_for_owner_args: {
      account_id: string;
      from_index?: string;
      limit?: number;
    };
    nft_tokens_for_owner_expected: Nep171Token[];
  }
) {
  await assert_nft_total_supply_compliance(args);
  await assert_nft_tokens_compliance(args);
  await assert_nft_supply_for_owner_compliance(args);
  await assert_nft_tokens_for_owner_compliance(args);
}

export async function assert_nft_total_supply_compliance({
  test,
  contract,
  caller,
  nft_total_supply_expected,
}: RpcAssertParams & { nft_total_supply_expected: string }) {
  const supply = await caller.call(contract, "nft_total_supply", {});
  test.is(supply, nft_total_supply_expected);
}

export async function assert_nft_tokens_compliance({
  test,
  contract,
  caller,
  nft_tokens_args,
  nft_tokens_expected,
}: RpcAssertParams & {
  nft_tokens_args: { from_index?: string; limit?: number };
  nft_tokens_expected: Nep171Token[];
}) {
  const tokens = await caller.call(contract, "nft_tokens", nft_tokens_args);
  // TODO: Array<Token>
  test.deepEqual(tokens, nft_tokens_expected);
}

export async function assert_nft_supply_for_owner_compliance({
  test,
  contract,
  caller,
  nft_supply_for_owner_args,
  nft_supply_for_owner_expected,
}: RpcAssertParams & {
  nft_supply_for_owner_args: { account_id: string };
  nft_supply_for_owner_expected: string;
}) {
  const supply = await caller.call(
    contract,
    "nft_supply_for_owner",
    nft_supply_for_owner_args
  );
  test.deepEqual(supply, nft_supply_for_owner_expected);
}

export async function assert_nft_tokens_for_owner_compliance({
  test,
  contract,
  caller,
  nft_tokens_for_owner_args,
  nft_tokens_for_owner_expected,
}: RpcAssertParams & {
  nft_tokens_for_owner_args: {
    account_id: string;
    from_index?: string;
    limit?: number;
  };
  nft_tokens_for_owner_expected: Nep171Token[];
}) {
  const tokens = await caller.call(
    contract,
    "nft_tokens_for_owner",
    nft_tokens_for_owner_args
  );
  // TODO: Array<Token>
  test.deepEqual(tokens, nft_tokens_for_owner_expected);
}
