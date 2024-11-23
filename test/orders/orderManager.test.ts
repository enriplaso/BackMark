import { Account, TradingData } from '../../src/lib/exchange/types.js';
import { OrderManager } from '../../src/lib/orders/orderManager.js';
import { Order, OrderStatus, OrderType, Side, TimeInForce, Trade } from '../../src/lib/orders/types.js';
import { expect } from 'chai';
import 'mocha';

describe('OrderManager', () => {
    let orderManager: OrderManager;
    let account: Account;

    beforeEach(() => {
        orderManager = new OrderManager();
        account = {
            id: '1',
            balance: 10000,
            available: 10000,
            fee: 0.1,
            productQuantity: 0,
            currency: 'usdt',
        };
    });

    describe('addOrder', () => {
        it('should add an order to active orders', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };
            orderManager.addOrder(order);

            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()[0]).to.deep.equal(order);
        });
    });

    describe('cancelOrder', () => {
        it('should cancel an active order and move it to closed orders', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };
            orderManager.addOrder(order);

            orderManager.cancelOrder('1', Date.now());

            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getClosedOrders()[0].status).to.equal(OrderStatus.DONE);
        });

        it('should return for non-existent orders', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };
            orderManager.addOrder(order);

            orderManager.cancelOrder('non-existent', Date.now());

            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(orderManager.getClosedOrders()).to.be.empty;
        });
    });

    describe('cancelAllOrders', () => {
        it('should cancel all active orders', () => {
            const orders: Order[] = [
                {
                    id: '1',
                    type: OrderType.MARKET,
                    side: Side.BUY,
                    funds: 1000,
                    status: OrderStatus.OPEN,
                    timeInForce: TimeInForce.GOOD_TILL_CANCEL,
                },
                {
                    id: '2',
                    type: OrderType.LIMIT,
                    side: Side.SELL,
                    price: 120,
                    quantity: 50,
                    status: OrderStatus.OPEN,
                    timeInForce: TimeInForce.GOOD_TILL_CANCEL,
                },
            ];
            orders.forEach((order) => orderManager.addOrder(order));

            orderManager.cancelAllOrders(Date.now());

            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(orderManager.getClosedOrders()).to.have.lengthOf(2);
        });
    });

    describe('processOrder', () => {
        it('should execute a market buy order', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 5000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 60,
                timestamp: Date.now(),
            };
            const beforeTradeBalance = account.balance;
            const appliedFee = (account.fee / 100) * order.funds!;

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(account.balance).to.equal(beforeTradeBalance - order.funds! - appliedFee);
            expect(account.productQuantity).to.equal((order.funds! - appliedFee) / tradingData.price);
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(trades).to.have.lengthOf(1);
            expect(trades[0].price).to.equal(order.funds! + appliedFee);
            expect(trades[0].side).to.equal('buy');
        });

        it('should process and partially execute a limit sell order', () => {
            const order: Order = {
                id: '1',
                type: OrderType.LIMIT,
                side: Side.SELL,
                price: 120,
                quantity: 50,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            account.productQuantity = 50;

            const tradingData: TradingData = {
                price: 120,
                volume: 30,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            expect(account.productQuantity).to.equal(20);
            expect(account.balance).to.be.greaterThan(6000);
            expect(order.quantity).to.equal(20);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
        });
    });

    describe('shouldExecuteOrder', () => {
        it('should execute a market order without a stop price', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 10,
                timestamp: Date.now(),
            };

            const result = (orderManager as any).shouldExecuteOrder(order, tradingData);
            expect(result).to.be.true;
        });

        it('should not execute a limit buy order if price is too high', () => {
            const order: Order = {
                id: '1',
                type: OrderType.LIMIT,
                side: Side.BUY,
                price: 90,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 10,
                timestamp: Date.now(),
            };

            const result = (orderManager as any).shouldExecuteOrder(order, tradingData);
            expect(result).to.be.false;
        });
    });

    describe('checkTimeInForce', () => {
        it('should close the order if FILL_OR_KILL and not fully executed', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.FILL_OR_KILL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 5,
                timestamp: Date.now(),
            };

            const result = (orderManager as any).checkTimeInForce(order, tradingData);
            expect(result).to.be.false;
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
        });

        it('should keep the order active for GOOD_TILL_CANCEL', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 10,
                timestamp: Date.now(),
            };

            const result = (orderManager as any).checkTimeInForce(order, tradingData);
            expect(result).to.be.true;
        });
    });
});
