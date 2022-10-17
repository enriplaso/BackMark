import { Account, IExchangeClient } from "./IExchangeClient";
import { ITradingData } from "./trade";

export interface IExchangeSimulator extends IExchangeClient {
    /**
     * 
     * @param tradingdata 
     */
    processOrders(tradingdata: ITradingData);

    setProductSize(size: number);
}

//https://usenobi.com/blog/how-to-understand-backtest-result/
