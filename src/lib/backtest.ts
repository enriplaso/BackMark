import type { IBackTest } from './IBacktest.js';
import type { IExchangeSimulator } from './exchange/IExchangeSImulator.js';
import type { TradingData } from './exchange/types.js';
import type { BackTestOptions, BackTestResult } from './types.js';

import { createInterface } from 'readline';
import { createReadStream } from 'fs';
import { Spinner } from './util/loadingSpinner.js';
import { IExchangeClient } from './exchange/IExchangeClient.js';
import { ExchangeSimulator } from './exchange/exchangeSimulator.js';
import { Strategy } from './strategy.js';

export class BackTest implements IBackTest {
    private readonly initialFunds: number;
    private readonly strategy: Strategy;
    private readonly exchangeSimulator: IExchangeSimulator;
    private readonly spinner: Spinner = new Spinner();

    constructor(
        private readonly tradingDataPath: string,
        private readonly StrategyClass: new (exchangeClient: IExchangeClient) => Strategy,
        private readonly options: BackTestOptions,
    ) {
        this.exchangeSimulator = new ExchangeSimulator({
            productName: options.productName || 'Unknown',
            accountBalance: options.accountBalance,
            fee: options.fee,
        });

        // Store the initial funds and initialize the strategy
        this.initialFunds = options.accountBalance;
        this.strategy = new StrategyClass(this.exchangeSimulator);
    }

    public async run(): Promise<void> {
        const startTime = Date.now();
        this.spinner.start('Reading market data history file line by line');

        try {
            const readInterface = createInterface({
                input: createReadStream(this.tradingDataPath),
            });

            let lineCount = 0;

            for await (const line of readInterface) {
                lineCount++;

                // Skip the header line
                if (lineCount === 1) continue;

                const tradingData = this.parseTradingData(line);
                await this.strategy.checkPosition(tradingData);
                this.exchangeSimulator.processOrders(tradingData);
            }

            this.spinner.stop(`Finished processing ${lineCount} lines of market data`);
            console.info(`Test duration: ${(Date.now() - startTime) / 1000}s`);
        } catch (error) {
            this.spinner.stop('An error occurred during the backtest');
            console.error(error);
        }
    }

    public getResult(): BackTestResult {
        const account = this.exchangeSimulator.getAccount();
        const totalProfit = account.balance - this.initialFunds;

        return {
            initialBalance: this.initialFunds,
            product: this.options.productName!,
            finalHoldings: account.productQuantity,
            finalBalance: account.balance,
            totalProfit,
            tradeHistory: this.exchangeSimulator.getAllTrades(),
            profitPercentage: (totalProfit / this.initialFunds) * 100,
        };
    }

    /**
     * Parses a line of CSV trading data into a `TradingData` object.
     * @param lineData A CSV line representing a single time interval of trading data.
     * @returns The parsed trading data.
     */
    private parseTradingData(lineData: string): TradingData {
        const [timestamp, open, close, high, low, volume] = lineData.split(',').map(Number);

        return {
            timestamp,
            price: (open + close + high + low) / 4,
            volume,
        };
    }
}
