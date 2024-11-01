import { BackTestResult } from './types.js';

export interface IBackTest {
    run(): Promise<void>;
    getResult(): BackTestResult;
}
