import { NearAccount } from "near-workspaces-ava";

import { NftRpcAssertParams, Nep171Token, fmt_base_log } from "./test-utils";

async function assert_nft_token_compliance(
  {
    test,
    contract,
    caller,
    token_id,
    bad_token_id,
  }: NftRpcAssertParams & {
    bad_token_id: string;
  },
  contract_name: string
) {
  const base_log = fmt_base_log(contract_name, "nft_token", "NEP171");

  // Check compliance if token exists
  const response: Nep171Token | null = await caller.call(
    contract,
    "nft_token",
    {
      token_id,
    }
  );
  test.is(response.token_id, token_id, `${base_log}: Token ID doesn't match`);
  test.is(
    typeof response.owner_id,
    "string",
    `${base_log}: Token owner is not a string`
  );

  // Check compliance if token does not exist
  const bad_response: Nep171Token | null = await caller.call(
    contract,
    "nft_token",
    {
      token_id: bad_token_id,
    }
  );
  test.is(
    bad_response,
    null,
    `${base_log}: Data for invalid token is not null`
  );
}

/// this assumes that a token is minted!
export async function assert_nep171_compliance(
  {
    test,
    contract,
    caller,
    token_id,
    other_account,
    bad_token_id,
  }: NftRpcAssertParams & { other_account: NearAccount; bad_token_id: string },
  contract_name: string
) {
  const transfer_base_log = fmt_base_log(
    contract_name,
    "nft_transfer",
    "NEP171"
  );
  // nft_token works
  await assert_nft_token_compliance(
    {
      test,
      contract,
      caller,
      token_id,
      bad_token_id,
    },
    contract_name
  );

  // TODO: extract nft_transfer compliance assertions
  // token has correct owner
  await assert_token_owner({ test, contract, caller, token_id });

  // NFT transfers to other account
  await caller.call(
    contract,
    "nft_transfer",
    {
      token_id,
      receiver_id: other_account.accountId,
    },
    { attachedDeposit: "1" }
  );

  // token owner has changed
  await assert_token_owner({ test, contract, caller: other_account, token_id });

  // assert that `caller` can no longer transfer the token
  try {
    await caller.call(
      contract,
      "nft_transfer",
      {
        token_id,
        receiver_id: caller.accountId,
      },
      { attachedDeposit: "1" }
    );
    test.fail(
      `${transfer_base_log}: Allows transfers without token ownership or approval`
    );
  } catch (e) {
    test.is(e.kind.ExecutionError, "Smart contract panicked: Unauthorized");
  }

  // assert that the transfer requires one yocto
  try {
    await other_account.call(contract, "nft_transfer", {
      token_id,
      receiver_id: caller.accountId,
    });
    test.fail(
      `${transfer_base_log}: Allows transfers without yoctoNEAR deposit`
    );
  } catch (e) {
    test.is(
      e.kind.ExecutionError,
      "Smart contract panicked: Requires attached deposit of exactly 1 yoctoNEAR"
    );
  }

  // NFT transfers back (implicitly tests with memo)
  await other_account.call(
    contract,
    "nft_transfer",
    {
      token_id,
      receiver_id: caller.accountId,
      memo: "",
    },
    { attachedDeposit: "1" }
  );

  // token owner has changed again
  await assert_token_owner({ test, contract, caller, token_id });
}

//  Asserts that `caller` is also the token holder.
// This method already assumes that `nft_token` works correctly.
// TODO: msg?
export async function assert_token_owner({
  test,
  contract,
  caller,
  token_id,
}: NftRpcAssertParams) {
  const call: Nep171Token | null = await caller.call(contract, "nft_token", {
    token_id,
  });
  test.not(call, null);
  test.is((call as Nep171Token).owner_id, caller.accountId);
}
