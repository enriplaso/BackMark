import { IBacktest, BackTestOptions } from './IBacktest';
import { ITradingData } from './models/ITradingData';
import { createReadStream } from 'fs';
import { IStrategy } from './IStrategy';
import { once } from 'events'

export class Backtest implements IBacktest {

    private readline = require('readline'); // Nodejs types for readline are missing

    constructor(private tradingDataPath: string, private stategy: IStrategy, private options?: BackTestOptions) { }


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
                    const clumnsArr = line.split(',');
                    console.log(line);

                    const price = (clumnsArr[1] + clumnsArr[2] + clumnsArr[3] + clumnsArr[4]) / 4 // open, close , hight, low.

                    await this.stategy.checkPosition({ timestamp: parseInt(clumnsArr[0]), price, volume: clumnsArr[5] });

                    //   console.log(new Date(Number.parseInt(clumnsArr[0])));

                }
            });

            await once(readInterface, 'close');
            console.log('Reading file line by line with readline done.');
        } catch (error) {
            console.error(error);
        }

    }
}

