"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "./Button";
export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
            className="font-semibold"
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    handleClick={openConnectModal}
                    btnName="Connect Wallet"
                    classStyles="mx-2 rounded-xl"
                  />
                );
              }
              if (chain.unsupported) {
                return (
                  <Button
                    handleClick={openChainModal}
                    btnName="Wrong Network"
                    classStyles="mx-2 rounded-xl"
                  />
                );
              }
              return (
                <div style={{ display: "flex"}}>
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="rounded-xl font-poppins  border-nft-red-violet border-2 dark:text-white text-nft-black-1 flex items-center  minlg:text-lg py-2 px-4 minlg:px-8"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        style={{ width: 18, height: 18 }}
                        className="mx-2"
                      />
                    )}
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
