"use client";
import { Suspense, useEffect, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ContractContext } from "@/context";
import toast from "react-hot-toast";
import { Button, Input, Loader } from "@/components";
import { parseEther } from "viem";

const ResellNFT = () => {
  const { contract, getTokenUri, ownerOf, currentAddress } =
    useContext(ContractContext);
  const [price, setPrice] = useState(null);
  const [image, setImage] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const fetchNFT = async () => {
    if (!id) return;
    const owner = await ownerOf(id);
    if (owner !== currentAddress) {
      toast.error("You are not the owner of this NFT.");
      router.push("/my-nfts");
      return;
    }
    setIsOwner(true);
    const { image } = await getTokenUri(id);
    setImage(image);
  };

  useEffect(() => {
    if (!currentAddress) return;
    fetchNFT();
  }, [id, currentAddress]);

  const resell = async () => {
    try {
      if (!price || isNaN(price) || price <= 0) {
        return toast.error("Invalid price");
      }
      setIsLoadingNFT(true);
      await contract({
        functionName: "resellToken",
        methodType: "write",
        args: [id, parseEther(price)],
        values: parseEther("0.0025"),
      });
      toast.success("NFT resold successfully.");
      router.push("/my-nfts");
    } catch (e) {
      toast.error("Failed to resell NFT.");
    } finally {
      setIsLoadingNFT(false);
    }
  };

  if (isLoadingNFT) {
    return (
      <div className="flexCenter" style={{ height: "51vh" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center sm:px-4 p-12">
      {isOwner ? (
        <div className="w-3/5 md:w-full">
          <h1 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl">
            Resell NFT
          </h1>
          <Input
            inputType="number"
            title="Price"
            placeholder="Asset Price"
            handleClick={(e) => setPrice(e.target.value)}
          />

          {image && <img className="rounded mt-4" width="350" src={image} />}

          <div className="mt-7 w-full flex justify-end">
            <Button
              btnName="List NFT"
              btnType="primary"
              classStyles="rounded-xl"
              handleClick={resell}
            />
          </div>
        </div>
      ) : (
        <div className="w-3/5 md:w-full">
          <h1 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl">
            You are not the owner of this NFT
          </h1>
        </div>
      )}
    </div>
  );
};

export default function ResellNFTWrapper() {
  return (
    <Suspense fallback={<Loader />}>
      <ResellNFT />
    </Suspense>
  );
}
