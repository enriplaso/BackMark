import { expect } from 'chai';
import 'mocha';
import { BackTest } from '../src/index.js';
import { SmaStrategy } from './strategies/smaStrategy.js';
//Data from https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution
// https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution?select=bsvusd.csv

describe('backTest tests', function () {
    it('Should run a back test for a given strategy', async function () {
        const options = {
            accountBalance: 1000,
            fee: 1,
            productName: 'BTC-USD',
        };
        const backTest = new BackTest('./test/data/btcusd_short.csv', SmaStrategy, options);

        await backTest.run();

        //account = await exchangeSimulator.getAccount('e');

        const result = backTest.getResult();
        result.tradeHistory = []; // dont want to print it
        console.info(result);

        expect(true).be.true;
    });
});
