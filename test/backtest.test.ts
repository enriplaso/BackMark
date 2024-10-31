import { expect } from 'chai';
import 'mocha';
import { Backtest } from '../src/lib/backtest.js';
import { ExchangeSimulator } from '../src/lib/exchangeSimulator.js';
import { SmaStrategy } from './strategies/smaStrategy.js';
import { IExchangeSimulator } from '../src/lib/IExchangeSImulator.js';
import { IExchangeClient } from '../src/lib/IExchangeClient.js';
//Data from https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution
// https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution?select=bsvusd.csv
describe.only('backtest tests', function () {
    it('Should run a back test for a given strategy', async function () {
        const exchangeSimulator = new ExchangeSimulator(1000, 1) as unknown as IExchangeSimulator;
        let account = await exchangeSimulator.getAccount('e');

        const strategy = new SmaStrategy(exchangeSimulator);
        const backTest = new Backtest('./test/data/btcusd_short.csv', strategy, exchangeSimulator);

        await backTest.run();

        account = await exchangeSimulator.getAccount('e');

        const productSize = exchangeSimulator.getProductSize('btc');
        console.info(productSize);

        console.info(account);
        expect(true).be.true;
    });
});
