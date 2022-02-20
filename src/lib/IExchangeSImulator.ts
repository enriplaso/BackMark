import { IExchangeClient } from "./IExchangeClient";
import { ITradingData } from "./models/ITradingData";

export interface IExchangeSimulator extends IExchangeClient {
    /**
     * 
     * @param tradingdata 
     */
    processOrders(tradingdata: ITradingData);

    getSumary(): Summary;
}

//https://usenobi.com/blog/how-to-understand-backtest-result/
export interface Summary {
    productId: string;
    productCuantity: number;
    accountFunds: number;
    netProfit: number;
    totalClosedTrades: number;
    startDate: Date;
    endDate: Date;
    percentProfitable: number;
    profitFactor: number;
}


export interface product {

}