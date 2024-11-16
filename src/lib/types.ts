import { Trade } from './exchangeSimulator/types';

export type BackTestResult = {
    product: string;
    finalHoldings: number;
    initialBalance: number;
    finalBalance: number;
    totalProfit: number;
    profitPercentage: number;
    tradeHistory: Trade[];
};

export type BackTestOptions = {
    startDate?: Date;
    endDate?: Date;
};
