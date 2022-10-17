import { ITradingData } from '../lib/trade';

export interface IStrategy {
    checkPosition(tradingData: ITradingData): Promise<void>;
}
