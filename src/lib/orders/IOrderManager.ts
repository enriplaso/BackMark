import { Account, TradingData } from '../exchangeSimulator/types.js';
import type { Order, Trade } from './types.js';

export interface IOrderManager {
    addOrder(order: Order): void;
    getActiveOrders(): Order[];
    getClosedOrders(): Order[];
    cancelOrder(orderId: string, timestamp: string): boolean;
    getAllTrades(): Trade[];
    processOrder(order: Order, account: Account, tradingData: TradingData): void;
}
