require("dotenv").config();

import Web3 from "web3";
import {
  setup,
  trace,
  getBalance,
  getActiveOrders,
  melonTracker,
  getOrder
} from "@melonproject/melon.js";

import getReversedPrices from "./utils/getReversedPrices";
// import createMarket from "./createMarket";
import processOrder from "./utils/processOrder";
import enhanceOrder from "./utils/enhanceOrder";
import isFromAssetPair from "./utils/isFromAssetPair";
import getOrCreateFund from "./utils/getOrCreateFund";

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

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
const assetPairArray = [baseTokenSymbol, quoteTokenSymbol];
const apiPath = "https://api.liqui.io/api/3/ticker/";

(async () => {
  trace({
    message: `Melon trading bot starting w following eth address ${setup.defaultAccount}`
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

  const activeOrders = await getActiveOrders(baseTokenSymbol, quoteTokenSymbol);

  /* First processing all active orders on startup */
  await Promise.all(
    activeOrders.map(async order => {
      const marketPrice = await getReversedPrices(
        baseTokenSymbol,
        quoteTokenSymbol,
        apiPath
      );

      try {
        await processOrder(order, fund.address, marketPrice);
      } catch (e) {
        trace.warn(`Error while processingOrder`, e);
      }
    })
  );

  /* Then listening for any new order and processing each new incoming order */
  const tracker = melonTracker.on("LogItemUpdate");

  tracker((type, data) => {
    console.log(type);
    try {
      processNewOrder(type.id, fund.address);
    } catch (e) {
      trace.warn(`Error while processing new order`, e);
    }
  });
})();

const processNewOrder = async (id, fundAddress) => {
  const order = await getOrder(id);
  if (isFromAssetPair(order, assetPairArray)) {
    const enhancedOrder = enhanceOrder(
      order,
      baseTokenSymbol,
      quoteTokenSymbol
    );

    const marketPrice = await getReversedPrices(
      baseTokenSymbol,
      quoteTokenSymbol,
      apiPath
    );
    await processOrder(enhancedOrder, fundAddress, marketPrice);
  }
};
