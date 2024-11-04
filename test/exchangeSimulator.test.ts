import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import { IExchangeSimulator } from '../src/lib/exchangeSimulator/IExchangeSImulator.js';
import { ExchangeSimulator } from '../src/lib/exchangeSimulator/exchangeSimulator.js';
import { OrderType, Side, TimeInForce, TradingData } from '../src/lib/exchangeSimulator/types.js';

describe.only('Exchange Simulator tests', function () {
    let exchangeSimulator: IExchangeSimulator;
    const PRODUCT_ID = 'BTC-USD';

    before(async () => {
        exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1 });
    });

    describe('orders', () => {
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
                assertIsError(error);
                expect(error.message).to.equal('There is not enough funds in the account');
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

    describe('Process Orders', () => {
        it('Should process market buy order', async function () {
            const initialBalance = 1000;
            const funds = 500;
            const fee = 1;

            const exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: initialBalance, fee });
            exchangeSimulator.marketBuyOrder(funds);

            const tradingData: TradingData = {
                timestamp: 1646403720000,
                price: 41314.0,
                volume: 3.85438335,
            };

            exchangeSimulator.processOrders(tradingData);

            const orders = exchangeSimulator.getAllOrders();
            const productSize = exchangeSimulator.getProductSize();
            const accountBalance = exchangeSimulator.getAccount().balance;

            expect(orders.length).to.equal(0);
            expect(productSize).to.equal((funds - fee) / tradingData.price);
            expect(accountBalance).to.equal(initialBalance - funds - fee);
        });

        it.only('Should Not process process if there is not enough volume', async function () {
            const initialBalance = 1000000;
            const funds = 500000;
            const fee = 1;

            const exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: initialBalance, fee });
            exchangeSimulator.marketBuyOrder(funds);

            const tradingData: TradingData = {
                timestamp: 1646403720000,
                price: 41314.0,
                volume: 3.85438335,
            };

            exchangeSimulator.processOrders(tradingData);

            const tradingData2: TradingData = {
                timestamp: 1646403730000,
                price: 42314.0,
                volume: 5.85438335,
            };

            exchangeSimulator.processOrders(tradingData2);

            const orders = exchangeSimulator.getAllOrders();
            const productSize = exchangeSimulator.getProductSize();
            const accountBalance = exchangeSimulator.getAccount().balance;
            const trades = exchangeSimulator.getAllTrades();

            expect(orders.length).to.equal(1);
            expect(trades.length).to.equal(2);

            //  expect(productSize).to.equal((funds - fee) / tradingData.price);
            // expect(accountBalance).to.equal(initialBalance - funds - fee);
        });
    });
});

function assertIsError(error: unknown): asserts error is Error {
    if (!(error instanceof Error)) {
        throw new Error('Error is not an instance of error');
    }
}
