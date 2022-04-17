import { IBacktest, BackTestOptions } from './IBacktest';
import { ITradingData } from './models/ITradingData';
import { createReadStream } from 'fs';
import { IStrategy } from './IStrategy';
import { once } from 'events'
import { IExchangeSimulator } from './IExchangeSImulator';

export class Backtest implements IBacktest {

    private readline = require('readline'); // Nodejs types for readline are missing

    constructor(private tradingDataPath: string, private stategy: IStrategy, private readonly exchangeSimulator: IExchangeSimulator, private options?: BackTestOptions) { }

    async run(): Promise<void> {
        try {
            const readInterface = this.readline.createInterface({
                input: createReadStream(this.tradingDataPath),
                console: false
            });

            let lines = 0;
            readInterface.on('line', async (line) => {
                lines++;
                if (lines > 1) {
                    const tradingData = this.getTradingDataFromLine(line);
                    await this.stategy.checkPosition(tradingData);
                    this.exchangeSimulator.processOrders(tradingData);
                }
            });

            await once(readInterface, 'close');
            console.log('Reading file line by line with readline done.');
        } catch (error) {
            console.error(error);
        }
    }

    private getTradingDataFromLine(lineData: string): ITradingData {
        const columnsArr = lineData.split(',').map((e) => parseFloat(e));
        const price = (columnsArr[1] + columnsArr[2] + columnsArr[3] + columnsArr[4]) / 4; // open, close , hight, low.
        return { timestamp: columnsArr[0], price, volume: columnsArr[5] };
    }
}

