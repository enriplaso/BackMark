import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import { IExchangeSimulator } from '../src/lib/exchangeSimulator/IExchangeSImulator.js';
import { ExchangeSimulator } from '../src/lib/exchangeSimulator/exchangeSimulator.js';
import { OrderType, Side, TimeInForce } from '../src/lib/exchangeSimulator/types.js';

describe('Exchange Simulator tests', function () {
    let exchangeSimulator: IExchangeSimulator;
    const PRODUCT_ID = 'BTC-USD';

    before(async () => {
        exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1 });
    });

    it('Should create a market buy order', async function () {
        const funds = 500;

        const order = await exchangeSimulator.marketBuyOrder(funds);

        console.log(order);
        expect(order.side).to.equal(Side.BUY);
        expect(order.type).to.equal(OrderType.MARKET);
        expect(order.time_in_force).to.equal(TimeInForce.GOOD_TILL_CANCEL);
        expect(order.funds).to.equal(funds);
    });

    it('Should not create an order if there are no funds in the account', async function () {
        const funds = 5000;
        try {
            await exchangeSimulator.marketBuyOrder(funds);
            fail('should fail');
        } catch (error) {
            console.log('XXXX'); // assert is error
            //  expect(error.message).to.equal('There is not enough funds in the account');
        }
    });

    it('Should create a market sell order', async function () {
        const size = 0.5;
        exchangeSimulator.setProductSize(3);

        const order = await exchangeSimulator.marketSellOrder(size);

        expect(order.side).to.equal(Side.SELL);
        expect(order.type).to.equal(OrderType.MARKET);
        expect(order.time_in_force).to.equal(TimeInForce.GOOD_TILL_CANCEL);
        expect(order.size).to.equal(size);
    });
});
