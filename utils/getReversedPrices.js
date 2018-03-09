import rp from "request-promise";
import BigNumber from "bignumber.js";

const cleanSymbol = symbol =>
  symbol
    .replace("-M", "")
    .replace("-T", "")
    .toLowerCase();

const getReversedPrices = async (
  baseTokenSymbol,
  quoteTokenSymbol,
  apiPath
) => {
  const assetPair = [
    cleanSymbol(quoteTokenSymbol),
    cleanSymbol(baseTokenSymbol)
  ].join("_");

  const uri = `${apiPath}${assetPair}`;
  const rawPrices = await rp({ uri, json: true });

  /*
  Careful; here we inverse the logic buy/sell
  below since our asset pair is inversed */
  return {
    last: new BigNumber(1).div(rawPrices[assetPair].last),
    buy: new BigNumber(1).div(rawPrices[assetPair].sell),
    sell: new BigNumber(1).div(rawPrices[assetPair].buy)
  };
};

export default getReversedPrices;
