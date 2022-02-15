This repo contains a barebones NFT contract for NEAR in `nft-contract`, as well
as some tests inside `testing`:

- [ ] NFT Core (NEP171):
  - [x] `nft_transfer`
  - [ ] `nft_transfer_call`
  - [x] `nft_token`
- [x] NFT Events (NEP297):
  - [x] `nft_mint`
  - [x] `nft_transfer`
  - [x] `nft_burn`
- [x] NFT Metadata (NEP177):
  - [x] `nft_metadata`
- [ ] NFT Approvals (NEP178):
  - [ ] `nft_approve`
  - [ ] `nft_revoke`
  - [ ] `nft_revoke_all`
  - [ ] `nft_is_approved`
  - [ ] `nft_on_approved`
- [ ] NFT Enumeration (NEP181):
  - [ ] `nft_total_supply`
  - [ ] `nft_tokens`
  - [ ] `nft_supply_for_owner`
  - [ ] `nft_tokens_for_owner`
- [ ] NFT Payouts (NEP199):
  - [ ] `nft_transfer_payout`
  - [ ] `nft_payout`

Compile the contract(s) via `cargo emit`, run the tests via
`( cd testing && npm test )`.
