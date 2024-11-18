import type { Account, SimulationOptions, TradingData } from './types.js';
import type { IExchangeSimulator } from './IExchangeSImulator.js';
import type { Order, Trade } from '../orders/types.js';

import { OrderStatus, OrderType, Side, Stop, TimeInForce } from '../orders/types.js';
import { randomUUID } from 'crypto';
import { IOrderManager } from '../orders/IOrderManager.js';
import { OrderManager } from '../orders/orderManager.js';

export class ExchangeSimulator implements IExchangeSimulator {
    private account!: Account;
    private fee = 1.2; // TODO: Fee should be a percentage of the price e.g 1000 Usd -> 25 us 2.5

    constructor(
        private readonly options: SimulationOptions,
        private readonly orderManager: IOrderManager = new OrderManager(),
    ) {
        this.init();
        if (this.options.fee) {
            this.fee = this.options.fee;
        }
    }

    public init() {
        this.account = {
            id: randomUUID(),
            balance: this.options.accountBalance,
            holds: 0,
            available: this.options.accountBalance,
            currency: 'usd',
            productQuantity: 0,
            fee: this.options.fee || 1.5,
        };
    }
    //Every time a new price comes
    public processOrders(tradingdata: TradingData) {
        const orders = this.orderManager.getActiveOrders();

        for (const order of orders) {
            this.orderManager.processOrder(order, this.account, tradingdata);
        }
        /*
        const uncompletedOrders: Order[] = [];

        let order = this.orderManager.dequeueOrder(); //TODO: dequeue is not needed
        //TODO: cancel /close order should remove the order from the array
        while (order !== undefined) {
            const wasClosed = this.orderManager.processOrder(order, this.account, tradingdata);
            if (!wasClosed) {
                uncompletedOrders.push(order);
            }
            order = this.orderManager.dequeueOrder();
        }

        if (uncompletedOrders.length > 0) {
            for (const order of uncompletedOrders) {
                this.orderManager.pushOrder(order);
            }
        }*/
    }

    public marketBuyOrder(funds: number): Order {
        if (funds + this.fee > this.account.balance) {
            throw new Error('There is not enough funds in the account');
        }
        const order = {
            id: randomUUID(),
            side: Side.BUY,
            funds,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: null, // is not relevant for the simulator
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);
        return order;
    }

    public marketSellOrder(size: number): Order {
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
            timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            createdAt: new Date(),
            status: OrderStatus.RECEIVED,
        } as Order;

        this.orderManager.addOrder(order);

        return order;
    }
    public limitBuyOrder(price: number, funds: number): Order {
        if (funds + this.fee > this.account.balance) {
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
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            price,
            created_at: null, // is not relevant for the simulator
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);

        return order;
    }
    public limitSellOrder(price: number, size: number): Order {
        if (size <= 0) {
            throw new Error('Size must be a value greater than 0'); // TODO: refactor to Typescript assertions
        }

        if (size > this.account.productQuantity) {
            throw new Error('There is not enough amount of the current product to sell');
        }

        if (price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        const order = {
            id: randomUUID(),
            side: Side.SELL,
            quantity: size,
            type: OrderType.LIMIT,
            timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            createdAt: new Date(),
            status: OrderStatus.RECEIVED,
            price,
        } as Order;

        this.orderManager.addOrder(order);

        return order;
    }
    public stopEntryOrder(prize: number, funds: number): Order {
        if (funds + this.fee > this.account.balance) {
            throw new Error('There is not enough funds in the account');
        }
        const order = {
            id: randomUUID(),
            side: Side.BUY,
            stop: Stop.ENTRY,
            stop_price: prize,
            funds,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: null, // is not relevant for the simulator
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);
        return order;
    }
    public stopLossOrder(prize: number, size: number): Order {
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
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: null, // is not relevant for the simulator
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orderManager.addOrder(order);
        return order;
    }
    public cancelOrder(id: string): boolean {
        return this.orderManager.cancelOrder(id, new Date().getTime().toString());
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
        throw new Error('Method not implemented.');
    }
    public getAccount(): Account {
        return this.account;
    }
    public getProductSize(): number {
        return this.account.productQuantity;
    }
    public setProductSize(size: number) {
        this.account.productQuantity = size;
    }
}
