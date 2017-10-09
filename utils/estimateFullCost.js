import BigNumber from "bignumber.js";
import { setup, getFundContract } from "@melonproject/melon.js";

const estimateFullCost = async (
  marketPrice,
  order,
  fundAddress,
  managerAddress
) => {
  const fundContract = await getFundContract(fundAddress);
  const gasEstimation = await fundContract.takeOrder.estimateGas(
    order.id,
    new BigNumber(0.5),
    {
      from: managerAddress
    }
  );
  const gasPrice = setup.web3.eth.gasPrice;
  const totalGasPrice = gasPrice.mul(gasEstimation);
  const gasPriceInETH = setup.web3.fromWei(totalGasPrice, "ether");
  const gasPriceInMLN = gasPriceInETH * marketPrice;
  const fullCostInMLN =
    order.type === "sell"
      ? order.price.toNumber() + gasPriceInMLN
      : order.price.toNumber() - gasPriceInMLN;
  return fullCostInMLN;
};

export default estimateFullCost;
