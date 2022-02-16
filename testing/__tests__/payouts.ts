import { isPayout, MintCallback, RpcAssertParams } from "./test-utils";
import { NearAccount } from "near-workspaces-ava";

export async function assert_nep199_compliance({
  test,
  contract,
  caller,
  receiver,
  mint,
}: RpcAssertParams & { receiver: NearAccount; mint: MintCallback }) {
  // testing `nft_payout`
  const [token1_id, _owner1_id] = await mint({ contract, caller });
  const payout1 = await caller.call(contract, "nft_payout", {
    token_id: token1_id,
    balance: "100",
    max_len_payout: 1000, // basically unlimited
  });
  test.true(isPayout(payout1));

  // testing `nft_payout_transfer`
  const payout1_transfer = await caller.call(
    contract,
    "nft_transfer_payout",
    {
      token_id: token1_id,
      receiver_id: receiver.accountId,
      balance: "100",
      max_len_payout: 1000, // basically unlimited
    },
    { attachedDeposit: "1" }
  );
  test.true(isPayout(payout1_transfer));
  test.deepEqual(payout1, payout1_transfer);

  // testing again with payout limited to one account
  const [token2_id, _owner2_id] = await mint({ contract, caller });
  const payout2 = await caller.call(contract, "nft_payout", {
    token_id: token2_id,
    balance: "100",
    max_len_payout: 1,
  });
  test.true(isPayout(payout2));
  const payout2_transfer = await caller.call(
    contract,
    "nft_transfer_payout",
    {
      token_id: token2_id,
      receiver_id: receiver.accountId,
      balance: "100",
      max_len_payout: 1,
    },
    { attachedDeposit: "1" }
  );
  test.true(isPayout(payout2_transfer));
  test.deepEqual(payout2, payout2_transfer);
}
