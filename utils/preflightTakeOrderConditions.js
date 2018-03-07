import {
  getAddress,
  getConfig,
  getFundContract,
  getOrder,
  getPriceFeedContract,
  isTakePermitted,
  trace,
} from "@melonproject/melon.js";

const preflightTakeOrdersConditions = async (
  environment,
  id,
  fundAddress,
  quantityAsked,
) => {
  const order = await getOrder(environment, { id });
  const config = await getConfig(environment);
  const fundContract = await getFundContract(
    environment,
    fundAddress,
  );

  if (getAddress(config, order.sell.symbol) === fundAddress) {
    trace.warn("Fund buying its own fund token is forbidden.");
    return false;
  }

  const isShutDown = await fundContract.instance.isShutDown.call();
  if (isShutDown !== false) {
    trace.warn("Fund is shut down");
    return false;
  }

  const owner = await fundContract.instance.owner.call();
  if (
    owner.toLowerCase() !== environment.account.address.toLowerCase()
  ) {
    trace.warn("Not owner of fund");
    return false;
  }

  const priceFeedContract = await getPriceFeedContract(environment);

  const existsPriceOnAssetPair = await priceFeedContract.instance.existsPriceOnAssetPair.call(
    {},
    [
      getAddress(config, order.buy.symbol),
      getAddress(config, order.sell.symbol),
    ],
  );
  if (!existsPriceOnAssetPair) {
    trace.warn(
      "Price not provided on this asset pair by your datafeed.",
    );
    return false;
  }

  const [
    isRecent,
    referencePrice,
  ] = await priceFeedContract.instance.getReferencePrice.call({}, [
    getAddress(config, order.buy.symbol),
    getAddress(config, order.sell.symbol),
  ]);

  if (!isRecent) {
    trace.warn("Pricefeed data is outdated :( Please try again.");
    return false;
  }

  const isAllowed = await isTakePermitted(environment, {
    referencePrice,
    orderId: id,
    fundContract,
  });

  if (!isAllowed) {
    trace.warn("Risk Management module does not allow this trade.");
    return false;
  }

  // if no quantity specified OR a a specified quantity greater than the selling quantity of the
  // order, execute the full order. Otherwise, execute quantityAsked of the full order.
  const quantity =
    !quantityAsked || quantityAsked.gte(order.sell.howMuch)
      ? order.sell.howMuch
      : quantityAsked;

  if (!quantity.lte(order.sell.howMuch)) {
    trace.warn(
      "Quantity asked too high compared to quantity for sale on the order.",
    );
    return false;
  }
  return true;
};

export default preflightTakeOrdersConditions;
