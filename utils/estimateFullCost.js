import {
  getFundContract,
  toProcessable,
  getConfig,
} from "@melonproject/melon.js";

const estimateFullCost = async (
  environment,
  marketPrice,
  order,
  fundAddress,
) => {
  const fundContract = await getFundContract(
    environment,
    fundAddress,
  );
  const gasPrice = await environment.api.eth.gasPrice();
  const config = await getConfig(environment);

  const gasEstimation = await fundContract.instance.takeOrder.estimateGas(
    { from: environment.account.address, gasPrice },
    [
      order.id,
      fundAddress,
      toProcessable(config, order.sell.howMuch, order.sell.symbol),
    ],
  );
  const totalGasPrice = gasPrice.mul(gasEstimation);
  const gasPriceInETH = await environment.api.util.fromWei(
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
