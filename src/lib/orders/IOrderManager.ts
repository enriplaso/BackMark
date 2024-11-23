import { Account, TradingData } from '../exchange/types.js';
import type { Order, Trade } from './types.js';

export interface IOrderManager {
    addOrder(order: Order): void;
    getActiveOrders(): Order[];
    getClosedOrders(): Order[];
    cancelOrder(orderId: string, timestamp: number): void;
    cancelAllOrders(timestamp: number): void;
    getAllTrades(): Trade[];
    processOrder(order: Order, account: Account, tradingData: TradingData): void;
}
