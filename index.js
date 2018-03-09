import {
  setEnvironment,
  getParityProvider,
  getEnvironment,
  getQuoteAssetSymbol,
  getNativeAssetSymbol,
  trace,
  getBalance,
  performCalculations
} from "@melonproject/melon.js";
import { equals } from "./utils/functionalBigNumber";
import getOrCreateFund from "./utils/getOrCreateFund";
import checkMarket from "./utils/checkMarket";

require("dotenv").config();

const BLOCK_POLLING_INTERVAL = 4 * 1000;
const MAX_INTERVAL_BETWEEN_BLOCKS = 5;

(async () => {
  const { providerType, api } = await getParityProvider(-1);
  setEnvironment({
    api,
    account: {
      address: process.env.DEFAULT_ACCOUNT
    },
    providerType
  });
  const environment = getEnvironment();

  const quoteTokenSymbol = await getQuoteAssetSymbol(environment);
  const baseTokenSymbol = await getNativeAssetSymbol(environment);

  let busy = false;

  trace({
    message: `Melon trading bot address: ${environment.account.address}`
  });

  const fund = await getOrCreateFund(environment);

  let lastBlockNumber;
  let intervalsSinceLastBlock = 0;

  const pollBlock = async () => {
    try {
      const blockNumber = await api.eth.blockNumber();

      if (!equals(blockNumber, lastBlockNumber)) {
        if (busy) {
          trace(`Block ${blockNumber}. Skipping. Still busy.`);
        } else {
          trace(`Block ${blockNumber}. Checking orderbook ...`);

          try {
            busy = true;
            const calculations = await performCalculations(environment, {
              fundAddress: fund.address
            });
            const userEthBalance = await environment.api.util.fromWei(
              await environment.api.eth.getBalance(environment.account.address)
            );
            const fundBaseBalance = await getBalance(environment, {
              tokenSymbol: baseTokenSymbol,
              ofAddress: fund.address
            });
            const fundQuoteBalance = await getBalance(environment, {
              tokenSymbol: quoteTokenSymbol,
              ofAddress: fund.address
            });
            trace(
              `Fund balance: ${baseTokenSymbol} ${fundBaseBalance}, ${quoteTokenSymbol} ${fundQuoteBalance} - Shareprice: ${calculations.sharePrice.toString()} - User ETH Balance: ${userEthBalance}`
            );
            await checkMarket(
              environment,
              fund.address,
              baseTokenSymbol,
              quoteTokenSymbol
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
  setInterval(pollBlock, BLOCK_POLLING_INTERVAL);
})();
