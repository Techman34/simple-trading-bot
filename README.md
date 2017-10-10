# simple-trading-bot
A simple melon.js based trading bot

### Start the trading bot
- You need an unlocked parity node running (and which has k-ETH and k-MLN). 
- ```npm install ```
- ```npm start ```

### Simple Strategy
- The Melon Bot is a Melon Fund that operates under a very simple trading strategy. 
- The Melon Bot monitors all the orders placed on the Exchange for the ETH-T/MLN-T asset pair (getActiveOrders on startup and uses the Me Melon tracker to listen for any incoming order.) 
- It retrieves prices from liqui.io API (getReversedPrices). 
- Whenever there is a buy/sell order with a higher/lower price than the current market price, Melon Bots emits a BUY/SELL Signal (makeDecision). 
- Melon Bot checks if taking the order would be profitable taking into account gas spending (estimateFullCost).
- If so, and if it has the necessary assets, it takes the order (processOrder) and triggers a new share price calculation, which allows for price monitoring.

### Fake market creator
- createMarket.js is a fictional market creator for testing purposes. 
- You need a second unlocked account running (ideal is to have a node running with 2 unlocked accounts).
