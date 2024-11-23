import type { IBackTest } from './IBacktest.js';
import type { IExchangeSimulator } from './exchangeSimulator/IExchangeSImulator.js';
import type { TradingData } from './exchangeSimulator/types.js';
import type { BackTestOptions, BackTestResult } from './types.js';

import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { showLoading, stopLoading } from './util/loadingSpinner.js';
import { IExchangeClient } from './exchangeSimulator/IExchangeClient.js';
import { ExchangeSimulator } from './exchangeSimulator/exchangeSimulator.js';
import { Strategy } from './Strategy.js';

export class BackTest implements IBackTest {
    private readonly initialFunds: number;
    private readonly strategy: Strategy;
    private readonly exchangeSimulator: IExchangeSimulator;
    constructor(
        private readonly tradingDataPath: string,
        private readonly StrategyClass: new (exchangeClient: IExchangeClient) => Strategy,
        private readonly options: BackTestOptions,
    ) {
        this.exchangeSimulator = new ExchangeSimulator({
            productName: options.productName || 'Unknown',
            accountBalance: this.options.accountBalance,
            fee: this.options.fee,
        });

        this.initialFunds = options.accountBalance;
        this.strategy = new StrategyClass(this.exchangeSimulator);
    }

    async run(): Promise<void> {
        const startTime = Date.now();
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

            stopLoading(`Reading file line by line done with a total of ${lines} lin es`);
            console.info(`Test duration: ${(Date.now() - startTime) / 1000}s`);
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
