import type { TradingData } from './types.js';
import type { IExchangeClient } from './IExchangeClient.js';

export interface IExchangeSimulator extends IExchangeClient {
    processOrders(tradingData: TradingData): void;
}
