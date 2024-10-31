import { IExchangeClient } from './IExchangeClient.js';
import { ITradingData } from './trade.js';

export interface IExchangeSimulator extends IExchangeClient {
    /**
     *
     * @param tradingdata
     */
    processOrders(tradingdata: ITradingData): void;

    setProductSize(size: number): void;
}

//https://usenobi.com/blog/how-to-understand-backtest-result/
