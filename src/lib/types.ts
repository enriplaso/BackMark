import { Trade } from './orders/types.js';

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
    accountBalance: number;
    fee: number;
    productName?: string;
};
