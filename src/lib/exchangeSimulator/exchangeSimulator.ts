import type { Account, Order, SimulationOptions } from './types.js';
import type { IExchangeSimulator } from './IExchangeSImulator.js';
import type { Trade, TradingData } from './types.js';
import { OrderStatus, OrderType, Side, Stop, TimeInForce } from './types.js';
import { randomUUID } from 'crypto';

export class ExchangeSimulator implements IExchangeSimulator {
    private orders: Order[] = [];
    private trades: Trade[] = [];
    private closedOrders: Order[] = [];
    private account!: Account;
    private productQuantity = 0; //E.G Bitcoin quantity
    private currentTrade: Trade | undefined | null;
    private fee = 2.5; // TODO: Fee should be a percentage of the price e.g 1000 Usd -> 25 us

    constructor(private options: SimulationOptions) {
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
        };
    }

    public processOrders(tradingdata: TradingData) {
        const uncompleteOrders: Order[] = [];

        let order = this.orders.shift();
        while (order !== undefined) {
            const wasClosed = this.processOrder(order, tradingdata);
            if (!wasClosed) {
                uncompleteOrders.push(order);
            }

            order = this.orders.shift();
        }

        // this.orders = uncompleteOrders.concat(this.orders);
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

        this.orders.push(order);
        return order;
    }

    public marketSellOrder(size: number): Order {
        if (size <= 0) {
            throw new Error('Size must be a value greater than 0');
        }
        if (size > this.productQuantity) {
            throw new Error('There is not enough amount of the current product to sell');
        }
        const order = {
            id: randomUUID(),
            side: Side.SELL,
            size,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: new Date(),
            status: OrderStatus.RECEIVED,
        } as Order;

        this.orders.push(order);

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

        this.orders.push(order);

        return order;
    }
    public limitSellOrder(price: number, size: number): Order {
        if (size <= 0) {
            throw new Error('Size must be a value greater than 0'); // TODO: refactor to Typescript assertions
        }

        if (size > this.productQuantity) {
            throw new Error('There is not enough amount of the current product to sell');
        }

        if (price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        const order = {
            id: randomUUID(),
            side: Side.SELL,
            size,
            type: OrderType.LIMIT,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: new Date(),
            status: OrderStatus.RECEIVED,
            price,
        } as Order;

        this.orders.push(order);

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

        this.orders.push(order);
        return order;
    }
    public stopLossOrder(prize: number, size: number): Order {
        if (size <= 0) {
            throw new Error('Size must be a value greater than 0');
        }

        if (size > this.productQuantity) {
            throw new Error('There is not enough amount of the current product to sell');
        }

        if (prize <= 0) {
            throw new Error('Price must be greater than 0');
        }
        const order = {
            id: randomUUID(),
            side: Side.BUY,
            stop: Stop.LOSS,
            stop_price: prize,
            size,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: null, // is not relevant for the simulator
            status: OrderStatus.RECEIVED,
        } as unknown as Order;

        this.orders.push(order);
        return order;
    }
    public cancelOrder(id: string): boolean {
        const found = this.orders.find((order) => order.id === id);
        if (found === undefined) {
            return false;
        }
        found.status = OrderStatus.DONE;

        return true;
    }

    public getAllOrders(filter?: OrderStatus[]): Order[] {
        if (filter && filter?.length > 0) {
            return this.orders.filter((order) => filter?.includes(order.status));
        }
        return this.orders;
    }
    public getAllTrades(): Trade[] {
        return this.trades;
    }
    public cancelAllOrders() {
        throw new Error('Method not implemented.');
    }
    public getAccount(): Account {
        return this.account;
    }
    public getProductSize(): number {
        return this.productQuantity;
    }
    public setProductSize(size: number) {
        this.productQuantity = size;
    }

    private processOrder(order: Order, tradingdata: TradingData): boolean {
        let closed = false;
        if (order.type === OrderType.MARKET) {
            if (order.side === Side.BUY) {
                this.account.balance = this.account.balance - order.funds! - this.fee;
                this.productQuantity = this.productQuantity + (order.funds! - this.fee) / tradingdata.price;
            }

            if (order.side === Side.SELL) {
                this.account.balance = this.account.balance + order.size! * tradingdata.price - this.fee;
                this.productQuantity = this.productQuantity - order.size!;
            }
        }

        if (order.type === OrderType.LIMIT) {
            if (order.side === Side.BUY) {
                throw new Error('not implementd');
            }

            if (order.side === Side.SELL) {
                throw new Error('not implementd');
            }
        }

        order.status = OrderStatus.DONE;
        order.done_at = new Date(tradingdata.timestamp);

        this.closedOrders.push(order);

        return closed;
    }
}
