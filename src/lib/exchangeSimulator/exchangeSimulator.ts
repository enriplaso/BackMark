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
    // TODO: include in the account
    private productQuantity: number = 0; //E.G Bitcoin quantity
    private fee = 1.2; // TODO: Fee should be a percentage of the price e.g 1000 Usd -> 25 us 2.5

    constructor(private options: SimulationOptions) {
        this.init();
        if (this.options.fee) {
            this.fee = this.options.fee;
        }
        if (options.productQuantity !== undefined) {
            this.productQuantity = options.productQuantity;
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

        if (uncompleteOrders.length > 0) {
            this.orders = uncompleteOrders.concat(this.orders);
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
            quantity: size,
            type: OrderType.MARKET,
            timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            createdAt: new Date(),
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
            quantity: size,
            type: OrderType.LIMIT,
            timeInForce: TimeInForce.GOOD_TILL_CANCEL,
            createdAt: new Date(),
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
            side: Side.SELL,
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

    private processOrder(order: Order, tradingData: TradingData): boolean {
        let closed = false;

        if (order.side === Side.BUY) {
            if (order.type === OrderType.MARKET && order.stop === undefined) {
                const buyOderFee = this.calculateFee(order.funds!, this.fee); // FIXME: calculate based on trades and not in order
                const wantedProductQuantity = (order.funds! - buyOderFee) / tradingData.price;

                // Open a trade

                if (tradingData.volume - wantedProductQuantity >= 0) {
                    this.productQuantity = this.productQuantity + wantedProductQuantity;
                    this.trades.push({
                        orderId: order.id,
                        price: tradingData.price,
                        quantity: wantedProductQuantity,
                        createdAt: new Date(tradingData.timestamp),
                        side: order.side,
                    });
                    this.account.balance = this.account.balance - order.funds! - buyOderFee;

                    this.closeOrder(order, new Date(tradingData.timestamp));
                    closed = true;
                } else {
                    this.trades.push({
                        orderId: order.id,
                        price: tradingData.price,
                        quantity: tradingData.volume, // cannot buy more than the available volume !!!
                        createdAt: new Date(tradingData.timestamp),
                        side: order.side,
                    });

                    this.productQuantity = this.productQuantity + tradingData.volume;
                    const tradePrice = tradingData.price * tradingData.volume - buyOderFee;
                    this.account.balance = this.account.balance - tradePrice;
                    order.funds = order.funds! - tradePrice;
                }
            }

            if (order.type === OrderType.MARKET && order.stop === Stop.ENTRY) {
                //TODO:
            }

            if (order.type === OrderType.LIMIT) {
                // TODO:
            }
        }

        if (order.side === Side.SELL) {
            if (order.type === OrderType.MARKET && order.stop === undefined) {
                closed = this.triggerSellOrder(order, tradingData);
            }
            if (order.type === OrderType.MARKET && order.stop === Stop.LOSS && tradingData.price <= order.stopPrice!) {
                closed = this.triggerSellOrder(order, tradingData);
            }

            if (order.type === OrderType.LIMIT) {
                // TODO:
            }
        }

        return closed;
    }

    private calculateFee(funds: number, fee: number): number {
        return funds / (fee * 100);
    }

    private closeOrder(order: Order, doneAt: Date): void {
        order.status = OrderStatus.DONE;
        order.doneAt = doneAt;
        this.closedOrders.push(order);
    }

    private triggerSellOrder(order: Order, tradingData: TradingData): boolean {
        let closed = false;
        if (tradingData.volume - order.quantity >= 0) {
            const sellOrderFee = this.calculateFee(order.quantity * tradingData.price, this.fee); // FIXME: calculate based on trades and not in order
            this.account.balance = this.account.balance + order.quantity * tradingData.price - sellOrderFee;
            this.productQuantity = this.productQuantity - order.quantity;

            this.trades.push({
                // TODO :adde more info to Trade, if is a seel or buy maz
                orderId: order.id,
                price: tradingData.price,
                quantity: order.quantity,
                createdAt: new Date(tradingData.timestamp),
                side: order.side,
            });

            this.closeOrder(order, new Date(tradingData.timestamp));
            closed = true;
        } else {
            this.trades.push({
                orderId: order.id,
                price: tradingData.price,
                quantity: tradingData.volume, // cannot sell more than the available volume !!!
                createdAt: new Date(tradingData.timestamp),
                side: order.side,
            });

            const sellOrderFee = this.calculateFee(tradingData.volume * tradingData.price, this.fee);
            this.account.balance = this.account.balance + tradingData.volume * tradingData.price - sellOrderFee;
            this.productQuantity = this.productQuantity - tradingData.volume;

            order.quantity = order.quantity - tradingData.volume;
        }
        return closed;
    }
}
