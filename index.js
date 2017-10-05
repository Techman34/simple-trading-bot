import Web3 from "web3";
import { getFundForManager, setup } from "@melonproject/melon.js";

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const tracer = ({ timestamp, message, category, data }) => {
  const args = [timestamp.toISOString(), `[${category}]`, message];
  console.log(...args);
};

setup.init({
  web3,
  defaultAccount: "0x00360d2b7D240Ec0643B6D819ba81A09e40E5bCd",
  tracer
});

(async () => {
  const fund = await getFundForManager(
    "0x00360d2b7D240Ec0643B6D819ba81A09e40E5bCd"
  );

  web3.eth.filter("latest", (err, res) => console.log(err, res));

  console.log(fund);
})();
