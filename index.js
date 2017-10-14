import Web3 from "web3";
import {
  setup,
  trace,
  getBalance,
  getActiveOrders,
  melonTracker,
  getOrder
} from "@melonproject/melon.js";
import config from "./config";
import setupBot from "./utils/setupBot";
import getReversedPrices from "./utils/getReversedPrices";
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
  defaultAccount: config.unlockedAccount,
  tracer
});

const INITIAL_SUBSCRIBE_QUANTITY = 4;
const baseTokenSymbol = "W-ETH";
const quoteTokenSymbol = "MLN";
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
  const etherBalance = await getBalance("W-ETH");
  trace({ message: `K-Etherbalance: Ξ${ketherBalance} ` });
  trace({ message: `Melon Token Balance: Ⓜ  ${melonBalance} ` });
  trace({ message: `Ether Token Balance: Ⓜ  ${etherBalance} ` });

  // await createMarket();

  // const MelonBot = await setupBot(INITIAL_SUBSCRIBE_QUANTITY);
  const MelonBot = { address: config.live.fundAddress };

  /* LIVE ONLY */
  const subscriptionRequest = await subscribe(
    MelonBot.address,
    new BigNumber(INITIAL_SUBSCRIBE_QUANTITY),
    new BigNumber(INITIAL_SUBSCRIBE_QUANTITY)
  );
  trace({
    message: `Subscription requested. You want to create ${subscriptionRequest.numShares} shares`
  });
  await executeRequest(subscriptionRequest.id, MelonBot.address);

  const participation = await getParticipation(
    MelonBot.address,
    setup.defaultAccount
  );

  trace({
    message: `Your investment was successful. You own: ${participation.personalStake}`
  });

  const calculations = await performCalculations(MelonBot.address);

  trace({
    message: `Here are my numbers- GAV: ${calculations.gav}, NAV: ${calculations.nav}, Share Price: ${calculations.sharePrice}, totalSupply: ${calculations.totalSupply}`
  });

  /* END OF LIVE ONLY */

  // const activeOrders = await getActiveOrders(baseTokenSymbol, quoteTokenSymbol);

  // /* First processing all active orders on startup */
  // await Promise.all(activeOrders.map(async (order) => {
  //       const marketPrice = await getReversedPrices(
  //         baseTokenSymbol,
  //       quoteTokenSymbol,
  //         apiPath,
  //       );

  //       await processOrder(order, MelonBot.address, marketPrice);
  //     }),);

  // /* Then listening for any new order and processing each new incoming order */
  // const tracker = melonTracker.on("LogItemUpdate");

  // tracker((type, data) => {
  //   console.log(type);
  //   processNewOrder(type.id, MelonBot.address);
  // });

  // FILTER TO ACT UPON NEW BLOCKS
  // const blockListener = setup.web3.eth.filter("latest");
  // blockListener.watch(async (error, result) => {
  //   const block = setup.web3.eth.getBlock(result, true);
  //   console.log("New block #: ", block.number);
  //   const activeOrders = await getActiveOrders(
  //     baseTokenSymbol,
  //     quoteTokenSymbol
  //   );
  //   console.log(activeOrders);
  //   // getActiveOrder -> get price -> process each order
  // await Promise.all(activeOrders.map(async (order) => {
  //       const marketPrice = await getReversedPrices(
  //         baseTokenSymbol,
  //       quoteTokenSymbol,
  //         apiPath,
  //       );

  //       await processOrder(order, MelonBot.address, marketPrice);
  //     }),);
  // });
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
