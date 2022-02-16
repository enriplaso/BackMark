import { IBacktest } from './IBacktest';
import { ITradingData } from './models/ITradingData';
import { createReadStream } from 'fs';
import { IStrategy } from './IStrategy';
import { once } from 'events'

export class Backtest implements IBacktest {

    private readline = require('readline'); // Nodejs types for readline are missing

    constructor(private tradingDataPath: string, private stategy?: IStrategy, private fee?: number) { }

    init() {
        throw new Error('Method not implemented.');
    }

    async backTest(): Promise<void> {
        try {
            const readInterface = this.readline.createInterface({
                input: createReadStream(this.tradingDataPath),
                //output: process.stdout,
                console: false
            });

            let lines = 0;
            readInterface.on('line', (line) => {
                lines++;
                if (lines > 1) {
                    const clumnsArr = line.split(',');
                    console.log(line);


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

