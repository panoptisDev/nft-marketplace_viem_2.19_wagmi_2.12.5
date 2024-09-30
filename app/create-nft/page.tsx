"use client";
import { useState, useMemo, useContext, ChangeEvent } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

import images from "../../assets";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { ContractContext } from "@/context";
import { parseEther } from "viem";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface FormInput {
  price: string;
  name: string;
  description: string;
}

const CreateNFT = () => {
  const { theme } = useTheme();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imgName, setImgName] = useState<string>("");
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const router=useRouter()
  const { contract, currentAddress } = useContext(ContractContext);
  const [formInput, setFormInput] = useState<FormInput>({
    price: "",
    name: "",
    description: "",
  });

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const { type, name } = file;
      const fileTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
      if (fileTypes.includes(type)) {
        setImageUrl(URL.createObjectURL(file));
        setImageType(type);
        setImage(file);
        setImgName(name);
      } else {
        alert("Please select an image file (png, gif, jpeg, or jpg)");
      }
    }
  };

  const handleUpload = async () => {
    if (!image) {
      alert("Please upload an image");
      return;
    }
    if (!currentAddress) {
      alert("Please connect your wallet");
      return;
    }
    if (!formInput.name || !formInput.description || !formInput.price) {
      alert("Please fill in all fields");
      return;
    }
    setIsLoadingNFT(true);

    const data = new FormData();
    data.append("file", image);
    data.append("name", formInput.name);
    data.append("description", formInput.description);

    const uploadRequest = await fetch("/api/file", {
      method: "POST",
      body: data,
    });

    const uploadData = await uploadRequest.json();
    const formatPrice = parseEther(formInput.price);
    const tx = await contract({
      functionName: "createToken",
      methodType: "write",
      args: [uploadData, formatPrice],
      values: parseEther("0.0025")
    });
    console.log(tx);
    setIsLoadingNFT(false);
    toast.success("NFT created check the explore page.")
    setFormInput({
      price: "",
      name: "",
      description: "",
    })
    setImage(null)
    router.push('/');
  };

  const fileStyle = useMemo(
    () =>
      "dark:bg-nft-black-1 bg-white border dark:border-white border-nft-gray-2 flex flex-col items-center p-5 rounded-sm border-dashed",
    []
  );

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-3/5 md:w-full">
        <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4 flex-1">
          Create new NFT
        </h1>
        <div className="mt-16">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
            Upload File
          </p>
          <div className="mt-4">
            <label className="cursor-pointer">
              <div className={fileStyle}>
                {image ? (
                  <aside>
                    <div>
                      <img src={imageUrl || ""} alt="asset_file" />
                    </div>
                  </aside>
                ) : (
                  <div className="flexCenter flex-col text-center">
                    <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
                      JPG, PNG, GIF, SVG, WEBM Max 100mb.
                    </p>
                    <div className="my-12 w-full flex justify-center">
                      <Image
                        src={images.upload}
                        alt="upload"
                        width={100}
                        height={100}
                        style={{
                          objectFit: "contain",
                        }}
                        className={theme === "light" ? "filter invert" : ""}
                      />
                    </div>
                    <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm">
                      Drag and Drop File
                    </p>
                    <p className="font-poppins dark:text-white text-nft-black-1 mt-2 font-semibold text-sm">
                      or Browse media on your device
                    </p>
                  </div>
                )}
              </div>
              <input type="file" className="hidden" onChange={onImageChange} />
            </label>
          </div>
        </div>
        <div className="mt-16">
          <Input
            inputType="input"
            title="Name"
            placeholder="NFT Name"
            handleClick={(e: any) =>
              setFormInput({
                ...formInput,
                name: (e.target as HTMLInputElement).value,
              })
            }
          />
          <Input
            inputType="textarea"
            title="Description"
            placeholder="NFT Description"
            handleClick={(e: any) =>
              setFormInput({
                ...formInput,
                description: (e.target as HTMLTextAreaElement).value,
              })
            }
          />
          <Input
            inputType="number"
            title="Price"
            placeholder="NFT Price"
            handleClick={(e: any) =>
              setFormInput({
                ...formInput,
                price: (e.target as HTMLInputElement).value,
              })
            }
          />
          <div className="mt-7 w-full flex justify-end">
            {isLoadingNFT ? (
              <Button
                btnName="Loading..."
                classStyles="rounded-xl"
                handleClick={handleUpload}
              />
            ) : (
              <Button
                btnName="Create NFT"
                classStyles="rounded-xl"
                handleClick={handleUpload}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNFT;
