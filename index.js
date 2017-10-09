import {
  setup,
  trace,
  getBalance,
  performCalculations,
  getActiveOrders,
  takeOrderFromFund,
  getFundContract
} from "@melonproject/melon.js";
import setupBot from "./utils/setupBot";
import getReversedPrices from "./utils/getReversedPrices";
import estimateFullCost from "./utils/estimateFullCost";
import makeDecision from "./utils/makeDecision";
import checkFundsAvailable from "./utils/checkFundsAvailable";

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const tracer = ({ timestamp, message, category, data }) => {
  const args = [timestamp.toISOString(), `[${category}]`, message];
  console.log(...args);
};

setup.init({
  web3,
  defaultAccount: "0x00590d7fbc805b7882788d71afbe7ec2deaf03ca",
  tracer
});

const INITIAL_SUBSCRIBE_QUANTITY = 100;
const baseTokenSymbol = "ETH-T";
const quoteTokenSymbol = "MLN-T";
const apiPath = "https://api.liqui.io/api/3/ticker/";

(async () => {
  trace({
    message: `Melon trading bot starting w following eth address ${setup.defaultAccount}`
  });
  const etherBalance = setup.web3.fromWei(
    setup.web3.eth.getBalance(setup.defaultAccount)
  );
  const melonBalance = await getBalance("MLN-T");
  trace({ message: `Etherbalance: Ξ${etherBalance} ` });
  trace({ message: `Melon Balance: Ⓜ  ${melonBalance} ` });

  const MelonBot = await setupBot(INITIAL_SUBSCRIBE_QUANTITY);
  // const MelonBot = { address: "0xc7b66cef43441bbaf6fb4ebffd7cdeb3216db756" };

  const activeOrders = await getActiveOrders(baseTokenSymbol, quoteTokenSymbol);

  activeOrders.map(async order => {
    const marketPrice = await getReversedPrices(
      baseTokenSymbol,
      quoteTokenSymbol,
      apiPath
    );
    const decision = await makeDecision(order, marketPrice, MelonBot.address);

    if (decision[0] === "BUY_SIGNAL" || decision[0] === "SELL_SIGNAL") {
      const sufficientBalance = await checkFundsAvailable(
        order,
        MelonBot.address
      );
      if (!sufficientBalance) {
        console.log("Insufficient funds to take this order :( ");
      } else {
        const transactionReceipt = await takeOrderFromFund(
          decision[1],
          MelonBot.address
        );
        if (transactionReceipt.executedQuantity.toNumber() !== 0) {
          console.log("Trade executed; took order w id ", decision[1]);
          const calculations = await performCalculations(MelonBot.address);
          console.log(calculations.sharePrice.toNumber());
        }
      }
    }
  });
})();

// const makeDecision = async (order, marketPrice, fundAddress) => {
//   if (order.type === 'sell' && order.price < marketPrice.sell) {
//     const fullCost = await estimateFullCost(
//       marketPrice.last,
//       order,
//       fundAddress,
//       setup.defaultAccount,
//     );
//     if (fullCost < marketPrice.sell) {
//       trace({
//         message: `BUY SIGNAL w Real time price: ${marketPrice.sell} and Order price: ${order.price.toNumber()} and total price w gas included ${fullCost}`,
//       });
//       return ['BUY_SIGNAL', order.id];
//     }
//   } else if (order.type === 'buy' && order.price > marketPrice.buy) {
//     const fullCost = await estimateFullCost(
//       marketPrice.last,
//       order,
//       fundAddress,
//       setup.defaultAccount,
//     );
//     if (fullCost > marketPrice.buy) {
//       trace({
//         message: `SELL SIGNAL w Real time price: ${marketPrice.buy} and Order price: ${order.price.toNumber()}`,
//       });
//       return ['SELL_SIGNAL', order.id];
//     }
//   }
//   return ['SKIP', undefined];
// };

/* setupBot function */
// const setupBot = async () => {
//   trace({ message: "Creating a Melon fund" });
//   const MelonBot = await setupFund("MelonBot");
//   trace({
//     message: `${MelonBot.name} here! Nice to meet you. My fund address is ${MelonBot.address} `
//   });
//   console.log(
//     "I need some MLN to start operating. You can invest some MLN in my fund and I will start working!"
//   );

//   const subscriptionRequest = await subscribe(
//     MelonBot.address,
//     new BigNumber(INITIAL_SUBSCRIBE_QUANTITY),
//     new BigNumber(INITIAL_SUBSCRIBE_QUANTITY)
//   );
//   trace({
//     message: `Subscription requested. You want to create ${subscriptionRequest.numShares} shares`
//   });
//   await executeRequest(subscriptionRequest.id, MelonBot.address);

//   const participation = await getParticipation(
//     MelonBot.address,
//     setup.defaultAccount
//   );

//   trace({
//     message: `Your investment was successful. You own: ${participation.personalStake}`
//   });

//   const calculations = await performCalculations(MelonBot.address);

//   trace({
//     message: `Here are my numbers- GAV: ${calculations.gav}, NAV: ${calculations.nav}, Share Price: ${calculations.sharePrice}, totalSupply: ${calculations.totalSupply}`
//   });

//   return MelonBot;
// };

/* Get prices from liqui.io API and reverse to match protocol terminology (ie. MLN as quote asset) */
// const getReversedPrices = async () => {
//   const assetPair = `${quoteTokenSymbol
//     .slice(0, 3)
//     .toLowerCase()}_${baseTokenSymbol.slice(0, 3).toLowerCase()}`;
//   const rawPrices = await rp({ uri: `${apiPath}${assetPair}`, json: true });

//   /* Careful; here we inverse the logic buy/sell below since our asset pair is inversed */

//   return {
//     last: 1 / rawPrices[assetPair].last,
//     buy: 1 / rawPrices[assetPair].sell,
//     sell: 1 / rawPrices[assetPair].buy,
//   };
// };

// const estimateFullCost = async (
//   marketPrice,
//   order,
//   fundAddress,
//   managerAddress,
// ) => {
//   const fundContract = await getFundContract(fundAddress);
//   const gasEstimation = await fundContract.takeOrder.estimateGas(
//     order.id,
//     new BigNumber(0.5),
//     {
//       from: managerAddress,
//     },
//   );
//   const gasPrice = setup.web3.eth.gasPrice;
//   const totalGasPrice = gasPrice.mul(gasEstimation);
//   const gasPriceInETH = setup.web3.fromWei(totalGasPrice, 'ether');
//   const gasPriceInMLN = gasPriceInETH * marketPrice;
//   const fullCostInMLN =
//     order.type === 'sell'
//       ? order.price.toNumber() + gasPriceInMLN
//       : order.price.toNumber() - gasPriceInMLN;
//   return fullCostInMLN;
// };

// const checkFundsAvailable = async (order, fundAddress) => {
//   const balance = await getBalance(order.buy.symbol, fundAddress);
//   return balance.toNumber() !== 0;
// };
