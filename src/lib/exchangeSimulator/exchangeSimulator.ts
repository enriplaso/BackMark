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
        if (!this.account) {
            this.init();
        }
        for (let i = this.orders.length - 1; i >= 0; i--) {
            switch (this.orders[i].type) {
                case OrderType.MARKET:
                    if (this.orders[i].side === Side.BUY) {
                        this.account.balance = this.account.balance - this.orders[i].funds! - this.fee;
                        this.productQuantity = this.productQuantity + (this.orders[i].funds! - this.fee) / tradingdata.price;
                        if (this.currentTrade) {
                            this.currentTrade.entryPrice = this.currentTrade.entryPrice + tradingdata.price;
                        } else {
                            this.currentTrade = {
                                orderId: this.orders[i].id,
                                entryTime: tradingdata.timestamp,
                                entryPrice: tradingdata.price,
                            };
                        }
                    }
                    if (this.orders[i].side === Side.SELL) {
                        this.account.balance = this.account.balance + this.orders[i].size! * tradingdata.price - this.fee;
                        this.productQuantity = this.productQuantity - this.orders[i].size!;
                        // trade
                        if (this.currentTrade) {
                            this.currentTrade.closePrice = tradingdata.price;
                            this.currentTrade.closeTime = tradingdata.timestamp;
                            this.currentTrade.netProfit = 30;
                            this.trades.push(this.currentTrade);
                            this.currentTrade = null;
                        }
                    }
                    this.orders[i].status = OrderStatus.DONE;
                    this.orders[i].done_at = new Date(tradingdata.timestamp);

                    this.closedOrders.push(this.orders[i]);

                    this.orders.splice(i, 1);
                    break;
                case OrderType.LIMIT:
                    break;
                default:
                    break;
            }
        }
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
}
