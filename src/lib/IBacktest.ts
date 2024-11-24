import { BackTestResult } from './types.js';

/**
 * Represents a backtesting engine for evaluating trading strategies against historical data.
 */
export interface IBackTest {
    /**
     * Runs the backtest by processing the historical trading data line by line.
     */
    run(): Promise<void>;
    /**
     * Retrieves the results of the backtest.
     * @returns The backtest results, including account balances, trades, and profit metrics.
     */
    getResult(): BackTestResult;
}
