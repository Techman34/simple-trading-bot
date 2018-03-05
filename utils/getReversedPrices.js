import rp from "request-promise";
import BigNumber from "bignumber.js";

const getReversedPrices = async (
  baseTokenSymbol,
  quoteTokenSymbol,
  apiPath
) => {
  const assetPair = `${quoteTokenSymbol.replace(
    "-T",
    ""
  )}_${baseTokenSymbol.replace("-T", "")}`.toLocaleLowerCase();
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
