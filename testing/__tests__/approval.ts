import { NearAccount } from "near-workspaces-ava";
import { MintCallback, RpcAssertParams } from "./test-utils";

const ONE_MILLINEAR = "1000000000000000000000";

// TODO:
// - [] assert with approval id
// - [] assert requirement of at least 1 yN deposit
// - [] assert that required funds for approving are returned on revoking
export async function assert_nep178_compliance({
  test,
  contract,
  caller,
  approved,
  mint,
}: RpcAssertParams & {
  approved: [NearAccount, NearAccount];
  mint: MintCallback;
}) {
  const [token_id, owner_id] = await mint({ caller, contract });
  // FIXME: required by test, not by standard
  test.is(owner_id, caller.accountId);

  // util functions
  const assertApprovals = async (expected: [boolean, boolean]) => {
    const isApproved0 = await caller.call(contract, "nft_is_approved", {
      token_id,
      approved_account_id: approved[0].accountId,
    });
    const isApproved1 = await caller.call(contract, "nft_is_approved", {
      token_id,
      approved_account_id: approved[1].accountId,
    });
    test.deepEqual([isApproved0, isApproved1], expected);
  };

  const approve = async (account: NearAccount) => {
    await caller.call(
      contract,
      "nft_approve",
      {
        token_id,
        account_id: account.accountId,
      },
      { attachedDeposit: ONE_MILLINEAR }
    );
  };

  // no initial approvals, implicitly tests nft_is_approved
  await assertApprovals([false, false]);
  test.log("Approval setup ok");

  // nft_approve
  await approve(approved[0]);
  await assertApprovals([true, false]);
  test.log("`nft_approve` ok");

  // // nft_revoke
  // await caller.call(
  //   contract,
  //   "nft_revoke",
  //   {
  //     token_id,
  //     account_id: approved[0].accountId,
  //   },
  //   { attachedDeposit: "1" }
  // );
  // await assertApprovals([false, false]);
  // test.log("`nft_revoke` ok");

  // // nft_revoke_all
  // await approve(approved[0]);
  // await approve(approved[1]);
  // await assertApprovals([true, true]);
  // await caller.call(
  //   contract,
  //   "nft_revoke_all",
  //   {
  //     token_id,
  //   },
  //   { attachedDeposit: "1" }
  // );
  // await assertApprovals([false, false]);
  // test.log("`nft_revoke_all` ok");
}
