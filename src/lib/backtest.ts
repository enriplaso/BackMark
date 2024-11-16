import type { IBackTest } from './IBacktest.js';
import type { IStrategy } from './IStrategy.js';
import type { IExchangeSimulator } from './exchangeSimulator/IExchangeSImulator.js';
import type { TradingData } from './exchangeSimulator/types.js';
import type { BackTestResult } from './types.js';

import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { showLoading, stopLoading } from './util/loadingSpinner.js';

export class BackTest implements IBackTest {
    private readonly initialFunds: number;
    constructor(
        private readonly tradingDataPath: string,
        private readonly strategy: IStrategy,
        private readonly exchangeSimulator: IExchangeSimulator,
    ) {
        this.initialFunds = exchangeSimulator.getAccount().balance;
    }

    async run(): Promise<void> {
        console.time('BackTest-time');
        showLoading('Reading market data history file line by line');

        try {
            const readInterface = createInterface({
                input: createReadStream(this.tradingDataPath),
            });

            let lines = 0;
            for await (const line of readInterface) {
                lines++;
                if (lines > 1) {
                    const tradingData = this.getTradingDataFromLine(line);
                    await this.strategy.checkPosition(tradingData);
                    this.exchangeSimulator.processOrders(tradingData);
                }
            }

            stopLoading(`Reading file line by line done with a total of ${lines} lines`);
            console.timeEnd('BackTest-time');
        } catch (error) {
            console.error(error);
        }
    }

    public getResult(): BackTestResult {
        const account = this.exchangeSimulator.getAccount();
        const totalProfit = account.balance - this.initialFunds;
        return {
            initialBalance: this.initialFunds,
            product: 'BTC',
            finalHoldings: account.productQuantity,
            finalBalance: account.balance,
            totalProfit,
            tradeHistory: this.exchangeSimulator.getAllTrades(),
            profitPercentage: 100 * (totalProfit / this.initialFunds),
        };
    }

    private getTradingDataFromLine(lineData: string): TradingData {
        const [timestamp, open, close, high, low, volume] = lineData.split(',').map((e) => parseFloat(e));
        const price = (open + close + high + low) / 4;
        return { timestamp, price, volume };
    }
}
