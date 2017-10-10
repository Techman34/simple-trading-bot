import Web3 from "web3";
import BigNumber from "bignumber.js";
import rp from "request-promise";
import { setup, trace } from "@melonproject/melon.js";
import estimateFullCost from "./estimateFullCost";

const makeDecision = async (order, marketPrice, fundAddress) => {
  if (order.type === "sell" && order.price < marketPrice.sell) {
    const fullCost = await estimateFullCost(
      marketPrice.last,
      order,
      fundAddress,
      setup.defaultAccount
    );
    if (fullCost < marketPrice.sell) {
      trace({
        message: `BUY SIGNAL w Real time price: ${marketPrice.sell} and Order price: ${order.price.toNumber()} and total cost w gas included ${fullCost}`
      });
      return ["BUY_SIGNAL", order.id];
    }
  } else if (order.type === "buy" && order.price > marketPrice.buy) {
    const fullCost = await estimateFullCost(
      marketPrice.last,
      order,
      fundAddress,
      setup.defaultAccount
    );
    if (fullCost > marketPrice.buy) {
      trace({
        message: `SELL SIGNAL w Real time price: ${marketPrice.buy} and Order price: ${order.price.toNumber()} and total cost w gas included ${fullCost}`
      });
      return ["SELL_SIGNAL", order.id];
    }
  }
  return ["SKIP", undefined];
};

export default makeDecision;
