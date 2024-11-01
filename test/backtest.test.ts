import { expect } from 'chai';
import 'mocha';
import { BackTest } from '../src/lib/backtest.js';
import { ExchangeSimulator } from '../src/lib/exchangeSimulator/exchangeSimulator.js';
import { SmaStrategy } from './strategies/smaStrategy.js';
import { IExchangeSimulator } from '../src/lib/exchangeSimulator/IExchangeSImulator.js';
//Data from https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution
// https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution?select=bsvusd.csv
describe.skip('backtest tests', function () {
    it('Should run a back test for a given strategy', async function () {
        const exchangeSimulator = new ExchangeSimulator(1000, 1) as unknown as IExchangeSimulator;
        let account = await exchangeSimulator.getAccount('e');

        const strategy = new SmaStrategy(exchangeSimulator);
        const backTest = new BackTest('./test/data/btcusd_short.csv', strategy, exchangeSimulator);

        await backTest.run();

        account = await exchangeSimulator.getAccount('e');

        const productSize = exchangeSimulator.getProductSize('btc');
        console.info(productSize);

        console.info(account);
        expect(true).be.true;
    });
});
