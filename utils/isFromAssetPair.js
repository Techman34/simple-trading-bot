const isFromAssetPair = (order, assetPairArray) => {
  if (
    order.isActive &&
    assetPairArray.includes(order.buy.symbol) &&
    assetPairArray.includes(order.sell.symbol)
  ) {
    return true;
  }
  return false;
};

export default isFromAssetPair;
