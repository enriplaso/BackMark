import { fail } from 'assert';
import { expect } from 'chai';
import 'mocha';
import { IExchangeSimulator } from '../../src/lib/exchange/IExchangeSImulator';
import { ExchangeSimulator } from '../../src/lib/exchange/exchangeSimulator.js';
import { TradingData } from '../../src/lib/exchange/types.js';
import { OrderType, Side, TimeInForce } from '../../src/lib/orders/types.js';

describe('Exchange Simulator tests', function () {
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
            expect(order.timeInForce).to.equal(TimeInForce.GOOD_TILL_CANCEL);
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
            const quantity = 0.5;

            const order = await exchangeSimulator.marketSellOrder(quantity);

            expect(order.side).to.equal(Side.SELL);
            expect(order.type).to.equal(OrderType.MARKET);
            expect(order.timeInForce).to.equal(TimeInForce.GOOD_TILL_CANCEL);
            expect(order.quantity).to.equal(quantity);
        });
    });

    describe('Process Orders', () => {
        it('Should process market buy order', async function () {
            const initialBalance = 1000;
            const funds = 500;
            const fee = 0;

            const exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: initialBalance, fee });
            exchangeSimulator.marketBuyOrder(funds);

            const tradingData: TradingData = {
                timestamp: 1646403720000,
                price: 41314.0,
                volume: 3.85438335,
            };

            exchangeSimulator.processOrders(tradingData);

            const orders = exchangeSimulator.getAllOrders();
            const productSize = exchangeSimulator.getAccount().productQuantity;
            const accountBalance = exchangeSimulator.getAccount().balance;

            expect(orders.length).to.equal(0);
            expect(productSize).to.equal((funds - fee) / tradingData.price); //TODO calculate properly based fee
            expect(accountBalance).to.equal(initialBalance - funds - fee);
        });

        it('Should Not close Market Buy order if there is not enough volume', async function () {
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
            const productSize = exchangeSimulator.getAccount().productQuantity;
            const accountBalance = exchangeSimulator.getAccount().balance;
            const trades = exchangeSimulator.getAllTrades();

            expect(orders.length).to.equal(1);
            expect(trades.length).to.equal(2);

            //  expect(productSize).to.equal((funds - fee) / tradingData.price);
            // expect(accountBalance).to.equal(initialBalance - funds - fee);
        });

        it('Should process market Sell order', async function () {
            const initialBalance = 0;
            const initialProductSize = 2;
            const orderSize = 1;
            const fee = 1;

            const exchangeSimulator = new ExchangeSimulator({
                productName: 'BTC-USD',
                accountBalance: initialBalance,
                fee,
                productQuantity: initialProductSize,
            });
            exchangeSimulator.marketSellOrder(1);

            const tradingData: TradingData = {
                timestamp: 1646403720000,
                price: 41314.0,
                volume: 3.85438335,
            };

            exchangeSimulator.processOrders(tradingData);

            const orders = exchangeSimulator.getAllOrders();
            const productSize = exchangeSimulator.getAccount().productQuantity;
            const accountBalance = exchangeSimulator.getAccount().balance;

            expect(orders.length).to.equal(0);
            expect(productSize).to.equal(initialProductSize - orderSize);
            expect(accountBalance).to.equal(tradingData.price * orderSize - fee * ((tradingData.price * orderSize) / 100)); // TODO calculat based on fee
        });

        it('Should Not close Market Sell order if there is not enough volume', async function () {
            const initialBalance = 0;
            const initialProductSize = 50;
            const orderSize = 15;
            const fee = 1;

            const exchangeSimulator = new ExchangeSimulator({
                productName: 'BTC-USD',
                accountBalance: initialBalance,
                fee,
                productQuantity: initialProductSize,
            });
            exchangeSimulator.marketSellOrder(orderSize);

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
            const productSize = exchangeSimulator.getAccount().productQuantity;
            const accountBalance = exchangeSimulator.getAccount().balance;
            const trades = exchangeSimulator.getAllTrades();

            expect(orders.length).to.equal(1);
            expect(trades.length).to.equal(2);

            expect(productSize).to.equal(initialProductSize - tradingData.volume - tradingData2.volume);
            // expect(accountBalance).to.equal(initialBalance - funds - fee);
        });

        it('Should trigger a stop loss order when reaching the price or less', async function () {
            const initialBalance = 0;
            const initialProductSize = 2;
            const orderSize = 1;
            const fee = 1;

            const exchangeSimulator = new ExchangeSimulator({
                productName: 'BTC-USD',
                accountBalance: initialBalance,
                fee,
                productQuantity: initialProductSize,
            });
            exchangeSimulator.stopLossOrder(43000, 1);

            const tradingData1: TradingData = {
                timestamp: 1646403720000,
                price: 45314.0,
                volume: 5.85438335,
            };

            exchangeSimulator.processOrders(tradingData1);

            expect(exchangeSimulator.getAllOrders().length).to.equal(1); // no order processed yet

            const tradingData2: TradingData = {
                timestamp: 1646403720000,
                price: 40314.0,
                volume: 3.85438335,
            };

            exchangeSimulator.processOrders(tradingData2);

            const orders = exchangeSimulator.getAllOrders();
            const productSize = exchangeSimulator.getAccount().productQuantity;
            const accountBalance = exchangeSimulator.getAccount().balance;

            expect(orders.length).to.equal(0);
            expect(productSize).to.equal(initialProductSize - orderSize);
            expect(accountBalance).to.equal(tradingData2.price * orderSize - fee * ((tradingData2.price * orderSize) / 100)); // TODO calculat based on fee
        });
    });
});

function assertIsError(error: unknown): asserts error is Error {
    if (!(error instanceof Error)) {
        throw new Error('Error is not an instance of error');
    }
}
