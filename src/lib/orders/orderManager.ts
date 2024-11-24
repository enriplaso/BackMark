import type { Account, TradingData } from '../exchange/types.js';
import type { IOrderManager } from './IOrderManager.js';
import { type Order, OrderStatus, OrderType, Side, Stop, TimeInForce, Trade } from './types.js';

export class OrderManager implements IOrderManager {
    private orders: Order[] = [];
    private closedOrders: Order[] = [];
    private trades: Trade[] = [];

    public addOrder(order: Order): void {
        this.orders.push(order);
    }

    public getActiveOrders(): Order[] {
        return [...this.orders]; // Return a copy to prevent external mutation
    }

    public getClosedOrders(): Order[] {
        return [...this.closedOrders];
    }

    public getAllTrades(): Trade[] {
        return [...this.trades];
    }

    public getOrderById(orderId: string): Order | undefined {
        return this.orders.find((order) => order.id === orderId) ?? this.closedOrders.find((order) => order.id === orderId);
    }

    public cancelOrder(orderId: string, timestamp: number): void {
        const index = this.orders.findIndex((order) => orderId === order.id);
        if (index === -1) {
            console.warn(`Order not found: ${orderId}`);
            return;
        }
        const order = this.orders[index];
        this.closeOrder(order, timestamp, 'Cancelled');
    }

    public cancelAllOrders(timestamp: number): void {
        [...this.orders].forEach((order) => {
            this.closeOrder(order, timestamp, 'Cancelled');
        });
    }

    public processOrder(order: Order, account: Account, tradingData: TradingData): void {
        if (!this.shouldExecuteOrder(order, tradingData)) {
            return;
        }

        this.transformStopToMarketOrder(order);

        if (order.side === Side.BUY) {
            this.executeBuyOrder(order, account, tradingData);
        } else if (order.side === Side.SELL) {
            this.executeSellOrder(order, account, tradingData);
        }
    }

    // IMPORTANT: Buy stop loss and Sell Stop Entry are not supported since simulator does not handle shorts
    private shouldExecuteOrder(order: Order, tradingData: TradingData): boolean {
        return (
            (order.type === OrderType.MARKET && order.stop === undefined) ||
            (order.stop == Stop.LOSS && tradingData.price <= order.stopPrice!) ||
            (order.stop == Stop.ENTRY && tradingData.price >= order.stopPrice!) ||
            (order.side === Side.BUY && order.type === OrderType.LIMIT && tradingData.price <= order.price!) ||
            (order.side === Side.SELL && order.type === OrderType.LIMIT && tradingData.price >= order.price!)
        );
    }

    private calculateFee(funds: number, fee: number): number {
        return (fee / 100) * funds;
    }

    private closeOrder(order: Order, timestamp: number, reason: string): void {
        order.status = OrderStatus.DONE;
        order.doneAt = new Date(timestamp);
        order.doneReason = reason;
        this.closedOrders.push(order);

        const index = this.orders.findIndex((activeOrder) => order.id === activeOrder.id);
        if (index !== -1) {
            this.orders.splice(index, 1);
        }
    }

    private executeBuyOrder(order: Order, account: Account, tradingData: TradingData): void {
        const tradeFunds = Math.min(order.funds!, tradingData.volume * tradingData.price);

        if (order.timeInForce === TimeInForce.FILL_OR_KILL && tradeFunds !== order.funds!) {
            this.closeOrder(order, tradingData.timestamp, 'Cancelled');
            return;
        }

        const fee = this.calculateFee(tradeFunds, account.fee);
        const quantityBought = (tradeFunds - fee) / tradingData.price;

        if (account.balance < tradeFunds) {
            console.warn(`Insufficient balance for order: ${order.id}`);
            return;
        }

        const finalPrice = tradeFunds + fee;

        account.balance -= finalPrice;
        account.productQuantity += quantityBought;

        this.recordTrade(order, finalPrice, quantityBought, account, tradingData.timestamp);

        order.funds! -= finalPrice;

        if (order.funds! <= 0) {
            this.closeOrder(order, tradingData.timestamp, 'Filled');
        }

        this.checkTimeInForce(order, tradingData);
    }

    private executeSellOrder(order: Order, account: Account, tradingData: TradingData): void {
        if (account.productQuantity < order.quantity!) {
            console.warn(`Insufficient quantity for order: ${order.id}`);
            return;
        }

        const quantitySold = Math.min(order.quantity!, tradingData.volume);

        if (order.timeInForce === TimeInForce.FILL_OR_KILL && quantitySold !== order.quantity!) {
            this.closeOrder(order, tradingData.timestamp, 'Cancelled');
            return;
        }

        const tradeEarnings = quantitySold * tradingData.price;
        const fee = this.calculateFee(tradeEarnings, account.fee);

        const finalEarnings = tradeEarnings - fee;

        account.balance += finalEarnings;
        account.productQuantity -= quantitySold;

        this.recordTrade(order, finalEarnings, quantitySold, account, tradingData.timestamp);

        order.quantity! -= quantitySold;

        if (order.quantity! <= 0) {
            this.closeOrder(order, tradingData.timestamp, 'Filled');
        }

        this.checkTimeInForce(order, tradingData);
    }

    //TODO: Refactora
    private checkTimeInForce(order: Order, tradingData: TradingData): boolean {
        switch (order.timeInForce) {
            case TimeInForce.GOOD_TILL_CANCEL:
                return true;
            case TimeInForce.FILL_OR_KILL:
                this.closeOrder(order, tradingData.timestamp, 'Cancelled');
                return false;
            case TimeInForce.INMEDIATE_OR_CANCELL:
                this.closeOrder(order, tradingData.timestamp, 'Partially Filled');
                return false;
            case TimeInForce.GOOD_TILL_TIME:
                if (order.expireTime && order.expireTime.getTime() <= tradingData.timestamp) {
                    this.closeOrder(order, tradingData.timestamp, 'Expired');
                    return false;
                }
        }

        return true;
    }

    private transformStopToMarketOrder(order: Order): void {
        if (order.stop) {
            order.type = OrderType.MARKET;
            order.stop = undefined;
        }
    }

    private recordTrade(order: Order, price: number, quantity: number, account: Account, timestamp: number): void {
        this.trades.push({
            orderId: order.id,
            price,
            quantity,
            createdAt: new Date(timestamp),
            side: order.side,
            balanceAfterTrade: account.balance,
            holdingsAfterTrade: account.productQuantity,
        });
    }
}
