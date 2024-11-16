import type { Account, TradingData } from '../exchangeSimulator/types.js';
import type { IOrderManager } from './IOrderManager.js';
import { type Order, OrderStatus, OrderType, Side, Stop, Trade } from './types.js';

export class OrderManager implements IOrderManager {
    private orders: Order[] = [];
    private closedOrders: Order[] = [];
    private trades: Trade[] = [];

    constructor() {}

    pushOrder(order: Order): void {
        this.orders.push(order);
    }
    getActiveOrders(): Order[] {
        return this.orders;
    }
    dequeueOrder(): Order | undefined {
        return this.orders.shift();
    }
    getClosedOrders(): Order[] {
        return this.closedOrders;
    }
    cancelOrder(orderId: string, timestamp: string): boolean {
        const index = this.orders.findIndex((order) => orderId === order.id);
        if (index === -1) {
            return false;
        }
        const order = this.orders[index];
        order.doneAt = new Date(timestamp);
        order.doneReason = 'Cancelled';
        order.status = OrderStatus.DONE;
        this.closedOrders.push(order);

        this.orders.splice(index, 1); // Remove order form  active orders
        return true;
    }
    getAllTrades(): Trade[] {
        return this.trades;
    }
    processOrder(order: Order, account: Account, tradingData: TradingData): boolean {
        let closed = false;

        if (order.side === Side.BUY) {
            if (order.type === OrderType.MARKET && order.stop === undefined) {
                const buyOderFee = this.calculateFee(order.funds!, account.fee); // FIXME: calculate based on trades and not in order
                const wantedProductQuantity = (order.funds! - buyOderFee) / tradingData.price;

                // Open a trade

                if (tradingData.volume - wantedProductQuantity >= 0) {
                    account.productQuantity = account.productQuantity + wantedProductQuantity;
                    this.trades.push({
                        orderId: order.id,
                        price: tradingData.price,
                        quantity: wantedProductQuantity,
                        createdAt: new Date(tradingData.timestamp),
                        side: order.side,
                    });
                    account.balance = account.balance - order.funds! - buyOderFee;

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

                    account.productQuantity = account.productQuantity + tradingData.volume;
                    const tradePrice = tradingData.price * tradingData.volume - buyOderFee;
                    account.balance = account.balance - tradePrice;
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
                closed = this.triggerSellOrder(order, account, tradingData);
            }
            if (order.type === OrderType.MARKET && order.stop === Stop.LOSS && tradingData.price <= order.stopPrice!) {
                closed = this.triggerSellOrder(order, account, tradingData);
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

        const index = this.orders.findIndex((activeOrder) => order.id === activeOrder.id);
        this.orders.splice(index, 1);
    }

    private triggerSellOrder(order: Order, account: Account, tradingData: TradingData): boolean {
        let closed = false;
        if (tradingData.volume - order.quantity >= 0) {
            const sellOrderFee = this.calculateFee(order.quantity * tradingData.price, account.fee); // FIXME: calculate based on trades and not in order
            account.balance = account.balance + order.quantity * tradingData.price - sellOrderFee;
            account.productQuantity = account.productQuantity - order.quantity;

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

            const sellOrderFee = this.calculateFee(tradingData.volume * tradingData.price, account.fee);
            account.balance = account.balance + tradingData.volume * tradingData.price - sellOrderFee;
            account.productQuantity = account.productQuantity - tradingData.volume;

            order.quantity = order.quantity - tradingData.volume;
        }
        return closed;
    }
}
