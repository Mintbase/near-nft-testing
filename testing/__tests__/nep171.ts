import { NearAccount } from "near-workspaces-ava";
import { ExecutionContext } from "ava";

export async function test_nft_transfer_compliance(
  test: ExecutionContext,
  {
    contract,
    from,
    to,
    token_id,
  }: {
    contract: NearAccount;
    from: NearAccount;
    to: NearAccount;
    token_id: string;
  }
) {
  let call = await from.call_raw(
    contract,
    "nft_transfer",
    {
      receiver_id: to.accountId,
      token_id,
      memo: "",
    },
    { attachedDeposit: "1" }
  );

  test.true(call.succeeded, `${from} couldn't transfer token`);
  test.is(call.logs.length, 1, "More than one transfer log");
  test.is(
    call.logs[0],
    'EVENT_JSON:{"standard":"nep171","version":"1.0.0","event":"nft_transfer","data":[{"old_owner_id":"test.near","new_owner_id":"alice.test.near","token_ids":["0"],"memo":""}]}',
    "Bad transfer logs"
  );
}

interface Nep171Token {
  id: string;
  owner_id: string;
}

// This implicitly tests compliance with NftCore::nft_token
export async function assert_token_owner(
  test: ExecutionContext,
  {
    contract,
    token_id,
    owner,
  }: { contract: NearAccount; token_id: string; owner: NearAccount }
) {
  const call: Nep171Token | null = await owner.call(contract, "nft_token", {
    token_id,
  });
  test.not(call, null);
  test.is((call as Nep171Token).owner_id, owner.accountId);
}

// export function nft_transfer_call_compliance() {

// }

// export function nft_token_compliance() {

// }

// TODO: minting + burn compliance, but needs input of method + args
