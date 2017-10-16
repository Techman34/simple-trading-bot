import BigNumber from "bignumber.js";
import { setup, getFundContract } from "@melonproject/melon.js";

const estimateFullCost = async (
  marketPrice,
  order,
  fundAddress,
  managerAddress = setup.defaultAccount
) => {
  const fundContract = await getFundContract(fundAddress);
  const gasEstimation = await fundContract.takeOrder.estimateGas(
    order.id,
    new BigNumber(0.5),
    {
      from: managerAddress
    }
  );
  const { gasPrice } = setup.web3.eth;
  const totalGasPrice = gasPrice.mul(gasEstimation);
  const gasPriceInETH = setup.web3.fromWei(totalGasPrice, "ether");
  const gasPriceInMLN = gasPriceInETH.mul(marketPrice);
  const fullCostInMLN =
    order.type === "sell"
      ? order.price.plus(gasPriceInMLN)
      : order.price.minus(gasPriceInMLN);
  return fullCostInMLN;
};

export default estimateFullCost;
