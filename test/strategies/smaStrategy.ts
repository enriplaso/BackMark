import { argv } from "process";
import { FasterSMA, SMA } from "trading-signals";
import { IExchangeClient } from "../../src/lib/IExchangeClient";
import { IStrategy } from "../../src/lib/IStrategy";
import { ITradingData } from "../../src/lib/trade";

const SMA_DAYS = 10;

export class SmaStrategy implements IStrategy {

    private sma: FasterSMA;
    private accumulatedDailyPrices = [];
    private previusData: ITradingData;

    constructor(private readonly exchangeClient: IExchangeClient, private readonly prevousDailyData?: Array<ITradingData>) {
        this.sma = new FasterSMA(SMA_DAYS);
        this.previusData = this.prevousDailyData[this.prevousDailyData.length - 1];
        this.preProcessSMA(SMA_DAYS)
    }

    async checkPosition(tradingData: ITradingData): Promise<void> {

        const account = await this.exchangeClient.getAccount("ID_XXX");

        if (this.isDayChange(tradingData.timestamp, this.previusData.timestamp) && this.accumulatedDailyPrices.length > 0) {
            const avg = this.accumulatedDailyPrices.reduce((sum, current) => sum + current.total, 0) / this.accumulatedDailyPrices.length;
            this.sma.update(avg);
            this.accumulatedDailyPrices = [];
        }

        this.accumulatedDailyPrices.push[tradingData.price];

        // Enter Positon
        if (tradingData.price < this.sma.getResult()) {
            this.exchangeClient.marketBuyOrder('BTC', account.balance * 0.1);
        }

        if (tradingData.price > this.sma.getResult()) {
            this.exchangeClient.marketSellOrder('BTC', account.holds * 0.1);
        }
        return;
    }

    private preProcessSMA(days: number): number {
        if (days > this.prevousDailyData.length) {
            throw new Error("SMA day must be smaller or equal to the previous dailz data array length")
        }

        for (let i = this.prevousDailyData.length; i > days; i--) {
            this.sma.update(this.prevousDailyData.pop().price);
        }
        return this.sma.getResult();
    }

    private isDayChange = (timestamp: number, prevTimestampt: number): boolean => (new Date(timestamp).getDay() < new Date(prevTimestampt).getDay());

}