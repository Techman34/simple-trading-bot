import BigNumber from "bignumber.js";

import {
  setEnvironment,
  getParityProvider,
  getEnvironment,
  getConfig,
  getQuoteAssetSymbol,
  getNativeAssetSymbol,
  trace,
  getBalance,
  makeOrderFromAccount
} from "@melonproject/melon.js";
import getReversedPrices from "./utils/getReversedPrices";
import { multiply } from "./utils/functionalBigNumber";

require("dotenv").config();

const apiPath = "https://api.liqui.io/api/3/ticker/";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const traceOrder = order =>
  order.isActive
    ? trace(
        `Placed order (${order.id.toNumber()}): Sell: ${order.sell.howMuch.toFixed(
          4
        )} ${order.sell.symbol} / Buy: ${order.buy.howMuch.toFixed(4)} ${order
          .buy.symbol} : ` +
          `Price: ${order.sell.howMuch.div(order.buy.howMuch).toFixed(4)}`
      )
    : trace(
        `Placed order (${order.id.toNumber()}): ${JSON.stringify(
          order,
          null,
          4
        )}`
      );

const marketInterval = async () => {
  const { providerType, api } = await getParityProvider(-1);
  setEnvironment({
    api,
    account: {
      address: process.env.DEFAULT_ACCOUNT
    },
    providerType
  });
  const environment = getEnvironment();
  const config = await getConfig(environment);

  console.log(config);

  const baseTokenSymbol = await getNativeAssetSymbol(environment);
  const quoteTokenSymbol = await getQuoteAssetSymbol(environment);

  try {
    trace("Start Interval");
    const ketherBalance = await environment.api.util.fromWei(
      await environment.api.eth.getBalance(environment.account.address)
    );

    const melonBalance = await getBalance(environment, {
      tokenSymbol: quoteTokenSymbol,
      ofAddress: environment.account.address
    });
    const etherBalance = await getBalance(environment, {
      tokenSymbol: baseTokenSymbol,
      ofAddress: environment.account.address
    });
    trace(`K-Etherbalance: Ξ${ketherBalance}`);
    trace(`Melon Token Balance: Ⓜ-T  ${melonBalance}`);
    trace(`Ether Token Balance: Ξ-T  ${etherBalance}`);

    const { buy, sell, last } = await getReversedPrices(
      baseTokenSymbol,
      quoteTokenSymbol,
      apiPath
    );

    trace(`Got prices. Buy: ${buy}, sell: ${sell}, last: ${last}`);

    // const sellorder1 = await makeOrderFromAccount(environment, {
    //   sell: {
    //     howMuch: new BigNumber((1 / sell).toFixed(15)),
    //     symbol: baseTokenSymbol
    //   },
    //   buy: {
    //     howMuch: new BigNumber(1),
    //     symbol: quoteTokenSymbol
    //   }
    // });

    // traceOrder(sellorder1);

    // const sellorder2 = await makeOrderFromAccount(environment, {
    //   sell: {
    //     howMuch: new BigNumber((1 / last).toFixed(15)),
    //     symbol: baseTokenSymbol
    //   },
    //   buy: {
    //     howMuch: new BigNumber(1),
    //     symbol: quoteTokenSymbol
    //   }
    // });

    // traceOrder(sellorder2);

    // const sellorder3 = await makeOrderFromAccount(environment, {
    //   sell: {
    //     howMuch: new BigNumber((1 / buy).toFixed(15)),
    //     symbol: baseTokenSymbol
    //   },
    //   buy: {
    //     howMuch: new BigNumber(1),
    //     symbol: quoteTokenSymbol
    //   }
    // });

    // traceOrder(sellorder3);

    const priceSell = 1 / buy * 1.15;

    const sellorder4 = await makeOrderFromAccount(environment, {
      sell: {
        howMuch: multiply(priceSell.toFixed(15), 100),
        symbol: baseTokenSymbol
      },
      buy: {
        howMuch: new BigNumber(100),
        symbol: quoteTokenSymbol
      }
    });

    traceOrder(sellorder4);

    // BUY ORDERS
    // const buyorder1 = await makeOrderFromAccount(environment, {
    // buy: {
    // howMuch: new BigNumber((1 / sell).toFixed(15)),
    // symbol: baseTokenSymbol
    // },
    // sell: {
    // howMuch: new BigNumber(1),
    // symbol: quoteTokenSymbol
    // }
    // });

    // traceOrder(buyorder1);

    // const buyorder2 = await makeOrderFromAccount(environment, {
    // buy: {
    // howMuch: new BigNumber((1 / last).toFixed(15)),
    // symbol: baseTokenSymbol
    // },
    // sell: {
    // howMuch: new BigNumber(1),
    // symbol: quoteTokenSymbol
    // }
    // });

    // traceOrder(buyorder2);

    // const buyorder3 = await makeOrderFromAccount(environment, {
    // buy: {
    // howMuch: new BigNumber((1 / buy).toFixed(15)),
    // symbol: baseTokenSymbol
    // },
    // sell: {
    // howMuch: new BigNumber(1),
    // symbol: quoteTokenSymbol
    // }
    // });

    // traceOrder(buyorder3);

    const priceBuy = 1 / sell * 0.85;

    const buyorder4 = await makeOrderFromAccount(environment, {
      sell: {
        howMuch: new BigNumber(100),
        symbol: quoteTokenSymbol
      },
      buy: {
        howMuch: multiply(priceBuy.toFixed(15), 100),
        symbol: baseTokenSymbol
      }
    });

    traceOrder(buyorder4);
  } catch (e) {
    trace.warn("Error in loop", e);
    console.log(e);
  } finally {
    trace(`SLEEP: ${process.env.MARKET_SLEEP_MINUTES} Minutes`);
    await sleep(process.env.MARKET_SLEEP_MINUTES * MINUTE);
    marketInterval();
  }
};

marketInterval();
