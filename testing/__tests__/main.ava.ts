import { NearAccount, Workspace } from "near-workspaces-ava";
// For example tests, see:
// https://github.com/near/workspaces-js/tree/main/__tests__

import { assert_nep171_compliance } from "./core";
import { assert_nep177_compliance } from "./metadata";
import { assert_nep178_compliance } from "./approval";
import { assert_nep181_compliance } from "./enumeration";
import { assert_nep297_compliance } from "./events";
import { assert_nep199_compliance } from "./payouts";
import * as util from "./test-utils";

// We can init different workspaces for different contracts :)
const TWENTY_NEAR = "20000000000000000000000000";
const MILLINEAR = [
  "0",
  "1000000000000000000000",
  "2000000000000000000000",
  "3000000000000000000000",
  "4000000000000000000000",
  "5000000000000000000000",
  "6000000000000000000000",
  "7000000000000000000000",
  "8000000000000000000000",
  "9000000000000000000000",
];

const workspace = Workspace.init(async ({ root }) => {
  // Create accounts
  const alice = await root.createAccount("alice", {
    initialBalance: TWENTY_NEAR,
  });
  const bob = await root.createAccount("bob", {
    initialBalance: TWENTY_NEAR,
  });

  // Deploy contracts
  const contract = await root.createAndDeploy(
    "nft-contract",
    "../target/wasm32-unknown-unknown/release/nft_contract.wasm",
    { attachedDeposit: MILLINEAR[6] }
  );

  return { root, contract, alice, bob };
});

async function nft_mint_one({
  caller,
  contract,
}: {
  caller: NearAccount;
  contract: NearAccount;
}): Promise<[string, string]> {
  const mint_call = await caller.call_raw(
    contract,
    "nft_mint",
    {},
    { attachedDeposit: MILLINEAR[7] }
  );
  const event: any = JSON.parse(mint_call.logs[0].slice(11));
  // returns [token_id, owner_id]
  return [event.data[0].token_ids[0], event.data[0].owner_id];
}

// TODO: move into the utils file
// this function is for my own sanity
workspace.test("utils", (test, {}) => {
  test.true(util.is_null_or_predicate(null, (n) => n % 2 === 0));
  test.true(util.is_null_or_predicate(2, (n) => n % 2 === 0));
  test.false(util.is_null_or_predicate(1, (n) => n % 2 === 0));

  test.true(util.isStringOrNull("abc"));
  test.true(util.isStringOrNull(null));
  test.false(util.isStringOrNull(42));
  test.false(util.isStringOrNull(true));
  test.true(util.isNumberOrNull(42));
  test.true(util.isNumberOrNull(null));
  test.false(util.isNumberOrNull("abc"));
  test.false(util.isNumberOrNull(true));
  test.true(util.isBooleanOrNull(false));
  test.true(util.isBooleanOrNull(null));
  test.false(util.isBooleanOrNull(42));
  test.false(util.isBooleanOrNull("abc"));

  test.true(util.is_predicate_array([0, 2, 4], (n) => n % 2 === 0));
  test.false(util.is_predicate_array([0, 1], (n) => n % 2 === 0));
  test.false(util.is_predicate_array(0, (n) => n % 2 === 0));

  test.true(util.isStringArray(["abc", "def"]));
  test.false(util.isStringArray(["abc", 42]));
  test.true(util.isNumberArray([1, 2, 3]));
  test.false(util.isNumberArray([1, false]));
  test.true(util.isBooleanArray([true, false]));
  test.false(util.isBooleanArray([true, 1]));
});

// TODO: contract list, all tests automatically set up for the contract
workspace.test(
  "nft-contract::core",
  async (test, { contract, root, alice }) => {
    // This transfers the token to `other_account` and back, testing the methods
    // described in the NEP171 standard
    // TODO: nft_transfer_call
    await assert_nep171_compliance(
      {
        test,
        contract,
        caller: root, // the current token owner
        other_account: alice, // account for the transfer, must exist
        mint: nft_mint_one,
      },
      "nft-contract"
    );
  }
);

workspace.test("nft-contract::metadata", async (test, { contract, root }) => {
  await assert_nep177_compliance(
    { test, contract, caller: root },
    "nft-contract"
  );
});

workspace.test(
  "nft-contract::events",
  async (test, { contract, root, alice }) => {
    await assert_nep297_compliance(
      { test, contract, minter: root, burner: alice },
      {
        mint_spec: {
          method: "nft_mint",
          args: {},
          opts: { attachedDeposit: MILLINEAR[7] },
        },
        // // transfer_spec is optional, because `nft_transfer` is part of the
        // // core standard
        // transfer_spec: {
        //   method: "nft_transfer",
        //   args: { receiver_id: alice.accountId },
        //   opts: { attachedDeposit: "1" },
        // },
        burn_spec: {
          method: "nft_burn",
          // instructs to use the token_id extracted from the mint event
          args: { token_id: "__token_id__" },
          opts: { attachedDeposit: "1" },
        },
      }
    );
  }
);

workspace.test(
  "nft-contract::enumeration",
  async (test, { contract, root, alice }) => {
    const root_id = root.accountId;
    const alice_id = alice.accountId;

    const [token0_id, _owner0] = await nft_mint_one({ contract, caller: root });
    const [token1_id, _owner1] = await nft_mint_one({ contract, caller: root });
    const default_metadata = (id: number) => ({
      title: `NFT ${id}`,
      description: `This is NFT ${id}`,
      media: null,
      media_hash: null,
      copies: 1,
      issued_at: null,
      expires_at: null,
      starts_at: null,
      updated_at: null,
      extra: null,
      reference: null,
      reference_hash: null,
    });
    await root.call(
      contract,
      "nft_transfer",
      {
        token_id: token0_id,
        receiver_id: alice_id,
      },
      { attachedDeposit: "1" }
    );

    await assert_nep181_compliance({
      test,
      contract,
      caller: root,
      nft_total_supply_expected: "2",
      nft_tokens_args: {},
      nft_tokens_expected: [
        {
          token_id: token0_id,
          owner_id: alice_id,
          metadata: default_metadata(0),
          approved_account_ids: {},
        },
        {
          token_id: token1_id,
          owner_id: root_id,
          metadata: default_metadata(1),
          approved_account_ids: {},
        },
      ],
      nft_supply_for_owner_args: { account_id: alice_id },
      nft_supply_for_owner_expected: "1",
      nft_tokens_for_owner_args: { account_id: alice_id },
      nft_tokens_for_owner_expected: [
        {
          token_id: token0_id,
          owner_id: alice_id,
          metadata: default_metadata(0),
          approved_account_ids: {},
        },
      ],
    });
  }
);

workspace.test(
  "nft-contract::approvals",
  async (test, { contract, root, alice, bob }) => {
    await assert_nep178_compliance({
      test,
      contract,
      caller: root,
      approved: [alice, bob],
      mint: nft_mint_one,
    });
  }
);

workspace.test(
  "nft-contract::payouts",
  async (test, { contract, root, alice }) => {
    await assert_nep199_compliance({
      test,
      contract,
      caller: root,
      receiver: alice,
      mint: nft_mint_one,
    });
  }
);
