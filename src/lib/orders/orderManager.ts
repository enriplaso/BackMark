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
                closed = this.triggerBuyOrder(order, account, tradingData);
            }

            if (order.type === OrderType.MARKET && order.stop === Stop.ENTRY && tradingData.price <= order.stopPrice!) {
                // Once triggered stop order is converted in a Market order
                order.stop = undefined;
                closed = this.triggerBuyOrder(order, account, tradingData);
            }

            if (order.type === OrderType.LIMIT && tradingData.price <= order.price!) {
                closed = this.triggerBuyOrder(order, account, tradingData);
            }
        }

        if (order.side === Side.SELL) {
            if (order.type === OrderType.MARKET && order.stop === undefined) {
                closed = this.triggerSellOrder(order, account, tradingData);
            }
            if (order.type === OrderType.MARKET && order.stop === Stop.LOSS && tradingData.price <= order.stopPrice!) {
                // Convert STOP to simple MARKET
                order.stop = undefined;
                closed = this.triggerSellOrder(order, account, tradingData);
            }

            if (order.type === OrderType.LIMIT && tradingData.price >= order.price!) {
                closed = this.triggerSellOrder(order, account, tradingData);
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

    private triggerBuyOrder(order: Order, account: Account, tradingData: TradingData): boolean {
        let closed = false;

        const buyOrderFee = this.calculateFee(order.funds!, account.fee);
        const maxQuantity = (order.funds! - buyOrderFee) / tradingData.price;

        if (tradingData.volume >= maxQuantity) {
            account.productQuantity += maxQuantity;
            account.balance -= order.funds!;
            this.trades.push({
                orderId: order.id,
                price: tradingData.price,
                quantity: maxQuantity,
                createdAt: new Date(tradingData.timestamp),
                side: order.side,
            });

            this.closeOrder(order, new Date(tradingData.timestamp));
            closed = true;
        } else {
            const spentFunds = tradingData.volume * tradingData.price + buyOrderFee;
            account.productQuantity += tradingData.volume;
            account.balance -= spentFunds;

            this.trades.push({
                orderId: order.id,
                price: tradingData.price,
                quantity: tradingData.volume,
                createdAt: new Date(tradingData.timestamp),
                side: order.side,
            });
        }

        return closed;
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
