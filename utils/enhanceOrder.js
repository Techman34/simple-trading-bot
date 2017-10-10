import { getPrices } from "@melonproject/melon.js";

const enhanceOrder = (order, baseTokenSymbol, quoteTokenSymbol) => {
  const enhancedOrder = order;
  if (order.buy.symbol === baseTokenSymbol) {
    enhancedOrder.price = getPrices(order).buy;
    enhancedOrder.type = "buy";
  } else {
    enhancedOrder.price = getPrices(order).sell;
    enhancedOrder.type = "sell";
  }
  return enhancedOrder;
};

export default enhanceOrder;
