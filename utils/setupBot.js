import BigNumber from "bignumber.js";

import {
  setup,
  trace,
  setupFund,
  subscribe,
  executeRequest,
  getParticipation,
  performCalculations
} from "@melonproject/melon.js";

const setupBot = async (
  INITIAL_SUBSCRIBE_QUANTITY = process.env.INITIAL_SUBSCRIBE_QUANTITY
) => {
  trace({ message: "Creating a Melon fund" });
  const MelonBot = await setupFund("MelonBot");
  trace({
    message: `${MelonBot.name} here! Nice to meet you. My fund address is ${MelonBot.address} `
  });
  trace(
    "I need some MLN to start operating. You can invest some MLN in my fund and I will start working!"
  );

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

  return MelonBot;
};

export default setupBot;
