import { expect } from 'chai';
import 'mocha';
import { BackTest } from '../src/lib/backtest.js';
import { ExchangeSimulator } from '../src/lib/exchangeSimulator/exchangeSimulator.js';
import { SmaStrategy } from './strategies/smaStrategy.js';
import { IExchangeSimulator } from '../src/lib/exchangeSimulator/IExchangeSImulator.js';
//Data from https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution
// https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution?select=bsvusd.csv
describe('backTest tests', function () {
    it('Should run a back test for a given strategy', async function () {
        const exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1 });

        const strategy = new SmaStrategy(exchangeSimulator);
        const backTest = new BackTest('./test/data/btcusd.csv', strategy, exchangeSimulator);

        await backTest.run();

        //account = await exchangeSimulator.getAccount('e');

        const result = backTest.getResult();
        result.tradeHistory = []; // dont want to print it
        console.info(result);

        console.info(exchangeSimulator.getAllOrders());

        expect(true).be.true;
    });
});
