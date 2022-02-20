import { IStrategy } from './IStrategy';
import { ITradingData } from './models/ITradingData';

export interface IBacktest {
    run(): Promise<void>;
}

export interface IBackTestResult { }

export interface BackTestOptions {
    startDate?: Date;
    endDate?: Date;
}