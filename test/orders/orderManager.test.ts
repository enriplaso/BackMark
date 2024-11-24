import { Account, TradingData } from '../../src/lib/exchange/types.js';
import { OrderManager } from '../../src/lib/orders/orderManager.js';
import { Order, OrderStatus, OrderType, Side, Stop, TimeInForce, Trade } from '../../src/lib/orders/types.js';
import { expect } from 'chai';
import 'mocha';

describe.only('OrderManager', () => {
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

    describe('getOrderById', () => {
        it('should find an order by its id Id', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const order2: Order = {
                id: '2',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 5000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };
            orderManager.addOrder(order);
            orderManager.addOrder(order2);

            const foundOrder = orderManager.getOrderById(order2.id);

            expect(orderManager.getActiveOrders()).to.have.lengthOf(2);
            expect(foundOrder).to.deep.equal(order2);
        });

        it('should return undefined an order was not found', () => {
            const foundOrder = orderManager.getOrderById('non-existing');

            expect(foundOrder).to.be.undefined;
        });
    });

    describe('processOrder', () => {
        it('should execute a market buy order', () => {
            const orderFunds = 5000;
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: orderFunds,
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
            expect(account.balance).to.equal(beforeTradeBalance - orderFunds - appliedFee);
            expect(account.productQuantity).to.equal((orderFunds - appliedFee) / tradingData.price);
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(trades).to.have.lengthOf(1);
            expect(trades[0].price).to.equal(orderFunds! + appliedFee);
            expect(trades[0].side).to.equal('buy');
        });

        it('should not execute a buy order if account has not enough found', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 15000,
                price: 100,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 1200,
                volume: 60,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(0);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(trades).to.have.lengthOf(0);
        });

        it('should execute a market Sell order', () => {
            account.productQuantity = 50;
            const initialAccountQuantity = account.productQuantity;
            const orderQuantity = 30;
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.SELL,
                quantity: orderQuantity,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 60,
                timestamp: Date.now(),
            };
            const beforeTradeBalance = account.balance;
            const appliedFee = (account.fee / 100) * orderQuantity * tradingData.price;
            const totalPayed = orderQuantity * tradingData.price - appliedFee;

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(account.balance).to.equal(beforeTradeBalance + totalPayed);
            expect(account.productQuantity).to.equal(initialAccountQuantity - orderQuantity);
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(trades).to.have.lengthOf(1);
            expect(trades[0].price).to.equal(totalPayed);
            expect(trades[0].side).to.equal('sell');
        });
        it('should not execute a Sell order if account has not enough product quantity', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.SELL,
                quantity: 33,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 1200,
                volume: 60,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(0);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(trades).to.have.lengthOf(0);
        });

        it('should execute a stop loss "Sell" order', () => {
            account.productQuantity = 50;
            const initialAccountQuantity = account.productQuantity;
            const orderQuantity = 30;

            const tradingData: TradingData = {
                price: 100,
                volume: 60,
                timestamp: Date.now(),
            };
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                stop: Stop.LOSS,
                stopPrice: tradingData.price + 20, // we ensure will be trigger
                side: Side.SELL,
                quantity: orderQuantity,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const beforeTradeBalance = account.balance;
            const appliedFee = (account.fee / 100) * orderQuantity * tradingData.price;
            const totalPayed = orderQuantity * tradingData.price - appliedFee;

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(account.balance).to.equal(beforeTradeBalance + totalPayed);
            expect(account.productQuantity).to.equal(initialAccountQuantity - orderQuantity);
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(trades).to.have.lengthOf(1);
            expect(trades[0].price).to.equal(totalPayed);
            expect(trades[0].side).to.equal('sell');
        });

        it('should not execute a stop loss "Sell" order if stope price is not reached', () => {
            account.productQuantity = 50;

            const tradingData: TradingData = {
                price: 100,
                volume: 60,
                timestamp: Date.now(),
            };
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                stop: Stop.LOSS,
                stopPrice: tradingData.price - 20, // we ensure will be trigger
                side: Side.SELL,
                quantity: 30,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(0);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(trades).to.have.lengthOf(0);
        });

        it('should execute a stop Entry "Buy" order', () => {
            const tradingData: TradingData = {
                price: 100,
                volume: 60,
                timestamp: Date.now(),
            };
            const orderFunds = 5000;
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                stop: Stop.ENTRY,
                stopPrice: tradingData.price - 20, // we ensure will be trigger
                side: Side.BUY,
                funds: orderFunds,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const beforeTradeBalance = account.balance;
            const appliedFee = (account.fee / 100) * order.funds!;

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(account.balance).to.equal(beforeTradeBalance - orderFunds - appliedFee);
            expect(account.productQuantity).to.equal((orderFunds - appliedFee) / tradingData.price);
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(trades).to.have.lengthOf(1);
            expect(trades[0].price).to.equal(orderFunds! + appliedFee);
            expect(trades[0].side).to.equal('buy');
        });

        it('should execute a limit buy order', () => {
            const orderFunds = 5000;
            const order: Order = {
                id: '1',
                type: OrderType.LIMIT,
                side: Side.BUY,
                funds: orderFunds,
                price: 100,
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
            expect(account.balance).to.equal(beforeTradeBalance - orderFunds - appliedFee);
            expect(account.productQuantity).to.equal((orderFunds - appliedFee) / tradingData.price);
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getActiveOrders()).to.be.empty;
            expect(trades).to.have.lengthOf(1);
            expect(trades[0].price).to.equal(orderFunds! + appliedFee);
            expect(trades[0].side).to.equal('buy');
        });

        it('should not execute a limit buy order if trading price is higher then order price', () => {
            const order: Order = {
                id: '1',
                type: OrderType.LIMIT,
                side: Side.BUY,
                funds: 5000,
                price: 100,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            };

            const tradingData: TradingData = {
                price: 120,
                volume: 60,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(0);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(trades).to.have.lengthOf(0);
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

        it('should not execute a limit sell order is price is lower than limit price', () => {
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
                price: 100,
                volume: 30,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(0);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(trades).to.have.lengthOf(0);
        });
    });

    describe('Time In Force handling', () => {
        it('should close the  Buy order if FILL_OR_KILL and cannot be fully executed', () => {
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

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getClosedOrders()[0].doneReason).to.equal('Cancelled');
            expect(orderManager.getActiveOrders()).to.have.lengthOf(0);
            expect(trades).to.have.lengthOf(0);
        });

        it('should close the Sell order if FILL_OR_KILL and cannot be fully executed', () => {
            account.productQuantity = 50;
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.SELL,
                quantity: 50,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.FILL_OR_KILL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 5,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getClosedOrders()[0].doneReason).to.equal('Cancelled');
            expect(orderManager.getActiveOrders()).to.have.lengthOf(0);
            expect(trades).to.have.lengthOf(0);
        });

        it('should keep the order active for GOOD_TILL_CANCEL if cannot be filled', () => {
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
                volume: 5,
                timestamp: Date.now(),
            };
            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(0);
            expect(orderManager.getActiveOrders()).to.have.lengthOf(1);
            expect(trades).to.have.lengthOf(1);
        });

        it('should cancel the order if INMEDIATE_OR_CANCELL and not fully executed', () => {
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                timeInForce: TimeInForce.INMEDIATE_OR_CANCELL,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 5,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getClosedOrders()[0].doneReason).to.equal('Partially Filled');
            expect(orderManager.getActiveOrders()).to.have.lengthOf(0);
            expect(trades).to.have.lengthOf(1);
        });

        it('should cancel the order if GOOD_TILL_TIME and not expiration date reached', () => {
            const now = Date.now();
            const order: Order = {
                id: '1',
                type: OrderType.MARKET,
                side: Side.BUY,
                funds: 1000,
                status: OrderStatus.OPEN,
                expireTime: new Date(now - 50000),
                timeInForce: TimeInForce.GOOD_TILL_TIME,
            };

            const tradingData: TradingData = {
                price: 100,
                volume: 1,
                timestamp: Date.now(),
            };

            orderManager.addOrder(order);
            orderManager.processOrder(order, account, tradingData);

            const trades = orderManager.getAllTrades();
            expect(orderManager.getClosedOrders()).to.have.lengthOf(1);
            expect(orderManager.getClosedOrders()[0].doneReason).to.equal('Expired');
            expect(orderManager.getActiveOrders()).to.have.lengthOf(0);
            expect(trades).to.have.lengthOf(1);
        });
    });
});
