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
import { equals } from "./utils/functionalBigNumber";
import getReversedPrices from "./utils/getReversedPrices";
import getOrCreateFund from "./utils/getOrCreateFund";
import estimateFullCost from "./utils/estimateFullCost";
import preflightTakeOrderConditions from "./utils/preflightTakeOrderConditions";

require("dotenv").config();

const apiPath = "https://api.liqui.io/api/3/ticker/";

const processOrder = async (
  environment,
  order,
  fundAddress,
  marketPrice,
) => {
  const fundTokenBalance = await getBalance(environment, {
    tokenSymbol: order.buy.symbol,
    ofAddress: fundAddress,
  });
  const conditions = await preflightTakeOrderConditions(
    environment,
    order.id,
    fundAddress,
    order.buy.howMuch,
  );
  if (conditions && fundTokenBalance.gte(order.buy.howMuch)) {
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
  } else {
    trace.warn(`Insufficient balance`);
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
  const ketherBalance = await environment.api.util.fromWei(
    await environment.api.eth.getBalance(environment.account.address),
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
  const BLOCK_POLLING_INTERVAL = 4 * 1000;
  const MAX_INTERVAL_BETWEEN_BLOCKS = 5;
  let lastBlockNumber;
  let intervalsSinceLastBlock = 0;

  const pollBlock = async () => {
    try {
      const blockNumber = await api.eth.blockNumber();

      if (!equals(blockNumber, lastBlockNumber)) {
        console.log("Incoming block ... ");

        if (busy) {
          trace(`Block ${blockNumber}. Skipping. Still busy.`);
        } else {
          trace(`Block ${blockNumber}. Checking orderbook ...`);

          try {
            busy = true;
            const calculations = await performCalculations(
              environment,
              {
                fundAddress: fund.address,
              },
            );
            const fundEthBalance = await getBalance(environment, {
              tokenSymbol: baseTokenSymbol,
              ofAddress: fund.address,
            });
            const fundMlnBalance = await getBalance(environment, {
              tokenSymbol: quoteTokenSymbol,
              ofAddress: fund.address,
            });
            trace(
              `Fund status: ${baseTokenSymbol} ${fundEthBalance}, ${quoteTokenSymbol} ${fundMlnBalance}`,
            );
            trace(
              `Shareprice: ${calculations.sharePrice.toString()}`,
            );
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
        lastBlockNumber = blockNumber;
        intervalsSinceLastBlock = 0;
      } else {
        intervalsSinceLastBlock += 1;
      }
      if (intervalsSinceLastBlock > MAX_INTERVAL_BETWEEN_BLOCKS) {
        console.log("Block overdue");
      }
    } catch (e) {
      console.error(e);
    }
  };

  pollBlock();
  const blockInterval = setInterval(
    pollBlock,
    BLOCK_POLLING_INTERVAL,
  );
})();
