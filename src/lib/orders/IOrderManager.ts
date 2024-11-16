import { Account, TradingData } from '../exchangeSimulator/types.js';
import type { Order, Trade } from './types.js';

export interface IOrderManager {
    addOrder(order: Order): void;
    getOrders(): Order[]; // Active orders
    dequeue(): Order | undefined;
    getClosedOrders(): Order[];
    cancelOrder(orderId: string, timestamp: string): boolean;
    getTrades(): Trade[];
    processOrder(order: Order, account: Account, tradingData: TradingData): boolean;
}
