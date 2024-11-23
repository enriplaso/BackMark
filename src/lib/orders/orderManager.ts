import type { Account, TradingData } from '../exchangeSimulator/types.js';
import type { IOrderManager } from './IOrderManager.js';
import { type Order, OrderStatus, OrderType, Side, TimeInForce, Trade } from './types.js';

export class OrderManager implements IOrderManager {
    private orders: Order[] = [];
    private closedOrders: Order[] = [];
    private trades: Trade[] = [];

    public addOrder(order: Order): void {
        this.orders.push(order);
    }

    public getActiveOrders(): Order[] {
        return this.orders;
    }

    public getClosedOrders(): Order[] {
        return this.closedOrders;
    }

    public getAllTrades(): Trade[] {
        return this.trades;
    }

    public cancelOrder(orderId: string, timestamp: string): boolean {
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

    public processOrder(order: Order, account: Account, tradingData: TradingData): void {
        if (this.shouldExecuteOrder(order, tradingData)) {
            if (order.side === Side.BUY) {
                if (order.stop) {
                    order.stop = undefined; // Becomes a Market order
                }
                return this.executeBuyOrder(order, account, tradingData);
            }

            if (order.side === Side.SELL) {
                if (order.stop) {
                    order.stop = undefined; // Becomes a Market order
                }
                return this.executeSellOrder(order, account, tradingData);
            }
        }
    }

    //TODO: Stop Entry and stop loss are different , please check for buy and sell
    // IMPORTANT AND CHECK: Buy stop loss and Sell Stop Entry are not supported since simulator does not manage shorts
    private shouldExecuteOrder(order: Order, tradingData: TradingData): boolean {
        return (
            (order.type === OrderType.MARKET && order.stop === undefined) ||
            (order.type === OrderType.MARKET && order.stop !== undefined && tradingData.price <= order.stopPrice!) ||
            (order.side === Side.BUY && order.type === OrderType.LIMIT && tradingData.price <= order.price!) ||
            (order.side === Side.SELL && order.type === OrderType.LIMIT && tradingData.price >= order.price!)
        );
    }

    private calculateFee(funds: number, fee: number): number {
        return funds / (fee * 100);
    }

    private closeOrder(order: Order, doneAt: number): void {
        order.status = OrderStatus.DONE;
        order.doneAt = new Date(doneAt);
        this.closedOrders.push(order);

        const index = this.orders.findIndex((activeOrder) => order.id === activeOrder.id);
        this.orders.splice(index, 1);
    }

    private executeBuyOrder(order: Order, account: Account, tradingData: TradingData): void {
        const buyOrderFee = this.calculateFee(order.funds!, account.fee);
        const maxQuantity = (order.funds! - buyOrderFee) / tradingData.price;

        if (tradingData.volume >= maxQuantity) {
            account.productQuantity += maxQuantity;
            const tradeTotalPrice = order.funds! + buyOrderFee;
            account.balance -= tradeTotalPrice;
            this.trades.push({
                orderId: order.id,
                price: tradeTotalPrice,
                quantity: maxQuantity,
                createdAt: new Date(tradingData.timestamp),
                side: order.side,
                balanceAfterTrade: account.balance,
                holdingsAfterTrade: account.productQuantity,
            });

            this.closeOrder(order, tradingData.timestamp);
            return;
        }

        const shouldContinue = this.checkTimeInForce(order, tradingData);

        if (!shouldContinue) {
            return;
        }

        // Recalculate fee based on trade
        const tradePrice = tradingData.volume * tradingData.price;
        const tradeFee = this.calculateFee(tradePrice, account.fee);
        const tradeTotalPrice = tradePrice + tradeFee;
        account.productQuantity += tradingData.volume;
        account.balance -= tradeTotalPrice;

        this.trades.push({
            orderId: order.id,
            price: tradeTotalPrice,
            quantity: tradingData.volume,
            createdAt: new Date(tradingData.timestamp),
            side: order.side,
            balanceAfterTrade: account.balance,
            holdingsAfterTrade: account.productQuantity,
        });

        if (order.timeInForce === TimeInForce.INMEDIATE_OR_CANCELL) {
            this.closeOrder(order, tradingData.timestamp);
            return;
        }

        order.funds! -= tradePrice; // adjust order after trade
    }

    private executeSellOrder(order: Order, account: Account, tradingData: TradingData): void {
        if (tradingData.volume - order.quantity! >= 0) {
            const sellOrderFee = this.calculateFee(order.quantity! * tradingData.price, account.fee);
            const tradeEarings = order.quantity! * tradingData.price - sellOrderFee;
            account.balance += tradeEarings;
            account.productQuantity -= order.quantity!;

            this.trades.push({
                orderId: order.id,
                price: tradeEarings,
                quantity: order.quantity!,
                createdAt: new Date(tradingData.timestamp),
                side: order.side,
                balanceAfterTrade: account.balance,
                holdingsAfterTrade: account.productQuantity,
            });

            this.closeOrder(order, tradingData.timestamp);
            return;
        }

        const shouldContinue = this.checkTimeInForce(order, tradingData);

        if (!shouldContinue) {
            return;
        }

        const sellTradeFee = this.calculateFee(tradingData.volume * tradingData.price, account.fee);
        const tradeEarings = tradingData.volume * tradingData.price - sellTradeFee;
        account.balance += tradeEarings;
        account.productQuantity -= tradingData.volume;

        this.trades.push({
            orderId: order.id,
            price: tradeEarings,
            quantity: tradingData.volume, // cannot sell more than the available volume !!!
            createdAt: new Date(tradingData.timestamp),
            side: order.side,
            balanceAfterTrade: account.balance,
            holdingsAfterTrade: account.productQuantity,
        });

        if (order.timeInForce === TimeInForce.INMEDIATE_OR_CANCELL) {
            this.closeOrder(order, tradingData.timestamp);
            return;
        }

        order.quantity! -= tradingData.volume; // remaining volume for hte order
    }

    private checkTimeInForce(order: Order, tradingData: TradingData): boolean {
        let shouldContinue = true;
        switch (order.timeInForce) {
            case TimeInForce.GOOD_TILL_CANCEL: // default
                break; // continue
            case TimeInForce.FILL_OR_KILL:
                this.closeOrder(order, tradingData.timestamp);
                shouldContinue = false;
                break;
            case TimeInForce.INMEDIATE_OR_CANCELL:
                break;
            case TimeInForce.GOOD_TILL_TIME:
                if (order.expireTime && order?.expireTime?.getTime() >= tradingData.timestamp) {
                    this.closeOrder(order, tradingData.timestamp);
                    shouldContinue = false;
                }
                break;
        }

        return shouldContinue;
    }
}
