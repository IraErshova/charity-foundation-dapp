"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon, HeartIcon, ArrowPathIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [donationAmount, setDonationAmount] = useState("");
  const [tokenDonationAmount, setTokenDonationAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Read contract data
  const { data: foundationInfo } = useScaffoldReadContract({
    contractName: "Foundation",
    functionName: "name",
  });

  const { data: owner } = useScaffoldReadContract({
    contractName: "Foundation",
    functionName: "owner",
  });

  const { data: isDonationEnabled } = useScaffoldReadContract({
    contractName: "Foundation",
    functionName: "isDonationEnabled",
  });

  const { data: ethDonation } = useScaffoldReadContract({
    contractName: "Foundation",
    functionName: "getDonationOf",
    args: [connectedAddress],
  });

  const { data: tokenDonation } = useScaffoldReadContract({
    contractName: "Foundation",
    functionName: "getTokenDonationOf",
    args: [connectedAddress],
  });

  const { data: hasNFT } = useScaffoldReadContract({
    contractName: "CharityNFT",
    functionName: "hasReceivedNFT",
    args: [connectedAddress],
  });

  // Write contract functions
  const { writeContractAsync: donate } = useScaffoldWriteContract("Foundation");
  const { writeContractAsync: donateTokens } = useScaffoldWriteContract("Foundation");
  const { writeContractAsync: claimRefund } = useScaffoldWriteContract("Foundation");
  const { writeContractAsync: claimTokenRefund } = useScaffoldWriteContract("Foundation");
  const { writeContractAsync: changeDonationState } = useScaffoldWriteContract("Foundation");

  const isOwner = connectedAddress?.toLowerCase() === owner?.toLowerCase();

  const handleDonate = async () => {
    if (!donationAmount) return;
    setIsProcessing(true);
    try {
      await donate({
        functionName: "donate",
        value: parseEther(donationAmount),
      });
      setDonationAmount("");
    } catch (error) {
      console.error("Donation failed:", error);
    }
    setIsProcessing(false);
  };

  const handleTokenDonate = async () => {
    if (!tokenDonationAmount) return;
    setIsProcessing(true);
    try {
      await donateTokens({
        functionName: "donateTokens",
        args: [parseEther(tokenDonationAmount)],
      });
      setTokenDonationAmount("");
    } catch (error) {
      console.error("Token donation failed:", error);
    }
    setIsProcessing(false);
  };

  const handleClaimRefund = async () => {
    setIsProcessing(true);
    try {
      await claimRefund({
        functionName: "claimRefund",
      });
    } catch (error) {
      console.error("Refund claim failed:", error);
    }
    setIsProcessing(false);
  };

  const handleClaimTokenRefund = async () => {
    setIsProcessing(true);
    try {
      await claimTokenRefund({
        functionName: "claimTokenRefund",
      });
    } catch (error) {
      console.error("Token refund claim failed:", error);
    }
    setIsProcessing(false);
  };

  const handleToggleDonations = async () => {
    setIsProcessing(true);
    try {
      await changeDonationState({
        functionName: "changeDonationState",
        args: [!isDonationEnabled],
      });
    } catch (error) {
      console.error("Failed to change donation state:", error);
    }
    setIsProcessing(false);
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">{foundationInfo || "Charity Foundation"}</span>
          </h1>

          {isOwner && (
            <div className="mt-8 bg-base-200 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Cog6ToothIcon className="h-6 w-6" />
                Owner Controls
              </h2>
              <div className="flex items-center gap-4">
                <p className="font-medium">Donations are currently:</p>
                <span className={`badge ${isDonationEnabled ? "badge-success" : "badge-error"}`}>
                  {isDonationEnabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleToggleDonations}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : isDonationEnabled ? "Disable Donations" : "Enable Donations"}
                </button>
              </div>
            </div>
          )}

          {connectedAddress && (
            <div className="mt-8 bg-base-200 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Your Donations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-base-100 p-4 rounded-lg">
                  <p className="font-medium">ETH Donations:</p>
                  <p className="text-xl">{ethDonation ? `${Number(ethDonation) / 1e18} ETH` : "0 ETH"}</p>
                </div>
                <div className="bg-base-100 p-4 rounded-lg">
                  <p className="font-medium">Token Donations:</p>
                  <p className="text-xl">{tokenDonation ? `${Number(tokenDonation) / 1e18} CHRT` : "0 CHRT"}</p>
                </div>
              </div>
              {hasNFT && (
                <div className="mt-4 bg-base-100 p-4 rounded-lg">
                  <p className="font-medium">Your Charity NFT Status:</p>
                  <p className="text-xl text-success">✓ NFT Received</p>
                </div>
              )}
            </div>
          )}

          {isDonationEnabled && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-200 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Donate ETH</h2>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount in ETH"
                    className="input input-bordered w-full"
                    value={donationAmount}
                    onChange={e => setDonationAmount(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleDonate}
                    disabled={isProcessing || !donationAmount}
                  >
                    {isProcessing ? "Processing..." : "Donate"}
                  </button>
                </div>
              </div>

              <div className="bg-base-200 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Donate Tokens</h2>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount in CHRT"
                    className="input input-bordered w-full"
                    value={tokenDonationAmount}
                    onChange={e => setTokenDonationAmount(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleTokenDonate}
                    disabled={isProcessing || !tokenDonationAmount}
                  >
                    {isProcessing ? "Processing..." : "Donate"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isDonationEnabled && (
            <div className="mt-8 bg-base-200 p-6 rounded-lg">
              <p className="text-center text-lg text-error">
                Donations are currently disabled. Please check back later.
              </p>
            </div>
          )}

          {connectedAddress && (ethDonation || tokenDonation) && (
            <div className="mt-8 bg-base-200 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Request Refund</h2>
              <div className="flex gap-4">
                {ethDonation && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleClaimRefund}
                    disabled={isProcessing}
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Claim ETH Refund
                  </button>
                )}
                {tokenDonation && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleClaimTokenRefund}
                    disabled={isProcessing}
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Claim Token Refund
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/debug" className="btn btn-primary w-full">
                <BugAntIcon className="h-5 w-5 mr-2" />
                Debug Contracts
              </Link>
              <Link href="/blockexplorer" className="btn btn-primary w-full">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Block Explorer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
