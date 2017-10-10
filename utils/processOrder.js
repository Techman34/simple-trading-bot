import makeDecision from "./makeDecision";
import checkFundsAvailable from "./checkFundsAvailable";
import { performCalculations, takeOrderFromFund } from "@melonproject/melon.js";

const processOrder = async (order, fundAddress, marketPrice) => {
  const decision = await makeDecision(order, marketPrice, fundAddress);

  if (decision[0] === "BUY_SIGNAL" || decision[0] === "SELL_SIGNAL") {
    const sufficientBalance = await checkFundsAvailable(order, fundAddress);
    if (!sufficientBalance) {
      console.log("Insufficient funds to take this order :( ");
    } else {
      const tradeReceipt = await takeOrderFromFund(decision[1], fundAddress);
      if (tradeReceipt.executedQuantity.toNumber() !== 0) {
        console.log(`Trade executed; took order w id ${decision[1]}`);
        const calculations = await performCalculations(fundAddress);
        console.log(
          `Updated share price :, ${calculations.sharePrice.toNumber()} MLN/share`
        );
      }
    }
  }
};

export default processOrder;
