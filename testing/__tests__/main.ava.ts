import { NearAccount, Workspace } from "near-workspaces-ava";

import { assert_nep171_compliance } from "./core";
import { assert_nep177_compliance } from "./metadata";
import { assert_nep181_compliance } from "./enumeration";
import { assert_nep297_compliance } from "./events";
import { mint_one, RpcAssertParams } from "./test-utils";
// import { assert_event_json } from "./test-utils";

// twenty NEAR to fund accounts
const TWENTY_NEAR = "20000000000000000000000000";
// 1.5 mNEAR
// const FIFTEEN_HUNDRED_MICRONEAR = "1500000000000000000000";
const TWO_MILLINEAR = "2000000000000000000000";
const SIX_MILLINEAR = "6000000000000000000000";
const workspace = Workspace.init(async ({ root }) => {
  // Create account
  const alice = await root.createAccount("alice", {
    initialBalance: TWENTY_NEAR,
  });

  // Deploy contracts
  const contract = await root.createAndDeploy(
    "nft-contract",
    "../target/wasm32-unknown-unknown/release/nft_contract.wasm",
    { attachedDeposit: SIX_MILLINEAR }
  );

  return { root, contract, alice };
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
    { attachedDeposit: SIX_MILLINEAR }
  );
  const event: any = JSON.parse(mint_call.logs[0].slice(11));
  // returns [token_id, owner_id]
  return [event.data[0].token_ids[0], event.data[0].owner_id];
}

// TODO: contract list, all tests automatically set up for the contract
workspace.test(
  "nft-contract::core",
  // TODO: move minting into compliance asserter
  async (test, { contract, root, alice }) => {
    // Mint a token (required for the rest of the tests to pass)
    // await root.call(
    //   contract,
    //   "nft_mint",
    //   {},
    //   { attachedDeposit: TWO_MILLINEAR }
    // );
    // test.log("Token minting successful");
    const [token_id, _] = await nft_mint_one({ contract, caller: root });

    // This transfers the token to `other_account` and back, testing the methods
    // described in the NEP171 standard
    // TODO: nft_transfer_call
    await assert_nep171_compliance(
      {
        test,
        contract,
        caller: root, // the current token owner
        token_id, // the minted token
        other_account: alice, // account for the transfer, must exist
        bad_token_id: "x", // ID of a token that must not exist
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
          opts: { attachedDeposit: SIX_MILLINEAR },
        },
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
    test.log("Complies with NEP297");
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
          approved_account_ids: {}, // TODO: shouldn't this be null until I impl it?
        },
        {
          token_id: token1_id,
          owner_id: root_id,
          metadata: default_metadata(1),
          approved_account_ids: {}, // TODO: shouldn't this be null until I impl it?
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
          approved_account_ids: {}, // TODO: shouldn't this be null until I impl it?
        },
      ],
    });
  }
);

// TODO: important interface for these tests -> minting function that returns
// one of:
// - [owner_id, token_id]
// - [owner_id, token_id][]
// that function would allow for non-deterministic token_ids or even randomly
// assigned ownership on minting

// For more example tests, see:
// https://github.com/near/workspaces-js/tree/main/__tests__
