import React from "react";
import Web3 from "web3";
import { toast } from "react-toastify";
import moment from "moment";

function Card({ info }) {
  const web3 = new Web3();

  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-center">
          <tr>
            <th scope="col" className="py-3 px-6">
              Token Id
            </th>
            <th scope="col" className="py-3 px-6">
              Start Time{" "}
            </th>
            <th scope="col" className="py-3 px-6">
              End Time
            </th>
            <th scope="col" className="py-3 px-6">
              Amount Staked
            </th>
            <th scope="col" className="py-3 px-6">
              Amount Released
            </th>
            <th scope="col" className="py-3 px-6">
              Amount Left
            </th>
            <th scope="col" className="py-3 px-6"></th>
          </tr>
        </thead>
        {info.stakes &&
          info.stakes.map((stake, i) => {
            return (
              <tbody key={stake.tokenId}>
                <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 text-center">
                  <th
                    scope="row"
                    className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {stake.tokenId.toString()}
                  </th>
                  <td className="py-4 px-6">
                    {" "}
                    {moment.unix(stake.startTime.toString()).format("llll")}
                  </td>
                  <td className="py-4 px-6">
                    {" "}
                    {moment.unix(stake.duration.toString()).format("llll")}
                  </td>
                  <td className="py-4 px-6">
                    {web3.utils.fromWei(stake.amountTotal.toString(), "ether")}{" "}
                    {/* {new Date(stake.duration.toString() * 1000)} */}
                  </td>
                  <td className="py-4 px-6">
                    {web3.utils.fromWei(stake.released.toString(), "ether")}
                  </td>
                  <td className="py-4 px-6">
                    {web3.utils.fromWei(stake.amountTotal.toString(), "ether") -
                      web3.utils.fromWei(stake.released.toString(), "ether")}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={async () => {
                        await info.contract
                          .release(i)
                          .then(async (txn) => {
                            let tx = await txn.wait();
                            console.log(e);

                            toast.success("Amount Released");

                            setTimeout(() => {
                              window.location.reload();
                            }, 3000);
                          })
                          .catch((e) => toast.error(e.message));
                      }}
                      className="font-medium text-white dark:text-white bg-blue-600 px-2 py-2 rounded-2xl"
                    >
                      Release Amount
                    </button>
                  </td>
                </tr>
              </tbody>
            );
          })}
      </table>
    </div>
  );
}

export default Card;
