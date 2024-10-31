import { ITradingData } from './trade.js';

export interface IStrategy {
    checkPosition(tradingData: ITradingData): Promise<void>;
}
