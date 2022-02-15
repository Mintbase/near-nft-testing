import { NearAccount } from "near-workspaces-ava";
import { ExecutionContext } from "ava";
import { RpcCallSpec, RpcAssertParams } from "./test-utils";

// coverage todo
// - batch_mint
// - batch_transfer
// - batch_burn
// - approved transfers
// - approved burns

// testing functions todo
// - assert_nft_mint_event_log
// - assert_nft_transfer_event_log
// - assert_nft_burn_event_log

// TODO: this function is actually bad, because it assumes a lot about the
// methods and inner workings of a contract
export async function assert_nep297_compliance(
  {
    test,
    contract,
    minter,
    burner,
  }: {
    test: ExecutionContext;
    contract: NearAccount;
    minter: NearAccount;
    burner: NearAccount;
  },
  {
    mint_spec,
    transfer_spec,
    burn_spec,
  }: {
    mint_spec: RpcCallSpec;
    transfer_spec?: RpcCallSpec;
    burn_spec: RpcCallSpec;
  }
) {
  const [owner_id, token_id] = await assert_nft_mint_compliance(
    { test, contract, caller: minter },
    mint_spec
  );

  // FIXME: work my way around this assertion, as it's not required by the spec,
  // but I currently need for the upcoming calls
  // => could be done by providing a callback to "clean up"
  test.is(owner_id, minter.accountId);

  if (!transfer_spec) {
    transfer_spec = {
      method: "nft_transfer",
      args: { receiver_id: burner.accountId, token_id },
      opts: { attachedDeposit: "1" },
    };
  }
  // TODO: we might wish to return a new owner_id from this
  await assert_nft_transfer_compliance(
    { test, contract, caller: minter },
    transfer_spec
  );
  test.log("transfer successful");

  // TODO: what if the transfer doesn't happen to the burner? -> ignore for now

  if (burn_spec.args.token_id === "__token_id__")
    burn_spec.args.token_id = token_id;
  await assert_nft_burn_compliance(
    { test, contract, caller: burner },
    burn_spec
  );
}

// Returns owner_id and token_id of the first token in the mint logs.
async function assert_nft_mint_compliance(
  { test, caller, contract }: RpcAssertParams,
  { method, args, opts }: RpcCallSpec
): Promise<[string, string]> {
  const mint_call = await caller.call_raw(contract, method, args, opts);
  test.true(mint_call.succeeded, "Bad spec for mint method");
  // test.is(mint_call.logs.length, 1, "More than one mint log");
  const log: any = parse_event_json(test, mint_call.logs[0]);
  //test.is(mint_call.logs[0].slice(0, 11), "EVENT_JSON:");
  //const log = JSON.parse(mint_call.logs[0].slice(11));
  assert_nep297_event(test, log, "nft_mint");

  test.is(typeof log.data[0].owner_id, "string");
  // test.is(data[0].owner_id, caller.accountId);
  test.is(typeof log.data[0].token_ids[0], "string");
  return [log.data[0].owner_id, log.data[0].token_ids[0]];
}

// TODO: this currently only test transfers by the owner, excluding approvals
async function assert_nft_transfer_compliance(
  { test, caller, contract }: RpcAssertParams,
  { method, args, opts }: RpcCallSpec
) {
  const transfer_call = await caller.call_raw(contract, method, args, opts);
  const log: any = parse_event_json(test, transfer_call.logs[0]);
  // test.true(transfer_call.succeeded, "Bad spec for transfer method");
  // test.is(transfer_call.logs[0].slice(0, 11), "EVENT_JSON:");
  // const log = JSON.parse(transfer_call.logs[0].slice(11));
  assert_nep297_event(test, log, "nft_transfer");

  test.is(typeof log.data[0].old_owner_id, "string");
  test.is(typeof log.data[0].new_owner_id, "string");
  test.is(typeof log.data[0].token_ids[0], "string");
}

async function assert_nft_burn_compliance(
  { test, caller, contract }: RpcAssertParams,
  { method, args, opts }: RpcCallSpec
) {
  const burn_call = await caller.call_raw(contract, method, args, opts);
  const log: any = parse_event_json(test, burn_call.logs[0]);
  //test.true(burn_call.succeeded, "Bad spec for burn method");
  //test.is(burn_call.logs[0].slice(0, 11), "EVENT_JSON:");
  // const log = JSON.parse(burn_call.logs[0].slice(11));
  assert_nep297_event(test, log, "nft_burn");

  test.is(typeof log.data[0].owner_id, "string");
  test.is(typeof log.data[0].token_ids[0], "string");
}

function assert_nep297_event(
  test: ExecutionContext,
  log: any,
  kind?: "nft_mint" | "nft_transfer" | "nft_burn"
) {
  test.is(log.standard, "nep171");
  test.is(log.version, "1.0.0");
  test.true(["nft_mint", "nft_transfer", "nft_burn"].includes(log.event));
  if (kind) test.is(log.event, kind);
}

function parse_event_json<T>(test: ExecutionContext, json: string): T {
  test.is(json.slice(0, 11), "EVENT_JSON:");
  return JSON.parse(json.slice(11));
}

// Good abstraction:
// - assert_rpc_call_event_log(assertParams, rpcSpec, function)
//   => runs the checking function against the event log
// - assert_rpc_call_event_log(assertParams, rpcSpec, object)
//   => checks if the parsed event log is the same as the object
// - assert_rpc_call_event_log(assertParams, rpcSpec, object[])
//   => checks if the parsed event log is the same as the parsed array
// - assert_rpc_call_event_log(assertParams, rpcSpec, string)
//   => checks if the event log is the same as the string
// - assert_rpc_call_event_log(assertParams, rpcSpec, string[])
//   => checks if the event logs are the same as the array
