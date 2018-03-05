import Web3 from "web3";
import {
  setup,
  trace,
  getBalance,
  getActiveOrders,
  performCalculations,
  takeOrderFromFund
} from "@melonproject/melon.js";

import getReversedPrices from "./utils/getReversedPrices";
import getOrCreateFund from "./utils/getOrCreateFund";
import estimateFullCost from "./utils/estimateFullCost";

require("dotenv").config();

const web3 = new Web3(
  new Web3.providers.HttpProvider("http://localhost:8545")
);

const tracer = ({ timestamp, message, category, data }) => {
  const args = [timestamp.toISOString(), `[${category}]`, message];
  console.log(...args);
};

setup.init({
  web3,
  defaultAccount: process.env.DEFAULT_ACCOUNT,
  tracer
});

const baseTokenSymbol = "ETH-T";
const quoteTokenSymbol = "MLN-T";
const apiPath = "https://api.liqui.io/api/3/ticker/";

let busy = false;

const processOrder = async (order, fundAddress, marketPrice) => {
  const fullCost = await estimateFullCost(
    marketPrice.last,
    order,
    fundAddress
  );

  if (
    !(order.type === "sell" && fullCost < marketPrice.sell) &&
    !(order.type === "buy" && fullCost > marketPrice.buy)
  ) {
    trace(`Order ${order.id} isnt profitable`);
    return;
  }

  trace(`Order ${order.id} seems profitable`);
  const balance = await getBalance(order.buy.symbol, fundAddress);

  if (balance.lt(fullCost)) {
    trace.warn(`Insufficient ${order.buy.symbol} to take this order :(`);
    trace.warn(`Got: ${balance.toFixed(4)}, need: ${fullCost.toFixed(4)}`);
    return;
  }

  const tradeReceipt = await takeOrderFromFund(order.id, fundAddress);
  if (tradeReceipt.executedQuantity.gt(0)) {
    trace(`Took order ${order.id}`);
  } else {
    trace.warn(`Something went wrong`);
  }
};

const checkMarket = async fundAddress => {
  const activeOrders = await getActiveOrders(
    baseTokenSymbol,
    quoteTokenSymbol
  );
  trace(`${activeOrders.length} active orders on the orderbook`);

  const marketPrice = await getReversedPrices(
    baseTokenSymbol,
    quoteTokenSymbol,
    apiPath
  );

  trace(`Got prices. Last: ${marketPrice.last}`);

  await activeOrders.reduce(async (accumulator, order) => {
    await accumulator;
    return processOrder(order, fundAddress, marketPrice);
  }, new Promise(resolve => resolve()));
};

(async () => {
  trace({
    message: `Melon trading bot address: ${setup.defaultAccount}`
  });
  const ketherBalance = setup.web3.fromWei(
    setup.web3.eth.getBalance(setup.defaultAccount)
  );
  const melonBalance = await getBalance("MLN-T");
  const etherBalance = await getBalance("ETH-T");
  trace({ message: `K-Etherbalance: Ξ${ketherBalance} ` });
  trace({ message: `Melon Token Balance: Ⓜ  ${melonBalance} ` });
  trace({ message: `Ether Token Balance: Ⓜ  ${etherBalance} ` });

  const fund = await getOrCreateFund();

  web3.eth.filter("latest", async () => {
    const block = web3.eth.getBlock("latest");

    if (busy) {
      trace(`Block ${block.number}. Skipping. Still busy.`);
    } else {
      trace(`Block ${block.number}. Checking orderbook ...`);

      try {
        busy = true;
        const calculations = await performCalculations(fund.address);
        const fundEthBalance = await getBalance("ETH-T", fund.address);
        const fundMlnBalance = await getBalance("MLN-T", fund.address);
        trace(`Fund status: ETH-T ${fundEthBalance}, MLN-T ${fundMlnBalance}`);
        trace(`Shareprice: ${calculations.sharePrice.toString()}`);
        await checkMarket(fund.address);
      } catch (e) {
        trace.warn(`Error while processingOrder`, e);
        console.error(e);
      } finally {
        trace("Block processed");
        busy = false;
      }
    }
  });
})();
