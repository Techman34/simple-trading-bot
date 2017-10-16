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
  defaultAccount: "0x083fe3c77a09ee1ffe34b13a0dcf66d52974cf85",
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

(async () => {
  const ketherBalance = setup.web3.fromWei(
    setup.web3.eth.getBalance(setup.defaultAccount)
  );

  const melonBalance = await getBalance("MLN-T");
  const etherBalance = await getBalance("ETH-T");
  trace(`K-Etherbalance: Ξ${ketherBalance}`);
  trace(`Melon Token Balance: Ⓜ-T  ${melonBalance}`);
  trace(`Ether Token Balance: Ξ-T  ${etherBalance}`);

  while (true) {
    try {
      trace("Start Interval");

      const info = getTokenInfo("ETH-T");

      const { buy, sell, last } = await getReversedPrices(
        baseTokenSymbol,
        quoteTokenSymbol,
        apiPath
      );

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

      console.log("sell order 1");
      console.log(sellorder1);

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

      console.log("sell order 2");
      console.log(sellorder2);

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

      console.log("sell order 3");
      console.log(sellorder3);

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

      console.log("sell order 4");
      console.log(sellorder4);

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

      console.log(buyorder1);
      console.log("buy order 1");

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

      console.log("buy order 2");
      console.log(buyorder2);

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

      console.log("buy order 3");
      console.log(buyorder3);

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

      console.log("buy order 4");
      console.log(buyorder4);

      console.log("done sleeping");
    } catch (e) {
      trace.warn("Error in loop", e);
    } finally {
      console.log("wainign");
      await sleep(5 * MINUTE);
    }
  }
})();
