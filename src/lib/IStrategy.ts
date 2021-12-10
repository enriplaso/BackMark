import { ITradingData } from './models/ITradingData';

export interface IStrategy {
    checkPosition(tradingData: ITradingData): Promise<void>;
}
