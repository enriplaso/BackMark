import { expect } from 'chai';
import 'mocha';
import { IExchangeSimulator } from '../../src/lib/exchange/IExchangeSImulator';
import { ExchangeSimulator } from '../../src/lib/exchange/exchangeSimulator.js';
import { TradingData } from '../../src/lib/exchange/types.js';
import { OrderType, Side, TimeInForce, Stop } from '../../src/lib/orders/types.js';

describe('Exchange Simulator tests', function () {
    let exchangeSimulator: IExchangeSimulator;

    beforeEach(() => {
        exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1 });
    });

    describe('Market Orders', () => {
        it('Should create a market buy order', function () {
            const funds = 500;

            const order = exchangeSimulator.marketBuyOrder(funds);

            expect(order.side).to.equal(Side.BUY);
            expect(order.type).to.equal(OrderType.MARKET);
            expect(order.timeInForce).to.equal(TimeInForce.GOOD_TILL_CANCEL);
            expect(order.funds).to.equal(funds);
        });

        it('Should not create a market buy order if funds exceed account balance', function () {
            const funds = 2000;

            expect(() => exchangeSimulator.marketBuyOrder(funds)).to.throw('There is not enough funds in the account');
        });

        it('Should create a market sell order', function () {
            const quantity = 0.5;
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 1 });

            const order = exchangeSimulator.marketSellOrder(quantity);

            expect(order.side).to.equal(Side.SELL);
            expect(order.type).to.equal(OrderType.MARKET);
            expect(order.timeInForce).to.equal(TimeInForce.GOOD_TILL_CANCEL);
            expect(order.quantity).to.equal(quantity);
        });

        it('Should not create a market sell order if quantity exceeds product balance', function () {
            const quantity = 2;

            expect(() => exchangeSimulator.marketSellOrder(quantity)).to.throw('There is not enough product quantity to sell.');
        });
    });

    describe('Limit Orders', () => {
        it('Should create a limit buy order', function () {
            const price = 30000;
            const funds = 500;

            const order = exchangeSimulator.limitBuyOrder(price, funds);

            expect(order.side).to.equal(Side.BUY);
            expect(order.type).to.equal(OrderType.LIMIT);
            expect(order.price).to.equal(price);
            expect(order.funds).to.equal(funds);
        });

        it('Should not create a limit buy order with invalid price', function () {
            const price = -1;
            const funds = 500;

            expect(() => exchangeSimulator.limitBuyOrder(price, funds)).to.throw('Price must be greater than 0');
        });
    });

    describe('Stop Orders', () => {
        it('Should create a stop entry order', function () {
            const price = 35000;
            const funds = 500;

            const order = exchangeSimulator.stopEntryOrder(price, funds);

            expect(order.side).to.equal(Side.BUY);
            expect(order.stop).to.equal(Stop.ENTRY);
            expect(order.stopPrice).to.equal(price);
        });

        it('Should create a stop loss order', function () {
            const price = 35000;
            const size = 1;
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 5 });

            const order = exchangeSimulator.stopLossOrder(price, size);

            expect(order.side).to.equal(Side.SELL);
            expect(order.stop).to.equal(Stop.LOSS);
            expect(order.stopPrice).to.equal(price);
        });
    });

    describe('Order Processing', () => {
        it('Should process market buy order', function () {
            const funds = 500;
            const tradingData: TradingData = { timestamp: Date.now(), price: 10000, volume: 10 };

            exchangeSimulator.marketBuyOrder(funds);
            exchangeSimulator.processOrders(tradingData);

            const account = exchangeSimulator.getAccount();
            const commission = (account.fee / 100) * funds;

            expect(account.balance).to.be.equal(funds - commission); // After spending 500 + 1% fee
            expect(account.productQuantity).to.be.equal((funds - commission) / tradingData.price);
        });

        it('Should process market sell order', function () {
            const initialProductQuantity = 1;
            const initialBalance = 1000;
            exchangeSimulator = new ExchangeSimulator({
                productName: 'BTC-USD',
                accountBalance: 1000,
                fee: 1,
                productQuantity: initialProductQuantity,
            });

            exchangeSimulator.marketSellOrder(0.5);
            const tradingData: TradingData = { timestamp: Date.now(), price: 10000, volume: 10 };

            exchangeSimulator.processOrders(tradingData);

            const account = exchangeSimulator.getAccount();
            expect(account.balance).to.be.equal(initialBalance + 5000 - 50); // Proceeds minus fee
            expect(account.productQuantity).to.be.equal(0.5); // Remaining quantity
        });

        it('Should handle stop loss order trigger', function () {
            const stopPrice = 9000;
            const tradingData1: TradingData = { timestamp: Date.now(), price: 10000, volume: 10 };
            const tradingData2: TradingData = { timestamp: Date.now() + 1000, price: 8500, volume: 10 };

            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 2 });
            exchangeSimulator.stopLossOrder(stopPrice, 1);

            exchangeSimulator.processOrders(tradingData1);
            expect(exchangeSimulator.getAllOrders().length).to.equal(1); // Not triggered

            exchangeSimulator.processOrders(tradingData2);
            expect(exchangeSimulator.getAllOrders().length).to.equal(0); // Triggered and executed
        });
    });

    describe('Order Management', () => {
        it('Should cancel a specific order', function () {
            const order = exchangeSimulator.marketBuyOrder(500);
            exchangeSimulator.cancelOrder(order.id);

            const orders = exchangeSimulator.getAllOrders();
            expect(orders.find((o) => o.id === order.id)).to.be.undefined;
        });

        it('Should cancel all orders', function () {
            exchangeSimulator = new ExchangeSimulator({ productName: 'BTC-USD', accountBalance: 1000, fee: 1, productQuantity: 1 });

            exchangeSimulator.marketBuyOrder(500);
            exchangeSimulator.marketSellOrder(0.5);
            exchangeSimulator.cancelAllOrders();

            const orders = exchangeSimulator.getAllOrders();
            expect(orders.length).to.equal(0);
        });
    });
});
