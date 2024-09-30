//@ts-nocheck
"use client";
import React, { ReactNode, useEffect, useState } from "react";
import {
  RainbowKitProvider,
  getDefaultWallets,
  midnightTheme,
  useAddRecentTransaction,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  State,
  WagmiProvider,
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { blastSepolia } from "wagmi/chains";
import { ABI, CONTRACT_ADDRESS } from "../constants";
import { formatEther, recoverMessageAddress } from "viem";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import axios from "axios";
import { Footer } from "@/components";
import { ThemeProvider } from "next-themes";

// Retrieve default wallets from RainbowKit
const { wallets } = getDefaultWallets();

// Configure RainbowKit with application settings
export const config = getDefaultConfig({
  appName: "App", // Application name shown in UI
  wallets: [
    ...wallets,
    {
      groupName: "Others",
      wallets: [argentWallet, trustWallet, ledgerWallet], // Additional wallet configurations
    },
  ],
  chains: [blastSepolia], // Blockchain chain configurations
  ssr: true, // Server-side rendering flag
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID, // Project ID from environment variables
});

// Initialize React Query client
const queryClient = new QueryClient();

// Disclaimer component for displaying terms and conditions
const Disclaimer = ({ Text, Link }: any) => (
  <Text>
    By connecting your wallet, you agree to the{" "}
    <Link href="#">Terms of Service</Link> and acknowledge you have read and
    understand the protocol <Link href="#">Disclaimer</Link>
  </Text>
);

// ContextProvider component to wrap the entire application with necessary providers
export function ContextProvider({
  children,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config}>
      <Toaster position="top-center" /> {/* Toast notification position */}
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact" // Size of modals
          locale="en-US" // Locale setting
          theme={midnightTheme({
            // Theme customization
            accentColor: "white",
            accentColorForeground: "black",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          showRecentTransactions={true} // Show recent transactions in UI
          appInfo={{
            // Application information
            appName: "CryptoKet",
            learnMoreUrl: "https://nft-marketplace.mehmetalicakmak.org",
            disclaimer: Disclaimer, // Disclaimer component
          }}
        >
          <ContractProvider>
            <ThemeProvider attribute="class">
              <div className="dark:bg-nft-dark bg-white min-h-screen">
                <Navbar />
                <div className="pt-65">{children}</div>
                <Footer />
              </div>
            </ThemeProvider>
          </ContractProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const ContractContext = React.createContext(
  {} as {
    contract: (params: ContractFunctionParams) => Promise<any>; // Function to interact with contract
    currentAddress: `0x${string}`; // Current
    fetchMyOrListedItems;
    fetchNFTs;
    getTokenUri;
    ownerOf;
  }
);

// Parameters for contract functions
interface ContractFunctionParams {
  functionName: string; // Name of the contract function
  methodType: string; // Type of method (read or write)
  args?: any; // Arguments for the function
  values?: bigint; // Values for the function
}

// ContractProvider component to interact with contract
export function ContractProvider({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient(); // Hook for public client
  const { data: walletClient } = useWalletClient(); // Hook for wallet client
  const { address: currentAddress } = useAccount(); // Hook for current account address
  const addRecentTransaction = useAddRecentTransaction(); // Hook for adding recent transaction
  const { openConnectModal } = useConnectModal();

  // Check if wallet is connected
  useEffect(() => {
    if (!currentAddress) {
      openConnectModal(); // Open connect modal if wallet is not connected
    }
  }, [currentAddress]);
  // Function to interact with contract functions
  const contractFunction = async ({
    functionName,
    methodType,
    args = [],
    values = BigInt(0),
  }: ContractFunctionParams) => {
    let contract;
    if (methodType === "read") {
      // Read method
      contract = await publicClient?.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: functionName,
        args: args,
      });
    } else {
      // Write method
      contract = await walletClient?.writeContract({
        abi: ABI,
        address: CONTRACT_ADDRESS,
        functionName: functionName,
        args: args,
        account: currentAddress,
        value: values,
      });

      // Add recent transaction
      addRecentTransaction({
        hash: contract?.toString(),
        description: `Write ${functionName} to contract`,
      });
    }
    return contract; // Return contract response
  };

  const convertMetadata = async (uri: string): Promise<string> => {
    try {
      const res = await axios.get(
        `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${uri}`
      );
      const name = res.data.name;
      const description = res.data.description;
      const image = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${res.data.image}`;

      return { name: name, description: description, image: image };
    } catch (error) {
      console.error("Error converting image URL:", error);
      throw error;
    }
  };

  const getTokenUri = async (id: number) => {
    const tokenUri = await contractFunction({
      functionName: "tokenURI",
      methodType: "read",
      args: [id],
    });
    return convertMetadata(tokenUri);
  };

  const fetchMyOrListedItems = async (type: string) => {
    try {
      let tx;
      if (type === "my") {
        tx = await contractFunction({
          functionName: "fetchUserNFTs",
          methodType: "read",
          args: [currentAddress],
        });
      } else if (type === "listed") {
        tx = await contractFunction({
          functionName: "fetchItemsListed",
          methodType: "read",
          args: [currentAddress],
        });
      }

      const allItems = await Promise.all(
        tx.map(async (item) => {
          const tokenUri = await getTokenUri(Number(item.tokenId));
          return {
            tokenId: Number(item.tokenId),
            name: tokenUri.name,
            description: tokenUri.description,
            price: formatEther(item.price),
            seller: item.seller,
            image: tokenUri.image,
            owner: item.owner,
            sold: item.sold,
          };
        })
      );
      return allItems;
    } catch (error) {
      console.error("Error fetching items listed:", error);
    }
  };

  const fetchNFTs = async () => {
    try {
      const tx = await contractFunction({
        functionName: "fetchMarketItems",
        methodType: "read",
      });
      const allItems = await Promise.all(
        tx.map(async (item) => {
          const tokenUri = await getTokenUri(Number(item.tokenId));
          return {
            tokenId: Number(item.tokenId),
            name: tokenUri.name,
            description: tokenUri.description,
            price: formatEther(item.price),
            seller: item.seller,
            image: tokenUri.image,
            owner: item.owner,
            sold: item.sold,
          };
        })
      );
      return allItems;
    } catch (error) {
      console.error("Error fetching items listed:", error);
    }
  };

  const ownerOf = async (id) => {
    try {
      const tx = await contractFunction({
        functionName: "ownerOf",
        methodType: "read",
        args: [id],
      });
      return tx;
    } catch (error) {
      console.error("Error fetching items listed:", error);
    }
  };
  return (
    <ContractContext.Provider
      value={{
        contract: contractFunction,
        currentAddress: currentAddress,
        fetchMyOrListedItems,
        fetchNFTs,
        getTokenUri,
        ownerOf,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}
