import { IExchangeClient } from "../lib/IExchangeClient";
import { IStrategy } from "../lib/IStrategy";
import { ITradingData } from "../lib/models/ITradingData";

export class SmaStrategy implements IStrategy {

    constructor(private exchangeClient: IExchangeClient) { }

    checkPosition(tradingData: ITradingData): Promise<void> {
        this.exchangeClient.marketBuyOrder('BTC', 10);
        //throw new Error("Method not implemented.");
        return;
    }

}