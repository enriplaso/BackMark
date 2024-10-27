import { ITradingData } from './trade';

export interface IStrategy {
    checkPosition(tradingData: ITradingData): Promise<void>;
}
