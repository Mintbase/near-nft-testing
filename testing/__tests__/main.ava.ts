import { Workspace } from "near-workspaces-ava";
import { test_nft_transfer_compliance, assert_token_owner } from "./nep171";

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

workspace.test(
  "Token and event standards (NEP171, NEP297)",
  async (test, { contract, root, alice }) => {
    let call;

    // Mint a token (NEP297)
    call = await root
      .call_raw(
        contract,
        "mint",
        {},
        { attachedDeposit: "1500000000000000000000" }
      )
      .catch(console.error);
    test.true(call.succeeded, "Root couldn't mint token");
    test.is(call.logs.length, 1, "More than one mint log");
    test.is(
      call.logs[0],
      'EVENT_JSON:{"standard":"nep171","version":"1.0.0","event":"nft_mint","data":[{"owner_id":"test.near","token_ids":["0"]}]}',
      "Bad minting logs"
    );
    await assert_token_owner(test, { contract, token_id: "0", owner: root });

    // `nft_transfer` (NEP171 and NEP297)
    await test_nft_transfer_compliance(test, {
      contract,
      from: root,
      to: alice,
      token_id: "0",
    });
    await assert_token_owner(test, {
      contract,
      token_id: "0",
      owner: alice,
    });

    // Burning (NEP297)
    call = await alice
      .call_raw(contract, "burn", { token_id: "0" }, { attachedDeposit: "1" })
      .catch(console.error);
    test.true(call.succeeded, "Alice couldn't burn token");
    test.is(call.logs.length, 1, "More than one burn log");
    test.is(
      call.logs[0],
      'EVENT_JSON:{"standard":"nep171","version":"1.0.0","event":"nft_burn","data":[{"owner_id":"alice.test.near","token_ids":["0"]}]}',
      "Bad minting logs"
    );
  }
);

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
