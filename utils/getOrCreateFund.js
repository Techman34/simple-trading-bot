import {
  getFundForManager,
  getFundInformations,
  trace,
} from "@melonproject/melon.js";
import setupBot from "./setupBot";

const getOrCreateFund = async environment => {
  const fundAddress = await getFundForManager(environment, {
    managerAddress: environment.account.address,
  });

  if (!fundAddress) {
    trace(
      `No fund found for ${environment.account
        .address}. Setting one up.`,
    );
    const fund = await setupBot(environment);
    trace(`New fund created with address: ${fund.address}`);
    return fund;
  }

  const fund = await getFundInformations(environment, {
    fundAddress,
  });
  trace(`Fund found with address: ${fund.fundAddress}`);
  return {
    address: fund.fundAddress,
    name: fund.name,
    timestamp: fund.inception,
  };
};

export default getOrCreateFund;
