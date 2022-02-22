import { expect } from 'chai';
import 'mocha';
import { Backtest } from '../src/lib/backtest'
import { ExchangeSimulator } from '../src/lib/exchangeSimulator';
import { BackTestOptions } from '../src/lib/IBacktest';
import { SmaStrategy } from '../src/strategies/smaStrategy'

describe('backtest tests', function () {
    //1. Import coingecko-api
    const CoinGecko = require('coingecko-api');

    //2. Initiate the CoinGecko API Client
    const CoinGeckoClient = new CoinGecko();

    it.only('Should ...', async function () {

        const exchangeSimulator = new ExchangeSimulator(1000, 1);

        const strategy = new SmaStrategy(exchangeSimulator);
        const backTest = new Backtest('./test/data/btcusd_short.csv', strategy, exchangeSimulator);

        await backTest.run();

        expect(true).be.true;
    });
});
