import { Workspace } from "near-workspaces-ava";

import { assert_nep171_compliance } from "./core";
import { assert_nep177_compliance } from "./metadata";
// import { assert_nep178_compliance } from "./enumeration";
import { assert_nep297_compliance } from "./events";
// import { assert_event_json } from "./test-utils";

const TWENTY_NEAR = "20000000000000000000000000";
const workspace = Workspace.init(async ({ root }) => {
  // Create account
  const alice = await root.createAccount("alice", {
    initialBalance: TWENTY_NEAR,
  });

  // Deploy contracts
  const contract = await root.createAndDeploy(
    "nft-contract",
    "../target/wasm32-unknown-unknown/release/nft_contract.wasm",
    { attachedDeposit: "1500000000000000000000" }
  );

  return { root, contract, alice };
});

workspace.test("nft-contract", async (test, { contract, root, alice }) => {
  // Mint a token (required for the rest of the tests to pass)
  await root.call(
    contract,
    "nft_mint",
    {},
    { attachedDeposit: "1500000000000000000000" }
  );
  test.log("Token minting successful");

  // This transfers the token to `other_account` and back, testing the methods
  // described in the NEP171 standard
  // TODO: nft_transfer_call
  await assert_nep171_compliance(
    {
      test,
      contract,
      caller: root, // the current token owner
      token_id: "0", // the minted token
      other_account: alice, // account for the transfer, must exist
      bad_token_id: "x", // ID of a token that must not exist
    },
    "nft-contract"
  );
  test.log("Complies with NEP171");

  // await assert_nep177_compliance(
  //   { test, contract, caller: root },
  //   "nft-contract"
  // );
  // test.log("Complies with NEP178");

  await assert_nep297_compliance(
    { test, contract, minter: root, burner: alice },
    {
      mint_spec: {
        method: "nft_mint",
        args: {},
        opts: { attachedDeposit: "1500000000000000000000" },
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

  // // this allows me to see the logs, even if all tests pass
  // test.fail();
});

// workspace.test(
//   "statuses initialized in Workspace.init",
//   async (test, { alice, contract, root }) => {
//     // If you want to store a `view` in a local variable, you can inform
//     // TypeScript what sort of return value you expect.
//     const aliceStatus: string = await contract.view("get_status", {
//       account_id: alice,
//     });
//     const rootStatus: null = await contract.view("get_status", {
//       account_id: root,
//     });

//     test.is(aliceStatus, "hello");

//     // Note that the test above sets a status for `root`, but here it's still
//     // null! This is because tests run concurrently in isolated environments.
//     test.is(rootStatus, null);
//   }
// );

// workspace.test("extra goodies", async (test, { alice, contract, root }) => {
//   /**
//    * AVA's `test` object has all sorts of handy functions. For example: `test.log`.
//    * This is better than `console.log` in a couple ways:
//    *
//    *   - The log output only shows up if you pass `--verbose` or if the test fails.
//    *   - The output is nicely-formatted, right below the rest of the test output.
//    *
//    * Try it out using `npm run test -- --verbose` (with yarn: `yarn test --verbose`),
//    * or by adding `--verbose` to the `test` script in package.json
//    */
//   test.log({
//     alice: alice.accountId,
//     contract: contract.accountId,
//     root: root.accountId,
//   });

//   /**
//    * The Account class from near-workspaces overrides `toJSON` so that removing
//    * `.accountId` from the lines above gives the same behavior.
//    * (This explains something about the example `contract.view` calls above:
//    * you may have noticed that they use things like `{account_id: root}`
//    * instead of `{account_id: root.accountId}`.)
//    * Here's a test to prove it; try updating the `test.log` above to see it.
//    */
//   test.is(
//     JSON.stringify({ alice }), // This is JS shorthand for `{ alice: alice }`
//     JSON.stringify({ alice: alice.accountId })
//   );
// });

// // For more example tests, see:
// // https://github.com/near/workspaces-js/tree/main/__tests__
