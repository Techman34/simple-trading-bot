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
  getTokenInfo,
  makeOrderFromAccount,
} from "@melonproject/melon.js";
import getReversedPrices from "./utils/getReversedPrices";

require("dotenv").config();

const tracer = ({ timestamp, message, category, data }) => {
  const args = [timestamp.toISOString(), `[${category}]`, message];
  console.log(...args);
};

const apiPath = "https://api.liqui.io/api/3/ticker/";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const traceOrder = order =>
  trace(
    `Placed order (${order.id.toNumber()}): ` +
      `Sell: ${order.sell.howMuch.toFixed(4)} ${order.sell
        .symbol} / ` +
      `Buy: ${order.buy.howMuch.toFixed(4)} ${order.buy.symbol} : ` +
      `Price: ${order.sell.howMuch
        .div(order.buy.howMuch)
        .toFixed(4)}`,
  );

const marketInterval = async () => {
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

  const busy = false;

  try {
    trace("Start Interval");
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
    trace(`K-Etherbalance: Ξ${ketherBalance}`);
    trace(`Melon Token Balance: Ⓜ-T  ${melonBalance}`);
    trace(`Ether Token Balance: Ξ-T  ${etherBalance}`);

    const info = getTokenInfo(baseTokenSymbol);

    const { buy, sell, last } = await getReversedPrices(
      baseTokenSymbol,
      quoteTokenSymbol,
      apiPath,
    );

    trace(`Got prices. Buy: ${buy}, sell: ${sell}, last: ${last}`);

    const sellorder1 = await makeOrderFromAccount(environment, {
      sell: {
        howMuch: new BigNumber((1 / sell).toFixed(15)),
        symbol: baseTokenSymbol,
      },
      buy: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(sellorder1);

    const sellorder2 = await makeOrderFromAccount(environment, {
      sell: {
        howMuch: new BigNumber((1 / last).toFixed(15)),
        symbol: baseTokenSymbol,
      },
      buy: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(sellorder2);

    const sellorder3 = await makeOrderFromAccount(environment, {
      sell: {
        howMuch: new BigNumber((1 / buy).toFixed(15)),
        symbol: baseTokenSymbol,
      },
      buy: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(sellorder3);

    const priceSell = 1 / buy + 1 / buy * 0.1;

    const sellorder4 = await makeOrderFromAccount(environment, {
      sell: {
        howMuch: new BigNumber(priceSell.toFixed(15)),
        symbol: baseTokenSymbol,
      },
      buy: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(sellorder4);

    // BUY ORDERS

    const buyorder1 = await makeOrderFromAccount(environment, {
      buy: {
        howMuch: new BigNumber((1 / sell).toFixed(15)),
        symbol: baseTokenSymbol,
      },
      sell: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(buyorder1);

    const buyorder2 = await makeOrderFromAccount(environment, {
      buy: {
        howMuch: new BigNumber((1 / last).toFixed(15)),
        symbol: baseTokenSymbol,
      },
      sell: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(buyorder2);

    const buyorder3 = await makeOrderFromAccount(environment, {
      buy: {
        howMuch: new BigNumber((1 / buy).toFixed(15)),
        symbol: baseTokenSymbol,
      },
      sell: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(buyorder3);

    const priceBuy = 1 / sell - 1 / sell * 0.1;

    const buyorder4 = await makeOrderFromAccount(environment, {
      buy: {
        howMuch: new BigNumber(priceBuy.toFixed(15)),
        symbol: baseTokenSymbol,
      },
      sell: {
        howMuch: new BigNumber(1),
        symbol: quoteTokenSymbol,
      },
    });

    traceOrder(buyorder4);
  } catch (e) {
    trace.warn("Error in loop", e);
  } finally {
    trace(`SLEEP: ${process.env.MARKET_SLEEP_MINUTES} Minutes`);
    await sleep(process.env.MARKET_SLEEP_MINUTES * MINUTE);
    marketInterval();
  }
};

marketInterval();
