import Web3 from "web3";
import { setup } from '@melonproject/melon.js';
import setupBot from "./utils/setupBot";

require("dotenv").config();

const web3 = new Web3(
  new Web3.providers.HttpProvider("http://localhost:8545")
);

const tracer = ({ timestamp, message, category, data }) => {
  const args = [timestamp.toISOString(), `[${category}]`, message];
  console.log(...args);
};

setup.init({
  web3,
  defaultAccount: process.env.DEFAULT_ACCOUNT,
  tracer
});

(async () => {
  try {
    await setupBot();
  } catch (e) {
    console.error(e);
  }
})();
