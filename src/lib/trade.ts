export interface ITradingData {
    timestamp: number;
    price: number;
    volume?: number;
}

export interface ITrade {
    entryTime: number;
    entryPrice: number;
    closeTime?: number;
    closePrice?: number;
    netProfit?: number;
}