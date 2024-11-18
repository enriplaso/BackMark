import type { IStrategy } from '../../src/lib/IStrategy.js';
import type { IExchangeSimulator } from '../../src/lib/exchangeSimulator/IExchangeSImulator.js';
import type { TradingData } from '../../src/lib/exchangeSimulator/types.js';
import { FasterSMA } from 'trading-signals';
import { Stop } from '../../src/lib/orders/types.js';
import { IExchangeClient } from '../../src/lib/exchangeSimulator/IExchangeClient.js';

const SMA_DAYS = 10;

export class SmaStrategy implements IStrategy {
    private sma: FasterSMA;
    private accumulatedDailyPrices: number[];
    private previusData: TradingData | undefined = undefined;
    private daysCount: number;
    private hasTradedToday = false;

    constructor(private readonly exchangeClient: IExchangeClient) {
        this.sma = new FasterSMA(SMA_DAYS);
        this.accumulatedDailyPrices = [];
        this.daysCount = 0;
    }

    async checkPosition(tradingData: TradingData): Promise<void> {
        const account = await this.exchangeClient.getAccount();

        const hasStopLoss = this.exchangeClient.getAllOrders().filter((order) => order?.stop === Stop.LOSS);
        if (!hasStopLoss && account.productQuantity > 0) {
            this.exchangeClient.stopLossOrder(30000, account.productQuantity);
        }

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
            this.isDayChange(new Date(tradingData.timestamp), new Date(this.previusData.timestamp)) &&
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
                if (account.balance > 5) {
                    this.exchangeClient.marketBuyOrder(account.balance * 0.5);
                }
            }

            if (tradingData.price > this.sma.getResult() + this.sma.getResult() * 0.02) {
                const bitcoin = this.exchangeClient.getProductSize();
                if (bitcoin > 0) {
                    this.exchangeClient.marketSellOrder(bitcoin);
                }
            }

            this.hasTradedToday = true;
        }

        return;
    }

    private isDayChange = (current: Date, prev: Date): boolean => current.getDay() !== prev.getDay() && current > prev;
}
