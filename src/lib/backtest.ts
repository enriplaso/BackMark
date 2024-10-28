import { IBacktest, BackTestOptions, BackTestResult } from './IBacktest';
import { ITradingData } from './trade';
import { createReadStream } from 'fs';
import { IStrategy } from './IStrategy';
import { IExchangeSimulator } from './IExchangeSImulator';

export class Backtest implements IBacktest {

    private readline = require('readline'); // Nodejs types for readline are missing

    constructor(private tradingDataPath: string, private stategy: IStrategy, private readonly exchangeSimulator: IExchangeSimulator, private options?: BackTestOptions) { }

    async run(): Promise<void> {
        console.time('backtest-time:');
        console.log('Reading file line by line with readline.');

        try {
            const readInterface = this.readline.createInterface({
                input: createReadStream(this.tradingDataPath),
                crlfDelay: Infinity,
                console: false
            });

            let lines = 0;
            for await (const line of readInterface) {
                lines++;
                if (lines > 1) {

                    process.stdout.clearLine(0);
                    process.stdout.cursorTo(0);
                    process.stdout.write(`line: ${lines}`);

                    const tradingData = this.getTradingDataFromLine(line);
                    await this.stategy.checkPosition(tradingData);
                    this.exchangeSimulator.processOrders(tradingData);
                }
            }

            process.stdout.write(`\n`);
            console.log('Reading file line by line with readline done with');
            console.timeEnd('backtest-time:');
        } catch (error) {
            console.error(error);
        }
    }

    getResult(): BackTestResult {
        throw new Error('Method not implemented.');
    }


    private getTradingDataFromLine(lineData: string): ITradingData {
        const columnsArr = lineData.split(',').map((e) => parseFloat(e));
        const price = (columnsArr[1] + columnsArr[2] + columnsArr[3] + columnsArr[4]) / 4; // open, close , hight, low.
        return { timestamp: columnsArr[0], price, volume: columnsArr[5] };
    }
}

