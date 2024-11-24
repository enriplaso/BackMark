import type { Account, SimulationOptions, TradingData } from './types.js';
import type { IExchangeSimulator } from './IExchangeSImulator.js';
import type { Order, Trade } from '../orders/types.js';
import { OrderStatus, OrderType, Side, Stop, TimeInForce } from '../orders/types.js';
import { randomUUID } from 'crypto';
import { IOrderManager } from '../orders/IOrderManager.js';
import { OrderManager } from '../orders/orderManager.js';
import assert from 'assert';

export class ExchangeSimulator implements IExchangeSimulator {
    private account: Account;
    private currentTradeTimestamp: number = Date.now();

    constructor(
        private readonly options: SimulationOptions,
        private readonly orderManager: IOrderManager = new OrderManager(),
    ) {
        this.account = {
            id: randomUUID(),
            balance: this.options.accountBalance,
            available: this.options.accountBalance,
            currency: 'USD',
            productQuantity: this.options.productQuantity || 0,
            fee: this.options.fee || 0,
        };
    }

    public processOrders(tradingData: TradingData): void {
        this.currentTradeTimestamp = tradingData.timestamp;
        this.orderManager.getActiveOrders().forEach((order) => {
            this.orderManager.processOrder(order, this.account, tradingData);
        });
    }

    public marketBuyOrder(funds: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order {
        this.assertFunds(funds);
        this.assertCancelAfter(timeInForce, cancelAfter);
        return this.createOrder(Side.BUY, OrderType.MARKET, funds, undefined, undefined, timeInForce, undefined, cancelAfter);
    }

    public marketSellOrder(quantity: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order {
        this.assertQuantity(quantity);
        this.assertCancelAfter(timeInForce, cancelAfter);
        return this.createOrder(Side.SELL, OrderType.MARKET, undefined, quantity, undefined, timeInForce, undefined, cancelAfter);
    }

    public limitBuyOrder(limitPrice: number, funds: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order {
        this.assertFunds(funds);
        this.assertPrice(limitPrice);
        this.assertCancelAfter(timeInForce, cancelAfter);
        return this.createOrder(Side.BUY, OrderType.LIMIT, funds, undefined, limitPrice, timeInForce, undefined, cancelAfter);
    }

    public limitSellOrder(limitPrice: number, quantity: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order {
        this.assertQuantity(quantity);
        this.assertCancelAfter(timeInForce, cancelAfter);
        return this.createOrder(Side.SELL, OrderType.LIMIT, undefined, quantity, limitPrice, timeInForce, undefined, cancelAfter);
    }

    public stopEntryOrder(stopPrice: number, funds: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order {
        this.assertFunds(funds);
        this.assertCancelAfter(timeInForce, cancelAfter);
        return this.createOrder(Side.BUY, OrderType.MARKET, funds, undefined, stopPrice, timeInForce, Stop.ENTRY, cancelAfter);
    }

    public stopLossOrder(stopPrice: number, quantity: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order {
        this.assertQuantity(quantity);
        this.assertPrice(stopPrice);
        this.assertCancelAfter(timeInForce, cancelAfter);
        return this.createOrder(Side.SELL, OrderType.MARKET, undefined, quantity, stopPrice, timeInForce, Stop.LOSS, cancelAfter);
    }

    public cancelOrder(id: string): void {
        this.orderManager.cancelOrder(id, this.currentTradeTimestamp);
    }

    public cancelAllOrders(): void {
        this.orderManager.cancelAllOrders(this.currentTradeTimestamp);
    }

    public getAllOrders(): Order[] {
        return this.orderManager.getActiveOrders();
    }

    public getAllTrades(): Trade[] {
        return this.orderManager.getAllTrades();
    }

    public getAccount(): Account {
        return this.account;
    }

    private createOrder(
        side: Side,
        type: OrderType,
        funds?: number,
        quantity?: number,
        price?: number,
        timeInForce: TimeInForce = TimeInForce.GOOD_TILL_CANCEL,
        stop?: Stop,
        cancelAfter?: Date,
    ): Order {
        const order: Order = {
            id: randomUUID(),
            side,
            type,
            funds,
            quantity,
            price,
            stop,
            stopPrice: stop ? price : undefined,
            timeInForce,
            expireTime: timeInForce === TimeInForce.GOOD_TILL_TIME && cancelAfter !== undefined ? cancelAfter : undefined,
            createdAt: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        };

        this.orderManager.addOrder(order);
        return order;
    }

    private assertFunds(funds: number): void {
        assert(funds > 0, 'Funds must be greater than 0.');
        assert(funds + this.account.fee <= this.account.balance, 'There is not enough funds in the account.');
    }

    private assertQuantity(quantity: number): void {
        assert(quantity > 0, 'Quantity must be greater than 0.');
        assert(quantity <= this.account.productQuantity, 'There is not enough product quantity to sell.');
    }

    private assertPrice(price: number): void {
        assert(price > 0, 'Price must be greater than 0.');
    }

    private assertCancelAfter(timeInForce?: TimeInForce, cancelAfter?: Date) {
        if (timeInForce === TimeInForce.GOOD_TILL_TIME) {
            assert(cancelAfter !== undefined, 'There is not an expiration date for GOOD_TILL_TIME time in force.');
        }
    }
}
