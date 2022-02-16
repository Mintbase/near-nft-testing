import { NearAccount } from "near-workspaces-ava";

import {
  NftRpcAssertParams,
  RpcAssertParams,
  Nep171Token,
  fmt_base_log,
  isNep171Token,
  MintCallback,
} from "./test-utils";

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
  test.true(isNep171Token(response), `${base_log}: Bad format`);
  test.is(response.token_id, token_id, `${base_log}: Token ID doesn't match`);

  // Check compliance if token does not exist
  const bad_response: Nep171Token | null = await caller.call(
    contract,
    "nft_token",
    { token_id: bad_token_id }
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
    other_account,
    mint,
  }: RpcAssertParams & {
    other_account: NearAccount;
    mint: MintCallback;
  },
  contract_name: string
) {
  const transfer_base_log = fmt_base_log(
    contract_name,
    "nft_transfer",
    "NEP171"
  );

  // mnt the token
  const [token_id, owner_id] = await mint({ caller, contract });
  // FIXME: required by test, not by standard
  // to meaningfully proceed
  test.is(owner_id, caller.accountId);

  // nft_token works
  await assert_nft_token_compliance(
    {
      test,
      contract,
      caller,
      token_id,
      bad_token_id: "",
    },
    contract_name
  );

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
  await assert_token_owner({ test, contract, caller: other_account, token_id });

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
  await assert_token_owner({ test, contract, caller: other_account, token_id });

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
