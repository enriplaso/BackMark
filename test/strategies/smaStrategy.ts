import { Strategy } from '../../src/lib/strategy.js';
import type { Account, TradingData } from '../../src/lib/exchange/types.js';
import { FasterSMA } from 'trading-signals';
import { Stop } from '../../src/lib/orders/types.js';
import { IExchangeClient } from '../../src/lib/exchange/IExchangeClient.js';

const SMA_DAYS = 10;
const STOP_PRICE_PERCENTAGE = 25;

export class SmaStrategy extends Strategy {
    private sma: FasterSMA;
    private dailyPrices: number[];
    private previousData: TradingData | undefined = undefined;
    private dayCount: number;
    private tradedToday = false;

    constructor(protected readonly exchangeClient: IExchangeClient) {
        super(exchangeClient);
        this.sma = new FasterSMA(SMA_DAYS);
        this.dailyPrices = [];
        this.dayCount = 0;
    }

    async checkPosition(tradingData: TradingData): Promise<void> {
        const account = await this.exchangeClient.getAccount();

        // Ensure a stop-loss order if holding a position
        await this.ensureStopLoss(account, tradingData.price);

        // pass sma days (wee need some days to calculate SMA (i))
        this.dailyPrices.push(tradingData.price);

        if (!this.previousData) {
            this.previousData = tradingData;
            return;
        }

        // Update SMA at the end of the day
        if (this.previousData && this.isNewDay(new Date(tradingData.timestamp), new Date(this.previousData.timestamp))) {
            this.updateSMA(tradingData);
        }

        // Skip trading until sufficient SMA data is available
        if (this.dayCount <= SMA_DAYS) {
            return;
        }

        // Execute buy/sell strategies if not traded today
        if (!this.tradedToday) {
            await this.executeTradingStrategy(tradingData, account);
        }

        return;
    }

    private isNewDay = (current: Date, prev: Date): boolean => current.getDay() !== prev.getDay() && current > prev;

    private updateSMA(tradingData: TradingData): void {
        if (this.dailyPrices.length === 0) return;

        const averagePrice = this.dailyPrices.reduce((sum, price) => sum + price, 0) / this.dailyPrices.length;
        this.sma.update(averagePrice);

        this.dailyPrices = [];
        this.previousData = tradingData;
        this.dayCount++;
        this.tradedToday = false;
    }

    private async ensureStopLoss(account: Account, assetPrice: number): Promise<void> {
        const hasStopLoss = (await this.exchangeClient.getAllOrders()).some((order) => order?.stop === Stop.LOSS);

        const stopPrice = assetPrice - (assetPrice * STOP_PRICE_PERCENTAGE) / 100;
        if (!hasStopLoss && account.productQuantity > 0) {
            await this.exchangeClient.stopLossOrder(stopPrice, account.productQuantity);
        }

        return;
    }

    private async executeTradingStrategy(tradingData: TradingData, account: Account): Promise<void> {
        const smaValue = this.sma.getResult();

        // Buy if price is below SMA
        if (tradingData.price < smaValue * 0.94 && account.balance > 0) {
            await this.exchangeClient.marketBuyOrder(account.balance * 0.5);
        }

        // Sell if price is above SMA
        if (tradingData.price > smaValue * 1.02) {
            const bitcoin = account.productQuantity;
            if (bitcoin > 0) {
                await this.exchangeClient.marketSellOrder(bitcoin);
            }
        }

        this.tradedToday = true;
        return;
    }
}
