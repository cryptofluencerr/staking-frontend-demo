import React, { useState, useEffect } from "react";
import config from "../config";

import Head from "next/head";
import Form from "../components/Form";
import Card from "../components/Card";

import { getAccounts, switchNetwork } from "../components/Web3Func";

import Web3Modal from "web3Modal";
import { ethers } from "ethers";
import Web3 from "web3";

import { toast } from "react-toastify";

export default function Home() {
  const web3 = new Web3();
  const ChainId = config.polygon.ChainConfig.chainId;
  const ChainName = config.polygon.ChainConfig.chainName;
  const address = config.polygon.StakingContract.address;
  const abi = config.polygon.StakingContract.abi;

  const tokenAddress = config.polygon.TokenContract.address;
  const tokenAbi = config.polygon.TokenContract.abi;

  const [account, setAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState(null);
  const [info, setInfo] = useState({
    contract: null,
    stakes: null,
    tokenContract: null,
  });

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum._metamask.isUnlocked().then(async (bool) => {
        // setAccount(await getAccounts());
        if (bool) {
          // window.ethereum.on("chainChanged", async () => {
          //   if (await getAccounts()) {
          //     setAccount(await getAccounts());
          //   } else {
          //     setAccount(null);
          //   }
          // });

          window.ethereum.on("accountsChanged", async () => {
            if (await window.ethereum._metamask.isUnlocked()) {
              setAccount(await getAccounts());
            }
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    minted();
  }, [account]);

  const minted = async () => {
    if (account) {
      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
      });
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(address, abi, signer);
      const TokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

      let stakes = await contract.showStakes();

      setAccountBalance((await TokenContract.balanceOf(account)).toString());
      setInfo({
        ...info,
        contract: contract,
        stakes: stakes,
        TokenContract: TokenContract,
      });
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-slate-200 to-slate-500">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="pt-10 text-center flex-col">
          <h1 className="font-bold text-2xl mb-2 ">Stake</h1>
          <div className="items-end text-end justify-end mr-20 mb-10">
            {!account ? (
              <div
                onClick={async () => {
                  if (!window.ethereum) {
                    toast.error("Please install metamask!");
                    return;
                  }
                  if (
                    (await window.ethereum.request({
                      method: "eth_chainId",
                    })) != ChainId
                  ) {
                    switchNetwork(ChainId, ChainName);
                    return;
                  }
                  setAccount(await getAccounts());
                  minted();
                }}
              >
                <button className="cursor-pointer bg-orange-400 px-2 py-2 rounded-2xl">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div>
                {account}
                <button
                  onClick={() => {
                    setInfo({ info: null, contract: null });
                    setAccount(null);
                  }}
                  className="cursor-pointer bg-orange-400 px-2 py-2 rounded-2xl ml-2"
                >
                  Disconnect
                </button>

                <div className="font-bold mr-20 pr-20">
                  Balance:{" "}
                  {accountBalance &&
                    web3.utils.fromWei(accountBalance.toString(), "ether")}{" "}
                  BUSD
                </div>
              </div>
            )}
          </div>
        </div>
        {account && (
          <div>
            <Form info={info} account={account} />
          </div>
        )}
        {account && (
          <div className="mx-10 mt-10">
            <Card info={info} />
          </div>
        )}
      </main>
    </div>
  );
}