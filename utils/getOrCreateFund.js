import {
  getFundForManager,
  getFundInformations,
  setup,
  trace
} from "@melonproject/melon.js";
import setupBot from "./setupBot";

const getOrCreateFund = async (managerAddress = setup.defaultAccount) => {
  const fundAddress = await getFundForManager(managerAddress);

  if (!fundAddress) {
    trace(`No fund found for ${managerAddress}. Setting one up.`);
    const fund = await setupBot();
    trace(`New fund created with address: ${fund.address}`);
    return fund;
  } else {
    const fund = await getFundInformations(fundAddress);
    trace(`Fund found with address: ${fund.fundAddress}`);
    return {
      address: fund.fundAddress,
      name: fund.name,
      timestamp: fund.creationDate
    };
  }
};

export default getOrCreateFund;
