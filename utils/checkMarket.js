import {
  trace,
  getBalance,
  takeOrder,
  getActiveOrders
} from "@melonproject/melon.js";

import getReversedPrices from "./getReversedPrices";
import preflightTakeOrderConditions from "./preflightTakeOrderConditions";
import { displayNumber, min, isZero, greaterThan } from "./functionalBigNumber";

const PROFITABILITY_BOUNDARIES = {
  TAKE: 0.01,
  MAKE: 0.09,
  CANCEL: 0.03
};

const MIN_ORDER_VALUE = 0.1;

const API_ENDPOINT = "https://api.liqui.io/api/3/ticker/";

const processOrder = async (environment, order, fundAddress, marketPrice) => {
  const profitablePrice = order.price.times(
    1 + (order.type === "buy" ? -1 : 1) * PROFITABILITY_BOUNDARIES.TAKE
  );

  if (
    (order.type === "buy" && profitablePrice.lte(marketPrice.sell)) ||
    greaterThan(MIN_ORDER_VALUE, order.sell.howMuch) ||
    ((order.type === "sell" && profitablePrice.gte(marketPrice.buy)) ||
      greaterThan(MIN_ORDER_VALUE, order.buy.howMuch))
  ) {
    trace(
      `${order.type}-order ${order.id} is NOT profitable. ${order.type === "buy"
        ? "Ask"
        : "Bid"} (order price): ${displayNumber(
        order.price
      )}, market: ${displayNumber(
        order.type === "buy" ? marketPrice.sell : marketPrice.buy
      )}, profitability threshold: ${displayNumber(
        profitablePrice
      )}, buy how much: ${displayNumber(
        order.buy.howMuch
      )}, sell how much: ${displayNumber(order.sell.howMuch)}`
    );
    return;
  }

  console.log(
    order,
    order.buy.howMuch.toString(),
    order.buy.howMuch.toFixed(20),
    greaterThan(order.sell.howMuch, MIN_ORDER_VALUE)
  );

  trace(
    `${order.type}-order ${order.id} is profitable. ${order.type === "buy"
      ? "Ask"
      : "Bid"} (order price): ${displayNumber(
      order.price
    )}, market: ${displayNumber(
      order.type === "buy" ? marketPrice.sell : marketPrice.buy
    )}, profitability threshold: ${displayNumber(
      profitablePrice
    )}, buy how much: ${displayNumber(
      order.buy.howMuch
    )}, sell how much: ${displayNumber(order.sell.howMuch)}`
  );

  const balance = await getBalance(environment, {
    tokenSymbol: order.buy.symbol,
    ofAddress: fundAddress
  });
  const quantityAsked = min(balance, order.buy.howMuch);

  console.log("XXXX Qty", quantityAsked, balance, order.buy.howMuch);

  // if (isZero())

  try {
    const conditions = await preflightTakeOrderConditions(
      environment,
      order.id,
      fundAddress,
      quantityAsked
    );

    console.log("------- CONDITIONS", conditions);

    if (!conditions) {
      trace.warn(`Order ${order.id} Takeorder preconditions not met`);
      return;
    }
  } catch (e) {
    trace.warn(`Order ${order.id}: Error during preconditions`);
    console.error(e);
    return;
  }

  const tradeReceipt = await takeOrder(environment, {
    id: order.id,
    fundAddress,
    quantityAsked
  });

  if (tradeReceipt.executedQuantity.gt(0)) {
    trace(`Took order ${order.id}`);
  } else {
    trace.warn(`Something went wrong. Order id: ${order.id}`);
  }
};

const checkMarket = async (
  environment,
  fundAddress,
  baseTokenSymbol,
  quoteTokenSymbol
) => {
  const activeOrders = await getActiveOrders(environment, {
    baseTokenSymbol,
    quoteTokenSymbol
  });
  trace(`${activeOrders.length} active orders on the orderbook`);

  const marketPrice = await getReversedPrices(
    baseTokenSymbol,
    quoteTokenSymbol,
    API_ENDPOINT
  );

  trace(`Got prices. Last: ${marketPrice.last}`);

  await activeOrders.reduce(async (accumulator, order) => {
    await accumulator;
    return processOrder(environment, order, fundAddress, marketPrice);
  }, new Promise(resolve => resolve()));
};

export default checkMarket;
