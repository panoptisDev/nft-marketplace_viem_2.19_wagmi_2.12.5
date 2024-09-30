"use client"
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";


import images from "../../assets";

import Loader from "@/components/Loader";
import Banner from "@/components/Banner";
import SearchBar from "@/components/SearchBar";
import NFTCard from "@/components/NFTCard";
import { shortenAddress } from "@/utils/shortenAddress";
import { ContractContext } from "@/context";


const MyNFTs = () => {
  const { fetchMyOrListedItems, currentAddress } = useContext(ContractContext);
  const [nfts, setNfts] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSelect, setActiveSelect] = useState("Recently Added");

  useEffect(() => {
    if(!currentAddress) return;
    fetchMyOrListedItems('my').then((data) => {
      console.log(data)
      setNfts(data);
      setIsLoading(false);
    });
  }, [currentAddress]);

  

  useEffect(() => {
    const sortedNfts = [...nfts];

    switch (activeSelect) {
      case "Price (low to high)":
        setNfts(sortedNfts.sort((a, b) => a.price - b.price));
        break;
      case "Price (high to low)":
        setNfts(sortedNfts.sort((a, b) => b.price - a.price));
        break;
      case "Recently added":
        setNfts(sortedNfts.sort((a, b) => b.tokenId - a.tokenId));
        break;
      default:
        setNfts(nfts);
        break;
    }
  }, [activeSelect]);

  const onHandleSearch = (value) => {
    const filteredNfts = nfts?.filter(({ name }) =>
      name.toLowerCase().includes(value.toLowerCase())
    );

    if (filteredNfts?.length === 0) {
      setNfts(nftsCopy);
    } else {
      setNfts(filteredNfts);
    }
  };

  const onClearSearch = () => {
    if (nfts?.length && nftsCopy?.length) {
      setNfts(nftsCopy);
    }
  };

  if (isLoading) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }
  return (
    <div className="w-full flex justify-start items-center flex-col min-h-screen">
      <div className="w-full flexCenter flex-col">
        <Banner
          name="Your Nifty NFTs"
          childStyles="text-center mb-4"
          parentStyle="h-80 justify-center"
        />
        <div className="flexCenter flex-col -mt-20 z-0">
          <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 bg-nft-black-2 rounded-full">
            <Image
              alt="creator"
              src={images.creator1}
              className="rounded-full object-cover"
              style={{ objectFit: "cover" }}
            />
          </div>
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">
            {currentAddress && shortenAddress(currentAddress)}
          </p>
        </div>
      </div>
      {!isLoading && nfts?.length === 0 ? (
        <div className="flexCenter sm:p-4 p-16">
          <h1 className="font-poppins dark:text-white text-nft-black-1 text-3xl font-extrabold">
            No NFTs owned
          </h1>
        </div>
      ) : (
        <div className="sm:px-4 p-12 w-full minmd:w-4/5 flexCenter flex-col">
          <div className="flex-1 w-full flex flex-row sm:flex-col px-4 xs:px-0 minlg:px-8">
            <SearchBar
              activeSelect={activeSelect}
              setActiveSelect={setActiveSelect}
              handleSearch={onHandleSearch}
              clearSearch={onClearSearch}
            />
          </div>
          <div className="mt-3 w-full flex flex-wrap">
            {nfts?.map((nft) => (
                //@ts-ignore
              <NFTCard key={`nft-${nft.tokenId}`} nft={nft} onProfilePage />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
