import type { IBackTest } from './IBacktest.js';
import type { IStrategy } from './IStrategy.js';
import type { IExchangeSimulator } from './exchangeSimulator/IExchangeSImulator.js';
import type { TradingData } from './exchangeSimulator/types.js';
import type { BackTestResult } from './types.js';

import { createInterface } from 'readline';
import { createReadStream } from 'fs';

export class BackTest implements IBackTest {
    constructor(
        private tradingDataPath: string,
        private strategy: IStrategy,
        private readonly exchangeSimulator: IExchangeSimulator,
        // private options?: BackTestOptions,
    ) {}

    async run(): Promise<void> {
        console.time('backtest-time:');
        console.log('Reading file line by line with readline.');

        try {
            const readInterface = createInterface({
                input: createReadStream(this.tradingDataPath),
            });

            let lines = 0;
            for await (const line of readInterface) {
                lines++;
                if (lines > 1) {
                    //process.stdout.clearLine(0);
                    //process.stdout.cursorTo(0);
                    //process.stdout.write(`line: ${lines}`);

                    console.log(`line: ${lines}`);

                    const tradingData = this.getTradingDataFromLine(line);
                    await this.strategy.checkPosition(tradingData);
                    this.exchangeSimulator.processOrders(tradingData);
                }
            }

            //process.stdout.write(`\n`);
            console.log('Reading file line by line with readline done with');
            console.timeEnd('backtest-time:');
        } catch (error) {
            console.error(error);
        }
    }

    getResult(): BackTestResult {
        throw new Error('Method not implemented.');
    }

    private getTradingDataFromLine(lineData: string): TradingData {
        const columnsArr = lineData.split(',').map((e) => parseFloat(e));
        const price = (columnsArr[1] + columnsArr[2] + columnsArr[3] + columnsArr[4]) / 4; // open, close , hight, low.
        return { timestamp: columnsArr[0], price, volume: columnsArr[5] };
    }
}
