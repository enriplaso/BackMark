import { IStrategy } from './IStrategy';
import { ITradingData } from './models/ITradingData';

export interface IBacktest {
    init();
    backTest(): Promise<void>;
}

export interface IBackTestResult {}
