import { expect } from 'chai';
import { timeStamp } from 'console';
import 'mocha';
import { Backtest } from '../src/lib/backtest'
import { ExchangeSimulator } from '../src/lib/exchangeSimulator';
import { BackTestOptions } from '../src/lib/IBacktest';
import { ITradingData } from '../src/lib/trade';
import { SmaStrategy } from './strategies/smaStrategy'
// Data from https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution
describe.only('backtest tests', function () {
    //1. Import coingecko-api
    const CoinGecko = require('coingecko-api');

    //2. Initiate the CoinGecko API Client
    const coinGeckoClient = new CoinGecko();

    it('Should ...', async function () {

        const from = Math.floor(new Date('2021-01-01').getTime() / 1000); //UNIX timestamp
        const to = Math.floor(new Date('2022-01-29').getTime() / 1000); // Fist day or our demo data

        const data = await coinGeckoClient.coins.fetchMarketChartRange('bitcoin', {
            from,
            to,
        });

        const formatedPreviousData: Array<ITradingData> = data.data.prices.map((price) => {
            return { timeStamp: price[0], price: price[1] } as unknown as ITradingData;
        })

        const exchangeSimulator = new ExchangeSimulator(1000, 1);
        let account = await exchangeSimulator.getAccount("e");

        const strategy = new SmaStrategy(exchangeSimulator, formatedPreviousData);
        const backTest = new Backtest('./test/data/btcusd_short.csv', strategy, exchangeSimulator);

        await backTest.run();

        account = await exchangeSimulator.getAccount("e");

        const productSize = exchangeSimulator.getProductSize();
        console.info(productSize);

        console.info(account);
        expect(true).be.true;
    });
});
