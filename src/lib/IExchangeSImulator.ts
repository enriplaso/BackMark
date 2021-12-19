import { IExchangeClient } from "./IExchangeClient";

export interface IExchangeSimulator extends IExchangeClient {
    /**
     * 
     * @param price 
     */
    processOrders(price: number);
}
