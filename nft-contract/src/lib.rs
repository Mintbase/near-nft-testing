// use std::str::FromStr;

use near_contract_standards::non_fungible_token::{
    self as nft_standard, metadata::NonFungibleTokenMetadataProvider,
    NonFungibleToken, Token, TokenId,
};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LookupSet,
    env,
    json_types::{U128, U64},
    near_bindgen, AccountId, Balance, Promise, PromiseOrValue,
};
use serde::{Serialize, Serializer};
use std::collections::HashMap;

macro_rules! some_fmt {
    ($fmt:expr, $($arg:expr),*) => {
        Some(format!($fmt, $($arg),*))
    };
}

macro_rules! log_fmt {
    ($fmt:expr, $($arg:expr),*) => {
        env::log_str(&format!($fmt, $($arg),*))
    };
}

// macro_rules! account {
//     ($str:expr) => {
//         AccountId::from_str($str).unwrap()
//     };
// }

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize)]
pub struct NftContract {
    tokens: NonFungibleToken,
    metadata: nft_standard::metadata::NFTContractMetadata,
    next_id: u32,
    burned: LookupSet<TokenId>,
}

impl Serialize for NftContract {
    fn serialize<S: Serializer>(
        &self,
        serializer: S,
    ) -> Result<S::Ok, S::Error> {
        serializer.serialize_unit()
    }
}

impl Default for NftContract {
    fn default() -> Self {
        let tokens = NonFungibleToken::new(
            "owner_by_id".as_bytes(),
            env::predecessor_account_id().try_into().unwrap(),
            Some("token_metadata".as_bytes()),
            Some("enumeration".as_bytes()),
            Some("approval".as_bytes()),
        );
        let metadata = nft_standard::metadata::NFTContractMetadata {
            spec: "nft-1.0.0".to_string(),
            name: "NFT contract".to_string(),
            symbol: "NFT".to_string(),
            icon: None,
            base_uri: None,
            reference: None,
            reference_hash: None,
        };

        let next_id = 0;
        let burned = LookupSet::new("".as_bytes());

        Self {
            tokens,
            metadata,
            next_id,
            burned,
        }
    }
}

#[near_bindgen]
impl NftContract {
    // ------------------------- initializing contract -------------------------

    // FIXME: (maybe) get init to work
    // #[near_sdk::init]
    // pub fn init() -> Self {
    //     let tokens = {
    //         let owner_by_id_prefix = "nep171".as_bytes();
    //         let owner_id: AccountId =
    //             env::predecessor_account_id().try_into().unwrap();
    //         let token_metadata_prefix: Option<u8> = None;
    //         let enumeration_prefix: Option<u8> = None;
    //         let approval_prefix: Option<u8> = None;
    //         NonFungibleToken::new(
    //             owner_by_id_prefix,
    //             owner_id,
    //             token_metadata_prefix,
    //             enumeration_prefix,
    //             approval_prefix,
    //         )
    //     };
    //     let next_id = 0;

    //     Self { tokens, next_id }
    // }

    // ----------------------------- mint and burn -----------------------------
    #[payable]
    pub fn nft_mint(&mut self) {
        assert_eq!(self.tokens.owner_id, env::predecessor_account_id());

        self.tokens.internal_mint(
            self.next_id.to_string(),
            self.tokens.owner_id.clone(),
            Some(nft_standard::metadata::TokenMetadata {
                title: some_fmt!("NFT {}", self.next_id.to_string()),
                description: some_fmt!(
                    "This is NFT {}",
                    self.next_id.to_string()
                ),
                media: None,
                media_hash: None,
                copies: Some(1),
                issued_at: None,
                expires_at: None,
                starts_at: None,
                updated_at: None,
                extra: None,
                reference: None,
                reference_hash: None,
            }),
        );

        self.next_id += 1;
    }

    #[payable]
    pub fn nft_burn(&mut self, token_id: TokenId) {
        let token = self.tokens.nft_token(token_id).unwrap();
        assert_eq!(token.owner_id, env::predecessor_account_id());

        log_fmt!(
            "EVENT_JSON:{{\"standard\":\"nep171\",\"version\":\"1.0.0\",\"event\":\"nft_burn\",\"data\":[{{\"owner_id\":\"{}\",\"token_ids\":[\"{}\"]}}]}}",
            token.owner_id, token.token_id
        );

        // FIXME: token needs to be marked as burned somewhere
    }
}
// -------------------------------- payouts --------------------------------- //
// FIXME: multiple issues in the standard, wouldn't compile that way

// FIXME: HashMap in standard, not possible without std
// FIXME: single-field struct in standard, but I need this for the serde mapping
pub struct PayoutMap(pub HashMap<AccountId, Balance>);

impl Serialize for PayoutMap {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.collect_map(self.0.iter().map(|(k, v)| (k, v.to_string())))
    }
}

#[derive(Serialize)]
pub struct Payout {
    // FIXME: unwrapped HashMap standard, but I need custom serialize
    // => there are probably serde macros for the mapping
    payout: PayoutMap,
}

pub trait Payouts: NonFungibleTokenCore {
    /// Given a `token_id` and NEAR-denominated balance, return the `Payout`.
    /// struct for the given token. Panic if the length of the payout exceeds
    /// `max_len_payout.`
    fn nft_payout(
        &self,
        token_id: String,
        balance: near_sdk::json_types::U128,
        max_len_payout: u32,
    ) -> Payout;

    // FIXME: how can I get a #[payable] blanket impl?
    /// Given a `token_id` and NEAR-denominated balance, transfer the token
    /// and return the `Payout` struct for the given token. Panic if the
    /// length of the payout exceeds `max_len_payout.`
    fn nft_transfer_payout(
        &mut self,
        receiver_id: AccountId,
        token_id: String,
        // FIXME: is u64 in standard
        approval_id: Option<near_sdk::json_types::U64>,
        balance: near_sdk::json_types::U128,
        max_len_payout: u32,
    ) -> Payout;
}

#[near_bindgen]
impl Payouts for NftContract {
    fn nft_payout(
        &self,
        #[allow(unused_variables)] token_id: String,
        balance: near_sdk::json_types::U128,
        max_len_payout: u32,
    ) -> Payout {
        let balance: Balance = balance.into();
        let owner_payout = balance * 90 / 100;
        let mut payout = HashMap::<AccountId, Balance>::new();
        payout.insert(self.tokens.owner_id.clone(), owner_payout);

        if max_len_payout > 1 {
            payout.insert("burn.near".parse().unwrap(), balance - owner_payout);
        }

        Payout {
            payout: PayoutMap(payout),
        }
    }

    #[payable]
    fn nft_transfer_payout(
        &mut self,
        receiver_id: AccountId,
        token_id: String,
        #[allow(unused_variables)] approval_id: Option<U64>,
        balance: U128,
        max_len_payout: u32,
    ) -> Payout {
        near_sdk::assert_one_yocto();
        // FIXME: missing clone in standard
        let payout = self.nft_payout(token_id.clone(), balance, max_len_payout);
        // FIXME: missing memo in standard
        self.nft_transfer(receiver_id, token_id, None, None);
        payout
    }
}

// -------------------------------- metadata -------------------------------- //
#[near_bindgen]
impl NonFungibleTokenMetadataProvider for NftContract {
    fn nft_metadata(&self) -> nft_standard::metadata::NFTContractMetadata {
        self.metadata.clone()
    }
}

near_contract_standards::impl_non_fungible_token_core!(NftContract, tokens);
near_contract_standards::impl_non_fungible_token_approval!(NftContract, tokens);
near_contract_standards::impl_non_fungible_token_enumeration!(
    NftContract,
    tokens
);
