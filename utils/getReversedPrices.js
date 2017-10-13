import rp from "request-promise";

const getReversedPrices = async (
  baseTokenSymbol,
  quoteTokenSymbol,
  apiPath
) => {
  const assetPair = `${quoteTokenSymbol
    .slice(0, 3)
    .toLowerCase()}_${baseTokenSymbol.slice(0, 3).toLowerCase()}`;
  const rawPrices = await rp({ uri: `${apiPath}${assetPair}`, json: true });

  /* Careful; here we inverse the logic buy/sell below since our asset pair is inversed */

  return {
    last: 1 / rawPrices[assetPair].last,
    buy: 1 / rawPrices[assetPair].sell,
    sell: 1 / rawPrices[assetPair].buy
  };
};

export default getReversedPrices;
