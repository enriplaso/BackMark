export interface ITradingData {
    timestamp: number;
    price: number;
    volume?: number;
}

export interface ITrade {
    entryTime: Date;
    closeTime: Date;
    entryPrice: number;
    closePrice: number;
    netProfit: number;
}