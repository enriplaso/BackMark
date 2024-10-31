import { argv } from 'process';
import { FasterSMA, SMA } from 'trading-signals';
import { IExchangeClient } from '../../src/lib/IExchangeClient.js';
import { IStrategy } from '../../src/lib/IStrategy.js';
import { ITradingData } from '../../src/lib/trade.js';
import { IExchangeSimulator } from '../../src/lib/IExchangeSImulator.js';

const SMA_DAYS = 2;

export class SmaStrategy implements IStrategy {
    private sma: FasterSMA;
    private accumulatedDailyPrices: number[];
    private previusData: ITradingData | undefined = undefined;
    private daysCount: number;
    private hasTradedToday = false;

    constructor(private readonly exchangeClient: IExchangeSimulator) {
        this.sma = new FasterSMA(SMA_DAYS);
        this.accumulatedDailyPrices = [];
        this.daysCount = 0;
    }

    async checkPosition(tradingData: ITradingData): Promise<void> {
        const account = await this.exchangeClient.getAccount('ID_XXX');

        if (account.balance <= 0) {
            return;
        }
        // pass sma days (wee need some days to calcule SMA (i))

        this.accumulatedDailyPrices.push(tradingData.price);

        if (!this.previusData) {
            this.previusData = tradingData;
            return;
        }

        if (
            this.previusData &&
            this.isDayChange(tradingData.timestamp, this.previusData.timestamp) &&
            this.accumulatedDailyPrices.length > 0
        ) {
            const avg = this.accumulatedDailyPrices.reduce((sum, current) => sum + current, 0) / this.accumulatedDailyPrices.length;
            this.sma.update(avg);
            this.accumulatedDailyPrices = [];

            this.previusData = tradingData;
            this.daysCount++;
            this.hasTradedToday = false;
        }

        if (this.daysCount <= SMA_DAYS) {
            return;
        }
        if (!this.hasTradedToday) {
            if (tradingData.price < this.sma.getResult() - this.sma.getResult() * 0.03) {
                // at less 20% less
                this.exchangeClient.marketBuyOrder('BTC', account.balance * 0.5);
            }

            if (tradingData.price > this.sma.getResult() + this.sma.getResult() * 0.02) {
                const bitcoin = this.exchangeClient.getProductSize('BTC');
                this.exchangeClient.marketSellOrder('BTC', bitcoin);
            }

            this.hasTradedToday = true;
        }

        return;
    }

    private isDayChange = (timestamp: number, prevTimestampt: number): boolean =>
        new Date(timestamp).getDay() > new Date(prevTimestampt).getDay();
}
