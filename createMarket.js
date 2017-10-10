import Web3 from "web3";
import BigNumber from "bignumber.js";
import { makeOrder } from "@melonproject/melon.js";

const createMarket = async () => {
  await makeOrder({
    sell: {
      howMuch: new BigNumber(1),
      symbol: "ETH-T"
    },
    buy: {
      howMuch: new BigNumber(2),
      symbol: "MLN-T"
    }
  });

  await makeOrder({
    sell: {
      howMuch: new BigNumber(1),
      symbol: "ETH-T"
    },
    buy: {
      howMuch: new BigNumber(3),
      symbol: "MLN-T"
    }
  });

  await makeOrder({
    sell: {
      howMuch: new BigNumber(1),
      symbol: "ETH-T"
    },
    buy: {
      howMuch: new BigNumber(5),
      symbol: "MLN-T"
    }
  });

  await makeOrder({
    sell: {
      howMuch: new BigNumber(5),
      symbol: "MLN-T"
    },
    buy: {
      howMuch: new BigNumber(1),
      symbol: "ETH-T"
    }
  });

  await makeOrder({
    sell: {
      howMuch: new BigNumber(2),
      symbol: "MLN-T"
    },
    buy: {
      howMuch: new BigNumber(1),
      symbol: "ETH-T"
    }
  });

  await makeOrder({
    sell: {
      howMuch: new BigNumber(3),
      symbol: "MLN-T"
    },
    buy: {
      howMuch: new BigNumber(1),
      symbol: "ETH-T"
    }
  });

  console.log("Created fictional market");
};

export default createMarket;
