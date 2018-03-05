import BigNumber from "bignumber.js";

import {
  trace,
  signTermsAndConditions,
  setupFund,
  invest,
  executeRequest,
  getParticipation,
  performCalculations,
} from "@melonproject/melon.js";

const setupBot = async (
  environment,
  INITIAL_INVEST_QUANTITY = process.env.INITIAL_INVEST_QUANTITY,
) => {
  trace({ message: "Creating a Melon fund" });
  const signature = await signTermsAndConditions(environment);
  const MelonBot = await setupFund(environment, {
    name: "MelonBot",
    signature,
  });
  trace({
    message: `${MelonBot.name} here! Nice to meet you. My fund address is ${MelonBot.address} `,
  });
  trace(
    "I need some MLN to start operating. You can invest some MLN in my fund and I will start working!",
  );

  const subscriptionRequest = await invest(environment, {
    fundAddress: MelonBot.address,
    numShares: new BigNumber(INITIAL_INVEST_QUANTITY),
    offeredValue: new BigNumber(INITIAL_INVEST_QUANTITY),
  });
  trace({
    message: `Subscription requested. You want to create ${subscriptionRequest.numShares} shares`,
  });
  await executeRequest(environment, {
    id: subscriptionRequest.id,
    fundAddress: MelonBot.address,
  });

  const participation = await getParticipation(environment, {
    fundAddress: MelonBot.address,
    investorAddress: environment.account.address,
  });

  trace({
    message: `Your investment was successful. You own: ${participation.personalStake}`,
  });

  const calculations = await performCalculations(environment, {
    fundAddress: MelonBot.address,
  });

  trace({
    message: `Here are my numbers- GAV: ${calculations.gav}, NAV: ${calculations.nav}, Share Price: ${calculations.sharePrice}, totalSupply: ${calculations.totalSupply}`,
  });

  return MelonBot;
};

export default setupBot;
