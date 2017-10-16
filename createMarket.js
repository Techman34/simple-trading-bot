require("dotenv").config();

import Web3 from "web3";

import BigNumber from "bignumber.js";

import {
  setup,
  trace,
  getBalance,
  getActiveOrders,
  getTokenInfo,
  melonTracker,
  makeOrder,
  getOrder
} from "@melonproject/melon.js";
import setupBot from "./utils/setupBot";
import getReversedPrices from "./utils/getReversedPrices";
import createMarket from "./createMarket";
import processOrder from "./utils/processOrder";
import enhanceOrder from "./utils/enhanceOrder";
import isFromAssetPair from "./utils/isFromAssetPair";

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

const INITIAL_SUBSCRIBE_QUANTITY = 100;
const baseTokenSymbol = "ETH-T";
const quoteTokenSymbol = "MLN-T";
const assetPairArray = [baseTokenSymbol, quoteTokenSymbol];
const apiPath = "https://api.liqui.io/api/3/ticker/";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const traceOrder = order =>
  trace(
    `Placed order (${order.id.toNumber()}): ` +
      `Sell: ${order.sell.howMuch.toFixed(4)} ${order.sell.symbol} / ` +
      `Buy: ${order.buy.howMuch.toFixed(4)} ${order.buy.symbol} : ` +
      `Price: ${order.sell.howMuch.div(order.buy.howMuch).toFixed(4)}`
  );

(async () => {
  while (true) {
    try {
      trace("Start Interval");
      const ketherBalance = setup.web3.fromWei(
        setup.web3.eth.getBalance(setup.defaultAccount)
      );

      const melonBalance = await getBalance("MLN-T");
      const etherBalance = await getBalance("ETH-T");
      trace(`K-Etherbalance: Ξ${ketherBalance}`);
      trace(`Melon Token Balance: Ⓜ-T  ${melonBalance}`);
      trace(`Ether Token Balance: Ξ-T  ${etherBalance}`);

      const info = getTokenInfo("ETH-T");

      const { buy, sell, last } = await getReversedPrices(
        baseTokenSymbol,
        quoteTokenSymbol,
        apiPath
      );

      trace(`Got prices. Buy: ${buy}, sell: ${sell}, last: ${last}`);

      const sellorder1 = await makeOrder({
        sell: {
          howMuch: new BigNumber((1 / sell).toFixed(15)),
          symbol: "ETH-T"
        },
        buy: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(sellorder1);

      const sellorder2 = await makeOrder({
        sell: {
          howMuch: new BigNumber((1 / last).toFixed(15)),
          symbol: "ETH-T"
        },
        buy: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(sellorder2);

      const sellorder3 = await makeOrder({
        sell: {
          howMuch: new BigNumber((1 / buy).toFixed(15)),
          symbol: "ETH-T"
        },
        buy: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(sellorder3);

      const priceSell = 1 / buy + 1 / buy * 0.1;

      const sellorder4 = await makeOrder({
        sell: {
          howMuch: new BigNumber(priceSell.toFixed(15)),
          symbol: "ETH-T"
        },
        buy: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(sellorder4);

      // BUY ORDERS

      const buyorder1 = await makeOrder({
        buy: {
          howMuch: new BigNumber((1 / sell).toFixed(15)),
          symbol: "ETH-T"
        },
        sell: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(buyorder1);

      const buyorder2 = await makeOrder({
        buy: {
          howMuch: new BigNumber((1 / last).toFixed(15)),
          symbol: "ETH-T"
        },
        sell: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(buyorder2);

      const buyorder3 = await makeOrder({
        buy: {
          howMuch: new BigNumber((1 / buy).toFixed(15)),
          symbol: "ETH-T"
        },
        sell: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(buyorder3);

      const priceBuy = 1 / sell - 1 / sell * 0.1;

      const buyorder4 = await makeOrder({
        buy: {
          howMuch: new BigNumber(priceBuy.toFixed(15)),
          symbol: "ETH-T"
        },
        sell: {
          howMuch: new BigNumber(1),
          symbol: "MLN-T"
        }
      });

      traceOrder(buyorder4);
    } catch (e) {
      trace.warn("Error in loop", e);
    } finally {
      trace(`SLEEP: ${process.env.MARKET_SLEEP_MINUTES * MINUTE}`);
      await sleep(process.env.MARKET_SLEEP_MINUTES * MINUTE);
    }
  }
})();
