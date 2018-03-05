import BigNumber from "bignumber.js";
import { getFundContract } from "@melonproject/melon.js";

const estimateFullCost = async (
  environment,
  marketPrice,
  order,
  fundAddress,
) => {
  const fundContract = await getFundContract(fundAddress);
  const gasPrice = await environment.api.eth.gasPrice;
  const gasEstimation = await fundContract.takeOrder.estimateGas(
    { from: environment.account.address, gasPrice },
    [order.id, new BigNumber(0.5)],
  );
  const totalGasPrice = gasPrice.mul(gasEstimation);
  const gasPriceInETH = environment.api.util.fromWei(
    totalGasPrice,
    "ether",
  );
  const gasPriceInMLN = gasPriceInETH.mul(marketPrice);
  const fullCostInMLN =
    order.type === "sell"
      ? order.price.plus(gasPriceInMLN)
      : order.price.minus(gasPriceInMLN);
  return fullCostInMLN;
};

export default estimateFullCost;
