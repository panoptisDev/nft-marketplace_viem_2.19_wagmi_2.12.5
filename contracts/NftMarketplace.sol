/**
 * @title NFTMarketplace
 * @dev A Solidity smart contract that implements an NFT (Non-Fungible Token) marketplace.
 * Users can mint NFTs, list them for sale, purchase NFTs, and manage their NFT listings.
 */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4; // Set the Solidity version to match the Hardhat configuration

// Import necessary OpenZeppelin contracts and Hardhat console for debugging
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev Main contract for the NFT marketplace.
 * This contract inherits from ERC721URIStorage, an implementation of the ERC721 standard
 */
contract NFTMarketplace is ERC721URIStorage,ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // Counter for tracking NFT token IDs
    Counters.Counter private _itemsSold; // Counter for tracking the number of items sold

    // Fee to list an NFT on the marketplace
    uint256 listingPrice = 0.0025 ether;

    // Address of the contract owner, who earns a commission on every item sold
    address payable owner;

    // Mapping to keep track of all market items created
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Struct representing a market item
    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    /**
     * @dev Event emitted when a market item is created.
     * @param tokenId The ID of the newly created NFT.
     * @param seller The address of the NFT seller.
     * @param owner The address of the NFT owner (initially the contract address).
     * @param price The price at which the NFT is listed.
     * @param sold A boolean indicating whether the NFT has been sold.
     */
    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    /**
     * @dev Constructor to set the owner as the contract deployer.
     * Initializes the contract with a name and symbol for the NFT.
     */
    constructor() ERC721("Crypto Ket", "CKN") {
        owner = payable(msg.sender);
    }
   
    /// @dev Modifier to ensure that only the owner can call specific functions.
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can perform this action"
        );
        _;
    }


    /**
     * @dev Updates the listing price of the contract.
     * @param _listingPrice The new listing price in wei.
     */
    function updateListingPrice(uint _listingPrice) public payable {
        require(owner == msg.sender, "Only the marketplace owner can update the listing price.");
        listingPrice = _listingPrice;
    }

    /**
     * @dev Returns the current listing price of the contract.
     * @return The current listing price in wei.
     */
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    /**
     * @dev Mints a token and lists it in the marketplace.
     * @param tokenURI The URI for the token's metadata.
     * @param price The initial price for the token in wei.
     * @return The ID of the newly minted token.
     */
    function createToken(string memory tokenURI, uint256 price) public payable nonReentrant returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        createMarketItem(newTokenId, price);
        return newTokenId;
    }

    /**
     * @dev Creates a new market item for an NFT.
     * @param tokenId The ID of the NFT to be listed.
     * @param price The price at which the NFT is listed.
     */
    function createMarketItem(uint256 tokenId, uint256 price) private {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to the listing price");

        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        _transfer(msg.sender, address(this), tokenId);
        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false
        );
    }

    /**
     * @dev Allows the owner of an NFT to resell it at a new price.
     * @param tokenId The ID of the NFT to be resold.
     * @param price The new price at which the NFT is listed.
     */
    function resellToken(uint256 tokenId, uint256 price) public payable nonReentrant {
        require(idToMarketItem[tokenId].owner == msg.sender, "Only the item owner can perform this operation");
        require(msg.value == listingPrice, "Price must be equal to the listing price");
        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));
        _itemsSold.decrement();
        _transfer(msg.sender, address(this), tokenId);
    }

    /**
     * @dev Completes the sale of a marketplace item, transferring ownership and funds.
     * @param tokenId The ID of the NFT being purchased.
     */
    function createMarketSale(uint256 tokenId) public payable nonReentrant {
        uint price = idToMarketItem[tokenId].price;
        require(msg.value == price, "Please submit the asking price to complete the purchase");
        address seller = idToMarketItem[tokenId].seller;
        idToMarketItem[tokenId].owner = payable(msg.sender);
        idToMarketItem[tokenId].sold = true;
        idToMarketItem[tokenId].seller = payable(address(0));
        _itemsSold.increment();
        _transfer(address(this), msg.sender, tokenId);
        payable(owner).transfer(listingPrice);
        payable(seller).transfer(msg.value);
    }

    /**
     * @dev Returns an array of all unsold market items.
     * @return An array of unsold market items, represented as MarketItem structs.
     */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _tokenIds.current();
        uint unsoldItemCount = _tokenIds.current() - _itemsSold.current();
        uint currentIndex = 0;
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(this)) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    /**
     * @dev Returns an array of NFTs owned by the caller.
     * @return An array of NFTs owned by the caller, represented as MarketItem structs.
     */
    function fetchUserNFTs(address _address) public view returns (MarketItem[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == _address) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == _address) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    /**
     * @dev Returns an array of NFTs listed by the caller.
     * @return An array of NFTs listed by the caller, represented as MarketItem structs.
     */
    function fetchItemsListed(address _address) public view returns (MarketItem[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == _address) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == _address) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    /// @dev Allows the contract owner to withdraw tokens from the contract.
    /// @param tokenAddress The address of the token to be withdrawn.
    /// @param amount The amount of tokens to be withdrawn.
    function ownerWithdraw(
        address tokenAddress,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (isERC20(tokenAddress)) {
            require(
                amount <= IERC20(tokenAddress).balanceOf(address(this)),
                "Not enough balance in the contract"
            );
            require(IERC20(tokenAddress).transfer(owner, amount), "Transfer failed");
        } else if (isERC721(tokenAddress)) {
            revert(
                "ERC721 tokens cannot be withdrawn by the contract owner to prevent potential manipulation of users' NFTs"
            );
        } else {
            revert("Unsupported token type");
        }
    }

    /// @dev Checks if a given address represents an ERC20 token contract.
    /// @param tokenAddress The address to be checked.
    /// @return true if the address represents an ERC20 token contract, false otherwise.
    function isERC20(address tokenAddress) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(tokenAddress)
        }
        return size > 0 && IERC20(tokenAddress).totalSupply() > 0;
    }

    /// @dev Checks if a given address represents an ERC721 token contract.
    /// @param tokenAddress The address to be checked.
    /// @return true if the address represents an ERC721 token contract, false otherwise.
    function isERC721(address tokenAddress) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(tokenAddress)
        }
        return size > 0 && IERC721(tokenAddress).supportsInterface(0x80ac58cd);
    }
}
