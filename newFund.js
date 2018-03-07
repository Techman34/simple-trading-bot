import Web3 from "web3";
import {
  setEnvironment,
  getParityProvider,
  getEnvironment,
} from "@melonproject/melon.js";
import setupBot from "./utils/setupBot";

require("dotenv").config();

const tracer = ({ timestamp, message, category, data }) => {
  const args = [timestamp.toISOString(), `[${category}]`, message];
  console.log(...args);
};

(async () => {
  try {
    const { providerType, api } = await getParityProvider(-1);
    setEnvironment({
      api,
      account: {
        address: "0xa80B5F4103C8d027b2ba88bE9Ed9Bb009bF3d46f",
      },
      providerType,
    });
    const environment = getEnvironment();
    await setupBot(environment);
  } catch (e) {
    console.error(e);
  }
})();
