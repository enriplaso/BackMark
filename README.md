# BackMark

![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

BackMark is a lightweight and efficient toolkit for backtesting trading algorithms. Designed with simplicity and flexibility in mind, BackMark enables seamless integration between backtesting strategies and live trading bots, ensuring minimal adjustments are needed when transitioning from simulation to real-world trading.

## Why Backmark

 - User-Friendly Metrics: Provides clear, easy-to-understand metrics to evaluate your strategies effectively.
 - Realistic Order Simulation: Simulates partial order fills based on actual volume, giving you a more accurate backtesting experience.
 - Seamless Integration: Includes a unified interface for Exchange/Broker clients, allowing you to copy your backtesting strategy directly into your trading bot with minimal or no modifications.
 - No External Dependencies: BackMark is a self-contained solution, ensuring lightweight and hassle-free integration into your workflow.

## Installation

```
 npm i backmark
```

## How to use

```js
   import { BackTest } from 'backmark';

    const options = {
        accountBalance: 1000,
        fee: 1.5, // Percentage that will be charged on each Trade
        productName: 'BTC-USD',
    };
    const backTest = new BackTest('./test/data/btcusd_short.csv', SmaStrategy, options);

    await backTest.run();

    const result = backTest.getResult();
    console.info(result);
```

## Output example

```js
{
  initialBalance: 1000,
  product: 'BTC-USD',
  finalHoldings: 0,
  finalBalance: 1049.6294293755195,
  totalProfit: 49.62942937551952,
  tradeHistory: [
    {
      orderId: 'a072782c-7673-4010-8ef3-92b9f95461ee',
      price: 507.5,
      quantity: 0.0123151169623545,
      createdAt: 2022-02-18T23:00:00.000Z,
      side: 'buy',
      balanceAfterTrade: 492.5,
      holdingsAfterTrade: 0.0123151169623545
    },
    {
      orderId: '666d55c2-a87c-4492-a37f-61a9728386be',
      price: 249.94375,
      quantity: 0.006226935197129856,
      createdAt: 2022-02-20T23:00:00.000Z,
      side: 'buy',
      balanceAfterTrade: 242.55625,
      holdingsAfterTrade: 0.018542052159484356
    },
    {
      orderId: 'e295188b-3bd2-423d-9e14-1859943495c3',
      price: 123.097296875,
      quantity: 0.003174523488585778,
      createdAt: 2022-02-21T23:00:00.000Z,
      side: 'buy',
      balanceAfterTrade: 119.45895312500001,
      holdingsAfterTrade: 0.021716575648070134
    },
    {
      orderId: '19c0a0cd-7703-408b-88d3-14182ca8ab08',
      price: 60.6254187109375,
      quantity: 0.0015493718417645837,
      createdAt: 2022-02-22T23:00:00.000Z,
      side: 'buy',
      balanceAfterTrade: 58.833534414062505,
      holdingsAfterTrade: 0.023265947489834717
    },
    {
      orderId: '26d8eef2-80ef-4550-8381-d55e194ea7b1',
      price: 29.858018715136723,
      quantity: 0.0007689994744868107,
      createdAt: 2022-02-23T23:00:00.000Z,
      side: 'buy',
      balanceAfterTrade: 28.975515698925783,
      holdingsAfterTrade: 0.024034946964321527
    },
    {
      orderId: '7634fde9-998c-4eb8-92bf-1dca3a7052f2',
      price: 1020.6539136765938,
      quantity: 0.024034946964321527,
      createdAt: 2022-02-28T23:00:00.000Z,
      side: 'sell',
      balanceAfterTrade: 1049.6294293755195,
      holdingsAfterTrade: 0
    }
  ],
  profitPercentage: 4.9629429375519525
}

```
## License

[MIT](LICENSE)




