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
  defaultAccount: "0x02e00f9c517baf4fb4e9a7bf005a56db84a4cfbc",
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
  trace({ message: `K-Etherbalance: Ξ${ketherBalance} ` });
  trace({ message: `Melon Token Balance: Ⓜ  ${melonBalance} ` });
  trace({ message: `Ether Token Balance: Ⓜ  ${etherBalance} ` });

  while (true) {
    console.log("- intervalo -");

    const info = getTokenInfo("ETH-T");
    console.log(info);

    let { buy, sell, last } = await getReversedPrices(
      baseTokenSymbol,
      quoteTokenSymbol,
      apiPath
    );

    /*
    const insideorder = await makeOrder({
        sell: {
            howMuch: new BigNumber(10),
            symbol: "ETH-T"
        },
        buy: {
            howMuch: new BigNumber(1),
            symbol: "MLN-T"
        }
    });

    console.log("....")
    console.log(insideorder)
    */

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

    let priceSell = 1 / buy + 1 / buy * 0.1;

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

    let priceBuy = 1 / sell - 1 / sell * 0.1;

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

    console.log("wainign");
    await sleep(5 * MINUTE);

    console.log("done sleeping");
  }

  /*
  setInterval(() => {

  }, 5 * SECONDS)

  const marketPrice = await getReversedPrices(
    baseTokenSymbol,
    quoteTokenSymbol,
    apiPath
  );
  
  console.log(marketPrice)
*/

  /*
  try {
  const firstOrder = await makeOrder({
      sell: {
          howMuch: new BigNumber(1),
          symbol: "ETH-T"
      },
      buy: {
          howMuch: new BigNumber(2),
          symbol: "MLN-T"
      }
  });

  console.log(firstOrder)
  } catch(err) {
    console.log(err)
  }
*/
})();

/*
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

  // await createMarket();

  const MelonBot = await setupBot(INITIAL_SUBSCRIBE_QUANTITY);
  // const MelonBot = { address: "0xc7b66cef43441bbaf6fb4ebffd7cdeb3216db756" };

  const activeOrders = await getActiveOrders(baseTokenSymbol, quoteTokenSymbol);

  await Promise.all(
    activeOrders.map(async order => {
      const marketPrice = await getReversedPrices(
        baseTokenSymbol,
        quoteTokenSymbol,
        apiPath
      );

      await processOrder(order, MelonBot.address, marketPrice);
    })
  );

  const tracker = melonTracker.on("LogItemUpdate");

  tracker((type, data) => {
    console.log(type);
    processNewOrder(type.id, MelonBot.address);
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
*/
