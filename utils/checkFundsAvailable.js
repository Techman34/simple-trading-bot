import { getBalance } from "@melonproject/melon.js";

const checkFundsAvailable = async (order, fundAddress) => {
  const balance = await getBalance(order.buy.symbol, fundAddress);
  return balance.toNumber() !== 0;
};

export default checkFundsAvailable;
