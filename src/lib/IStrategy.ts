import { TradingData } from './exchangeSimulator/types.js';

export interface IStrategy {
    checkPosition(tradingData: TradingData): Promise<void>;
}
