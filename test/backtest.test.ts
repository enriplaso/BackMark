import { expect } from 'chai';
import 'mocha';
describe('backtest tests', function () {
    //1. Import coingecko-api
    const CoinGecko = require('coingecko-api');

    //2. Initiate the CoinGecko API Client
    const CoinGeckoClient = new CoinGecko();

    it('Should ...', async function () {
        let data = await CoinGeckoClient.coins.fetchMarketChartRange('bitcoin', {
            from: 1392577232,
            to: 1422577232,
        });

        console.log(data.data.total_volumes[1]);
        console.log(data.data.prices[2]);

        expect(true).be.true;
    });
});
