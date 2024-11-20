import { IExchangeClient } from './exchangeSimulator/IExchangeClient';
import { TradingData } from './exchangeSimulator/types';

export abstract class Strategy {
    constructor(protected readonly exchangeClient: IExchangeClient) {}
    abstract checkPosition(tradingData: TradingData): Promise<void>;
}
