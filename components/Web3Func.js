// import config from "../config";
import { toast } from "react-toastify";

const switchNetwork = async (chainId, chainName) => {
  let tx = await window.ethereum
    .request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainId }], // chainId must be in hexadecimal numbers
    })
    .catch((e) => {
      toast.error(`${e.message} `);
      toast.warning(`Connect to ${chainName}.`);
      return;
    });

  if (tx) {
  }
};

const getAccounts = async () => {
  if (window.ethereum) {
    let account;
    await window.ethereum
      .request({
        method: "eth_requestAccounts",
      })
      .then(async (accounts) => {
        if (await window.ethereum._metamask.isUnlocked()) {
          account = accounts[0];
        } else {
          account = null;
          return account;
        }
      })
      .catch((e) => {
        toast.error(e.message);
        account = null;
        return account;
      });
    console.log(account);
    if (account) {
      return account;
    } else {
      account = null;
      return account;
    }
  } else {
    toast.error("Please Install Metamask");
    return null;
  }
};

export { getAccounts, switchNetwork };
