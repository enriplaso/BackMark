import { IExchangeClient } from './exchange/IExchangeClient';
import { TradingData } from './exchange/types';

export abstract class Strategy {
    constructor(protected readonly exchangeClient: IExchangeClient) {}
    abstract checkPosition(tradingData: TradingData): Promise<void>;
}
