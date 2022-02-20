import { Account, Order, OrderStatus, OrderType, Side, TimeInForce } from './IExchangeClient';
import { v1 as uuidv1 } from 'uuid';
import { IExchangeSimulator, Summary } from './IExchangeSImulator';
import { ITradingData } from './models/ITradingData';
import { getuid } from 'process';

export class ExchangeSimulator implements IExchangeSimulator {
    private orders: Array<Order> = [];
    private closedOrders: Array<Order> = [];
    private account: Account;
    private productQuantity = 0; //E.G Bitcoin quantity


    constructor(private balance: number, private fee = 1) { }

    public init() {
        this.account = {
            id: uuidv1(),
            balance: this.balance,
            holds: 0,
            available: this.balance,
            currency: "usd"
        }
    }

    getSumary(): Summary {
        throw new Error('Method not implemented.');
    }

    public processOrders(tradingdata: ITradingData) {
        if (!this.account) {
            this.init();
        }

        for (let i = this.orders.length; i > 0; i--) {
            switch (this.orders[i].type) {
                case OrderType.MARKET:
                    if (this.orders[i].side === Side.BUY) {
                        this.account.balance = this.account.balance - this.orders[i].funds - this.fee;
                        this.productQuantity = this.productQuantity + (this.orders[i].funds - this.fee) / tradingdata.price;
                    }
                    if (this.orders[i].side === Side.SELL) {
                        this.account.balance = this.account.balance + tradingdata.price - this.fee;
                        this.productQuantity = this.productQuantity - (this.orders[i].funds - this.fee) / tradingdata.price;
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

    public async marketBuyOrder(productId: string, funds: number): Promise<Order> {
        if ((funds + this.fee) > this.account.balance) {
            throw new Error("There is not enough funds in the account");
        }
        const order = {
            id: uuidv1(),
            productId,
            side: Side.BUY,
            funds,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: null, // is not relevant for the simulator
            status: OrderStatus.RECEIVED
        } as Order;

        this.orders.push(order);
        return order;
    }

    public async marketSellOrder(productId: string, size: number): Promise<Order> {
        if (size < 0) {
            throw new Error("Size must be a value greather than 0");
        }
        if (size > this.productQuantity) {
            throw new Error("There is not enough amount of the current product to sell")

        }
        const order = {
            id: uuidv1(),
            productId,
            side: Side.SELL,
            size,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: new Date(),
            status: OrderStatus.RECEIVED
        } as Order;

        this.orders.push(order);

        return order;
    }
    limitBuyOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    limitSellOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    stopEntryOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    stopLossOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    cancelOrder(id: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    getAllOrders(filter?: OrderStatus[], limit?: number): Promise<Order[]> {
        throw new Error('Method not implemented.');
    }
    cancellAllOrders() {
        throw new Error('Method not implemented.');
    }
    getAccount(id: string): Promise<Account> {
        throw new Error('Method not implemented.');
    }
    getAccountHisotory(id: string) {
        throw new Error('Method not implemented.');
    }
}

