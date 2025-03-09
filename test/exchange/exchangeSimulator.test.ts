import { expect } from 'chai';
import 'mocha';
import { IExchangeSimulator } from '../../src/lib/exchange/IExchangeSImulator';
import { ExchangeSimulator } from '../../src/lib/exchange/exchangeSimulator.js';
import { TradingData } from '../../src/lib/exchange/types.js';
import { OrderType, Side, TimeInForce, Stop } from '../../src/lib/orders/types.js';
import { fail } from 'assert';

describe('Exchange Simulator tests', function () {
    let exchangeSimulator: IExchangeSimulator;

    beforeEach(() => {
        exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000 });
    });

    describe('Market Orders', () => {
        it('Should create a market buy order', async function () {
            const funds = 500;

            const order = await exchangeSimulator.marketBuyOrder(funds, TimeInForce.GOOD_TILL_TIME, new Date());

            expect(order.side).to.equal(Side.BUY);
            expect(order.type).to.equal(OrderType.MARKET);
            expect(order.timeInForce).to.equal(TimeInForce.GOOD_TILL_TIME);
            expect(order.funds).to.equal(funds);
        });

        it('Should not create a market buy order if funds exceed account balance', async function () {
            const funds = 2000;

            try {
                await exchangeSimulator.marketBuyOrder(funds);
                fail('Should fail');
            } catch (error: any) {
                expect(error.message).to.equal('There is not enough funds in the account.');
            }
        });

        it('Should not create a market but order if TimeInForce is GOOD_TILL_TIME and not expire date is passed', async function () {
            const funds = 10;

            try {
                await exchangeSimulator.marketBuyOrder(funds, TimeInForce.GOOD_TILL_TIME);
                fail('Should fail');
            } catch (error: any) {
                expect(error.message).to.equal('There is not an expiration date for GOOD_TILL_TIME time in force.');
            }
        });

        it('Should create a market sell order', async function () {
            const quantity = 0.5;
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 1 });

            const order = await exchangeSimulator.marketSellOrder(quantity);

            expect(order.side).to.equal(Side.SELL);
            expect(order.type).to.equal(OrderType.MARKET);
            expect(order.timeInForce).to.equal(TimeInForce.GOOD_TILL_CANCEL);
            expect(order.quantity).to.equal(quantity);
        });

        it('Should not create a market sell order if quantity exceeds product balance', async function () {
            const quantity = 2;

            try {
                await exchangeSimulator.marketSellOrder(quantity);
                fail('Should fail');
            } catch (error: any) {
                expect(error.message).to.equal('There is not enough product quantity to sell.');
            }
        });
    });

    describe('Limit Orders', () => {
        it('Should create a limit buy order', async function () {
            const price = 30000;
            const funds = 500;

            const order = await exchangeSimulator.limitBuyOrder(price, funds);

            expect(order.side).to.equal(Side.BUY);
            expect(order.type).to.equal(OrderType.LIMIT);
            expect(order.price).to.equal(price);
            expect(order.funds).to.equal(funds);
        });

        it('Should not create a limit buy order with invalid price', async function () {
            const price = -1;
            const funds = 500;

            try {
                await exchangeSimulator.limitBuyOrder(price, funds);
                fail('Should fail');
            } catch (error: any) {
                expect(error.message).to.equal('Price must be greater than 0.');
            }
        });

        it('Should create a limit Sell order', async function () {
            const price = 30000;
            const quantity = 0.5;
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 1 });

            const order = await exchangeSimulator.limitSellOrder(price, quantity);

            expect(order.side).to.equal(Side.SELL);
            expect(order.type).to.equal(OrderType.LIMIT);
            expect(order.price).to.equal(price);
            expect(order.quantity).to.equal(quantity);
        });
        it('Should not create a limit buy order with invalid price', async function () {
            const price = 30000;
            const quantity = 1.5;

            try {
                await exchangeSimulator.limitSellOrder(price, quantity);
                fail('Should fail');
            } catch (error: any) {
                expect(error.message).to.equal('There is not enough product quantity to sell.');
            }
        });
    });

    describe('Stop Orders', () => {
        it('Should create a stop entry order', async function () {
            const price = 35000;
            const funds = 500;

            const order = await exchangeSimulator.stopEntryOrder(price, funds);

            expect(order.side).to.equal(Side.BUY);
            expect(order.stop).to.equal(Stop.ENTRY);
            expect(order.stopPrice).to.equal(price);
        });

        it('Should create a stop loss order', async function () {
            const price = 35000;
            const size = 1;
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 5 });

            const order = await exchangeSimulator.stopLossOrder(price, size);

            expect(order.side).to.equal(Side.SELL);
            expect(order.stop).to.equal(Stop.LOSS);
            expect(order.stopPrice).to.equal(price);
        });
    });

    describe('Order Processing', () => {
        it('Should process market buy order', async function () {
            const funds = 500;
            const tradingData: TradingData = { timestamp: Date.now(), price: 10000, volume: 10 };

            await exchangeSimulator.marketBuyOrder(funds);
            await exchangeSimulator.processOrders(tradingData);

            const account = await exchangeSimulator.getAccount();
            const commission = (account.fee / 100) * funds;

            expect(account.balance).to.be.equal(funds - commission); // After spending 500 + 1% fee
            expect(account.productQuantity).to.be.equal((funds - commission) / tradingData.price);
        });

        it('Should process market sell order', async function () {
            const initialProductQuantity = 1;
            const initialBalance = 1000;
            exchangeSimulator = new ExchangeSimulator({
                productName: 'BTC-USD',
                accountBalance: 1000,
                fee: 1,
                productQuantity: initialProductQuantity,
            });

            await exchangeSimulator.marketSellOrder(0.5);
            const tradingData: TradingData = { timestamp: Date.now(), price: 10000, volume: 10 };

            await exchangeSimulator.processOrders(tradingData);

            const account = await exchangeSimulator.getAccount();
            expect(account.balance).to.be.equal(initialBalance + 5000 - 50); // Proceeds minus fee
            expect(account.productQuantity).to.be.equal(0.5); // Remaining quantity
        });

        it('Should handle stop loss order trigger', async function () {
            const stopPrice = 9000;
            const tradingData1: TradingData = { timestamp: Date.now(), price: 10000, volume: 10 };
            const tradingData2: TradingData = { timestamp: Date.now() + 1000, price: 8500, volume: 10 };

            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 2 });
            await exchangeSimulator.stopLossOrder(stopPrice, 1);

            await exchangeSimulator.processOrders(tradingData1);
            expect((await exchangeSimulator.getAllOrders()).length).to.equal(1); // Not triggered

            await exchangeSimulator.processOrders(tradingData2);
            expect((await exchangeSimulator.getAllOrders()).length).to.equal(0); // Triggered and executed
        });
    });

    describe('Order Management', () => {
        it('Should cancel a specific order', async function () {
            const order = await exchangeSimulator.marketBuyOrder(500);
            await exchangeSimulator.cancelOrder(order.id);

            const orders = await exchangeSimulator.getAllOrders();
            expect(orders.find((o) => o.id === order.id)).to.be.undefined;
        });

        it('Should cancel all orders', async function () {
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 1 });

            await exchangeSimulator.marketBuyOrder(500);
            await exchangeSimulator.marketSellOrder(0.5);
            await exchangeSimulator.cancelAllOrders();

            const orders = await exchangeSimulator.getAllOrders();
            expect(orders.length).to.equal(0);
        });
    });
});
