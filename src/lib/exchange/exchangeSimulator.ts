import type { Account, SimulationOptions, TradingData } from './types.js';
import type { IExchangeSimulator } from './IExchangeSImulator.js';
import type { Order, Trade } from '../orders/types.js';

import { OrderStatus, OrderType, Side, Stop, TimeInForce } from '../orders/types.js';
import { randomUUID } from 'crypto';
import { IOrderManager } from '../orders/IOrderManager.js';
import { OrderManager } from '../orders/orderManager.js';

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
            productQuantity: 0,
            fee: this.options.fee || 0,
        };
    }

    public processOrders(tradingData: TradingData) {
        this.currentTradeTimestamp = tradingData.timestamp;
        const orders = this.orderManager.getActiveOrders();
        for (const order of orders) {
            this.orderManager.processOrder(order, this.account, tradingData);
        }
    }

    public marketBuyOrder(funds: number, timeInForce?: TimeInForce): Order {
        if (funds + this.account.fee > this.account.balance) {
            throw new Error('There is not enough funds in the account');
        }
        const order: Order = {
            id: randomUUID(),
            side: Side.BUY,
            funds,
            type: OrderType.MARKET,
            timeInForce: timeInForce || TimeInForce.GOOD_TILL_CANCEL,
            createdAt: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        };

        this.orderManager.addOrder(order);
        return order;
    }

    public marketSellOrder(size: number, timeInForce?: TimeInForce): Order {
        if (size <= 0) {
            throw new Error('Size must be a value greater than 0');
        }
        if (size > this.account.productQuantity) {
            throw new Error('There is not enough amount of the current product to sell');
        }
        const order = {
            id: randomUUID(),
            side: Side.SELL,
            quantity: size,
            type: OrderType.MARKET,
            timeInForce: timeInForce || TimeInForce.GOOD_TILL_CANCEL,
            createdAt: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        } as Order;

        this.orderManager.addOrder(order);

        return order;
    }
    public limitBuyOrder(price: number, funds: number, timeInForce?: TimeInForce): Order {
        if (funds + this.account.fee > this.account.balance) {
            throw new Error('There is not enough funds in the account');
        }
        if (price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        const order = {
            id: randomUUID(),
            side: Side.BUY,
            funds,
            type: OrderType.LIMIT,
            time_in_force: timeInForce || TimeInForce.GOOD_TILL_CANCEL,
            price,
            created_at: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);

        return order;
    }

    public stopEntryOrder(prize: number, funds: number, timeInForce?: TimeInForce): Order {
        if (funds + this.account.fee > this.account.balance) {
            throw new Error('There is not enough funds in the account');
        }
        const order = {
            id: randomUUID(),
            side: Side.BUY,
            stop: Stop.ENTRY,
            stop_price: prize,
            funds,
            type: OrderType.MARKET,
            time_in_force: timeInForce || TimeInForce.GOOD_TILL_CANCEL,
            created_at: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);
        return order;
    }
    public stopLossOrder(prize: number, size: number, timeInForce?: TimeInForce): Order {
        if (size <= 0) {
            throw new Error('Size must be a value greater than 0');
        }

        if (size > this.account.productQuantity) {
            throw new Error('There is not enough amount of the current product to sell');
        }

        if (prize <= 0) {
            throw new Error('Price must be greater than 0');
        }
        const order = {
            id: randomUUID(),
            side: Side.SELL,
            stop: Stop.LOSS,
            stop_price: prize,
            size,
            type: OrderType.MARKET,
            time_in_force: timeInForce || TimeInForce.GOOD_TILL_CANCEL,
            created_at: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);
        return order;
    }
    public cancelOrder(id: string): void {
        this.orderManager.cancelOrder(id, this.currentTradeTimestamp);
    }

    public getAllOrders(filter?: OrderStatus[]): Order[] {
        const orders = this.orderManager.getActiveOrders();
        if (filter && filter?.length > 0) {
            return orders.filter((order) => filter?.includes(order.status));
        }
        return orders;
    }
    public getAllTrades(): Trade[] {
        return this.orderManager.getAllTrades();
    }
    public cancelAllOrders() {
        this.orderManager.cancelAllOrders(this.currentTradeTimestamp);
    }
    public getAccount(): Account {
        return this.account;
    }
}
