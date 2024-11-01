import type { TradingData } from './types.js';
import type { IExchangeClient } from './IExchangeClient.js';

export interface IExchangeSimulator extends IExchangeClient {
    /**
     *
     * @param tradingData
     */
    processOrders(tradingData: TradingData): void;

    setProductSize(size: number): void;
}

//https://usenobi.com/blog/how-to-understand-backtest-result/
