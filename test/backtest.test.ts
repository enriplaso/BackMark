import { expect } from 'chai';
import { BackTest } from '../src/index.js';
import { SmaStrategy } from './strategies/smaStrategy.js';

// Data from https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution
// https://www.kaggle.com/datasets/tencars/392-crypto-currency-pairs-at-minute-resolution?select=bsvusd.csv
describe('BackTest', function () {
    it('Should run a back test for a given strategy', async function () {
        const options = {
            accountBalance: 1000,
            fee: 1.5,
            productName: 'BTC-USD',
        };
        const backTest = new BackTest('./test/data/btcusd_short.csv', SmaStrategy, options);

        await backTest.run();

        const result = backTest.getResult();

        expect(result).to.haveOwnProperty('finalBalance');
        expect(typeof result.finalBalance).to.be.string;
        expect(result).to.haveOwnProperty('finalHoldings');
        expect(typeof result.finalHoldings).to.equal('number');
        expect(result).to.haveOwnProperty('initialBalance');
        expect(typeof result.initialBalance).to.equal('number');
        expect(result).to.haveOwnProperty('finalBalance');
        expect(typeof result.finalBalance).to.equal('number');
        expect(result).to.haveOwnProperty('totalProfit');
        expect(typeof result.totalProfit).to.equal('number');
        expect(result).to.haveOwnProperty('profitPercentage');
        expect(typeof result.profitPercentage).to.equal('number');
        expect(result).to.haveOwnProperty('tradeHistory');
        expect(result.tradeHistory.length).to.be.greaterThan(0);

        console.info(result);
        expect(true).be.true;
    });

    it('Should not throw if path does not exists', async function () {
        const options = {
            accountBalance: 1000,
            fee: 1.5,
        };

        const backTest = new BackTest('./test/data/btcusd_saqw.csv', SmaStrategy, options);
        await backTest.run();

        const result = backTest.getResult();
        expect(result.tradeHistory).to.have.lengthOf(0);
    });
});
