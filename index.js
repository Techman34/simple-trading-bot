import Web3 from "web3";
import { getFundForManager, setup } from "@melonproject/melon.js";

setup.init({
  web3: new Web3(new Web3.providers.HttpProvider("http://localhost:8545")),
  daemonAddress: "0x00360d2b7d240ec0643b6d819ba81a09e40e5bcd",
  defaultAccount: "0x00360d2b7D240Ec0643B6D819ba81A09e40E5bCd",
  tracer: ({ timestamp, message, category, data }) => {
    const args = [timestamp.toISOString(), `[${category}]`, message];
    console.log(...args);
  }
});

(async () => {
  const fund = await getFundForManager(
    "0x00360d2b7D240Ec0643B6D819ba81A09e40E5bCd"
  );

  console.log(fund);
})();
