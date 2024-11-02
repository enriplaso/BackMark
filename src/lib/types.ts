import { Trade } from './exchangeSimulator/types';

export type BackTestResult = {
    product: string;
    ProductSize: number;
    funds: number;
    earnings: number;
    trades: Trade[];
};

export type BackTestOptions = {
    startDate?: Date;
    endDate?: Date;
};
