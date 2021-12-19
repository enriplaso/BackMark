import { Order, OrderStatus, OrderType, Side, TimeInForce } from './IExchangeClient';
import { v1 as uuidv1 } from 'uuid';
import { IExchangeSimulator } from './IExchangeSImulator';

export class ExchangeSimulator implements IExchangeSimulator {
    private orders: Array<Order> = [];
    private closedOrders: Array<Order> = [];
    private productCuantity = 0;

    constructor(private accountFunds, private fee = 1) { }

    public processOrders(price: number) {
        for (let i = this.orders.length; i > 0; i--) {
            switch (this.orders[i].type) {
                case OrderType.MARKET:
                    if (this.orders[i].side === Side.BUY) {
                        this.accountFunds = this.accountFunds - this.orders[i].funds - this.fee;
                        this.productCuantity = this.productCuantity + (this.orders[i].funds - this.fee) / price;
                    }
                    if (this.orders[i].side === Side.SELL) {
                        this.accountFunds = this.accountFunds + price - this.fee;
                        this.productCuantity = this.productCuantity - (this.orders[i].funds - this.fee) / price;
                    }
                    this.orders[i].status = OrderStatus.DONE;

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
        if ((funds + this.fee) > this.accountFunds) {
            throw new Error("There is not enough funds in the account");
        }
        const order = {
            id: uuidv1(),
            productId,
            side: Side.BUY,
            funds,
            type: OrderType.MARKET,
            time_in_force: TimeInForce.GOOD_TILL_CANCEL,
            created_at: new Date(),
            status: OrderStatus.RECEIVED
        } as Order;

        this.orders.push(order);
        return order;
    }

    public async marketSellOrder(productId: string, size: number): Promise<Order> {
        if (size < 0) {
            throw new Error("");
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
}
