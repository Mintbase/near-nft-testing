use near_contract_standards::non_fungible_token::{
    self as nft_standard, metadata::NonFungibleTokenMetadataProvider,
    NonFungibleToken, Token, TokenId,
};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LookupSet,
    env,
    // json_types::AccountId,
    near_bindgen,
    AccountId,
    PromiseOrValue,
};
use serde::{Serialize, Serializer};

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
            "".as_bytes(),
            env::predecessor_account_id().try_into().unwrap(),
            Option::<u8>::None,
            Option::<u8>::None,
            Option::<u8>::None,
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

    #[payable]
    pub fn nft_mint(&mut self) {
        assert_eq!(self.tokens.owner_id, env::predecessor_account_id());

        self.tokens.internal_mint(
            self.next_id.to_string(),
            self.tokens.owner_id.clone(),
            None,
        );

        self.next_id += 1;
    }

    #[payable]
    pub fn nft_burn(&mut self, token_id: TokenId) {
        let token = self.tokens.nft_token(token_id).unwrap();
        assert_eq!(token.owner_id, env::predecessor_account_id());

        env::log_str(&format!("EVENT_JSON:{{\"standard\":\"nep171\",\"version\":\"1.0.0\",\"event\":\"nft_burn\",\"data\":[{{\"owner_id\":\"{}\",\"token_ids\":[\"{}\"]}}]}}",
            token.owner_id, token.token_id
        ));

        // FIXME: token needs to be marked as burned somewhere
    }
}

#[near_bindgen]
impl NonFungibleTokenMetadataProvider for NftContract {
    fn nft_metadata(&self) -> nft_standard::metadata::NFTContractMetadata {
        self.metadata.clone()
    }
}

near_contract_standards::impl_non_fungible_token_core!(NftContract, tokens);

// near_contract_standards::impl_non_fungible_token_approval!(NftContract, tokens);
// near_contract_standards::impl_non_fungible_token_enumeration!(
//     NftContract,
//     tokens
// );
