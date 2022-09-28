import React, { useState, useEffect } from "react";

import config from "../config";

import { ethers } from "ethers";
import Web3 from "web3";

import { toast } from "react-toastify";

function Form({ info, account, accountBalance }) {
  const web3 = new Web3();
  const ChainId = config.polygon.ChainConfig.chainId;
  const ChainName = config.polygon.ChainConfig.chainName;
  const JSON_RPC = config.polygon.ChainConfig.rpcUrls[0];
  const address = config.polygon.StakingContract.address;
  const abi = config.polygon.StakingContract.abi;

  const tokenAddress = config.polygon.TokenContract.address;
  const tokenAbi = config.polygon.TokenContract.abi;

  const [amount, setAmount] = useState("100");
  const [timeString, setsetTimeString] = useState("week");
  const [approveAmount, setApproveAmount] = useState("100");

  useEffect(() => {
    (async () => {
      let provider = new ethers.providers.JsonRpcProvider(JSON_RPC);
      let contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      if (account) {
        setApproveAmount(
          (await contract.allowance(account, address)).toString()
        );
      }
    })();
  }, [account]);

  return (
    <form className="w-full sm:mx-5 flex flex-col sm:flex-row text-center items-center">
      <div className="md:flex md:items-center w-1/2 mb-6 sm:w-2/5">
        <div className="md:w-1/3">
          <label
            className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
            htmlFor="inline-full-name"
          >
            Amount (in BUSD){" "}
          </label>
        </div>
        <div className="md:w-2/3">
          <input
            onChange={(e) => {
              setAmount(e.target.value);
            }}
            className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 
            text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="inline-full-name"
            type="number"
            defaultValue="100"
          />
        </div>
      </div>

      <div className="md:flex md:items-center w-1/2 mb-6 sm:w-2/5  ">
        <div className="md:w-1/3">
          <label
            className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
            htmlFor="inline-full-name"
          >
            Staking Time{" "}
          </label>
        </div>
        <div className="inline-block relative w-64">
          <select
            onChange={(e) => {
              setsetTimeString(e.target.value);
            }}
            className="block appearance-none w-full bg-white border border-gray-400 
      hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight 
      focus:outline-none focus:shadow-outline"
          >
            <option value="week">Week</option>
            <option value="oneMonth">One Month</option>
            <option value="twoMonth">Two Months</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>{" "}
      </div>
      <div className="md:flex md:items-center md:mb-6 sm:w-1/5">
        <div className="md:w-2/3">
          {approveAmount >= amount ? (
            <button
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

                await info.contract
                  .staking(amount, timeString)
                  .then(async (txn) => {
                    let tx = await txn.wait();
                    console.log(tx);
                    toast.success("Staking Successful");
                    setTimeout(() => {
                      window.location.reload();
                    }, 3000);
                  })
                  .catch((e) => toast.error(e.message));
              }}
              className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
              type="button"
            >
              Submit
            </button>
          ) : (
            <button
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
                if (accountBalance < amount) {
                  toast.error("Low BUSD Balance!");
                  return;
                }

                await info.tokenContract
                  .approve(address, "472834703274230749327532")
                  .then(async (txn) => {
                    let tx = await txn.wait();
                    toast.success("Approving BUSD Successful");
                    setTimeout(() => {
                      window.location.reload();
                    }, 3000);
                  })
                  .catch((e) => toast.error(e.message));
              }}
              className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
              type="button"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default Form;
