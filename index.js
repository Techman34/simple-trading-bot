import Web3 from "web3";
import {
  setEnvironment,
  getParityProvider,
  getEnvironment,
  getConfig,
  getQuoteAssetSymbol,
  getNativeAssetSymbol,
  trace,
  getBalance,
  getActiveOrders,
  performCalculations,
  takeOrder,
} from "@melonproject/melon.js";

import getReversedPrices from "./utils/getReversedPrices";
import getOrCreateFund from "./utils/getOrCreateFund";
import estimateFullCost from "./utils/estimateFullCost";

require("dotenv").config();

const apiPath = "https://api.liqui.io/api/3/ticker/";

const processOrder = async (
  environment,
  order,
  fundAddress,
  marketPrice,
) => {
  const fullCost = await estimateFullCost(
    environment,
    marketPrice.last,
    order,
    fundAddress,
  );

  if (
    !(order.type === "sell" && fullCost < marketPrice.sell) &&
    !(order.type === "buy" && fullCost > marketPrice.buy)
  ) {
    trace(`Order ${order.id} isnt profitable`);
    return;
  }

  trace(`Order ${order.id} seems profitable`);
  const balance = await getBalance(environment, {
    tokenSymbol: order.buy.symbol,
    ofAddress: fundAddress,
  });

  if (balance.lt(fullCost)) {
    trace.warn(
      `Insufficient ${order.buy.symbol} to take this order :(`,
    );
    trace.warn(
      `Got: ${balance.toFixed(4)}, need: ${fullCost.toFixed(4)}`,
    );
    return;
  }

  const tradeReceipt = await takeOrder(environment, {
    id: order.id,
    fundAddress,
  });
  if (tradeReceipt.executedQuantity.gt(0)) {
    trace(`Took order ${order.id}`);
  } else {
    trace.warn(`Something went wrong`);
  }
};

const checkMarket = async (
  environment,
  fundAddress,
  baseTokenSymbol,
  quoteTokenSymbol,
) => {
  const activeOrders = await getActiveOrders(environment, {
    baseTokenSymbol,
    quoteTokenSymbol,
  });
  trace(`${activeOrders.length} active orders on the orderbook`);

  const marketPrice = await getReversedPrices(
    baseTokenSymbol,
    quoteTokenSymbol,
    apiPath,
  );

  trace(`Got prices. Last: ${marketPrice.last}`);

  await activeOrders.reduce(async (accumulator, order) => {
    await accumulator;
    return processOrder(environment, order, fundAddress, marketPrice);
  }, new Promise(resolve => resolve()));
};

(async () => {
  const { providerType, api } = await getParityProvider(-1);
  setEnvironment({
    api,
    account: {
      address: "0xa80B5F4103C8d027b2ba88bE9Ed9Bb009bF3d46f",
    },
    providerType,
  });
  const environment = getEnvironment();
  const config = await getConfig(environment);

  const baseTokenSymbol = await getQuoteAssetSymbol(environment);
  const quoteTokenSymbol = await getNativeAssetSymbol(environment);

  let busy = false;

  trace({
    message: `Melon trading bot address: ${environment.account
      .address}`,
  });
  const ketherBalance = environment.api.util.fromWei(
    environment.api.eth.getBalance(environment.account.address),
  );
  const melonBalance = await getBalance(environment, {
    tokenSymbol: quoteTokenSymbol,
    ofAddress: environment.account.address,
  });
  const etherBalance = await getBalance(environment, {
    tokenSymbol: baseTokenSymbol,
    ofAddress: environment.account.address,
  });
  trace({ message: `K-Etherbalance: Ξ${ketherBalance} ` });
  trace({ message: `Melon Token Balance: Ⓜ  ${melonBalance} ` });
  trace({ message: `Ether Token Balance: Ⓜ  ${etherBalance} ` });

  const fund = await getOrCreateFund(environment);

  web3.eth.filter("latest", async () => {
    const block = web3.eth.getBlock("latest");

    if (busy) {
      trace(`Block ${block.number}. Skipping. Still busy.`);
    } else {
      trace(`Block ${block.number}. Checking orderbook ...`);

      try {
        busy = true;
        const calculations = await performCalculations(environment, {
          fundAddress: fund.address,
        });
        const fundEthBalance = await getBalance(environment, {
          tokenSymbol: "ETH-T",
          ofAddress: fund.address,
        });
        const fundMlnBalance = await getBalance(environment, {
          tokenSymbol: "MLN-T",
          ofAddress: fund.address,
        });
        trace(
          `Fund status: ETH-T ${fundEthBalance}, MLN-T ${fundMlnBalance}`,
        );
        trace(`Shareprice: ${calculations.sharePrice.toString()}`);
        await checkMarket(
          environment,
          fund.address,
          baseTokenSymbol,
          quoteTokenSymbol,
        );
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
