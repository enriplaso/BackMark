import { type Order, type Trade, TimeInForce } from '../orders/types.js';
import { Account } from './types.js';

/**
 * Interface for managing exchange operations like placing orders, managing trades, and retrieving account details.
 */
export interface IExchangeClient {
    /**
     * Places a market buy order to purchase cryptocurrency at the current market price.
     *
     * @param funds - The amount of funds to spend in USD (e.g., 1000 for $1000).
     * @param timeInForce - (Optional) Specifies how long the order remains active. Defaults to "Good Till Canceled".
     * @returns The created order object.
     */
    marketBuyOrder(funds: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order;

    /**
     * Places a market sell order to sell cryptocurrency at the current market price.
     *
     * @param size - The amount of cryptocurrency to sell (e.g., 0.5 for 0.5 BTC).
     * @param timeInForce - (Optional) Specifies how long the order remains active. Defaults to "Good Till Canceled".
     * @returns The created order object.
     */
    marketSellOrder(size: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order;

    /**
     * Places a limit buy order to purchase cryptocurrency when a specified price is reached or better.
     *
     * @param price - The target price to execute the buy order.
     * @param funds - The amount of funds to allocate for the buy order in USD.
     * @param timeInForce - (Optional) Specifies how long the order remains active. Defaults to "Good Till Canceled".
     * @returns The created order object.
     */
    limitBuyOrder(price: number, funds: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order;

    /**
     * Places a limit sell order to sell cryptocurrency when a specified price is reached or better.
     *
     * @param price - The target price to execute the sell order.
     * @param quantity - The amount of cryptocurrency to sell.
     * @param timeInForce - (Optional) Specifies how long the order remains active. Defaults to "Good Till Canceled".
     * @returns The created order object.
     */
    limitSellOrder(price: number, quantity: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order;

    /**
     * Places a stop-loss order to sell cryptocurrency when the price drops to or below a specified level.
     *
     * @param price - The trigger price for the stop-loss order.
     * @param size - The amount of cryptocurrency to sell when the stop-loss is triggered.
     * @param timeInForce - (Optional) Specifies how long the order remains active. Defaults to "Good Till Canceled".
     * @returns The created order object.
     */
    stopLossOrder(price: number, size: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order;

    /**
     * Places a stop-entry order to buy cryptocurrency when the price rises to or above a specified level.
     *
     * @param price - The trigger price for the stop-entry order.
     * @param size - The amount of cryptocurrency to buy when the stop-entry is triggered.
     * @param timeInForce - (Optional) Specifies how long the order remains active. Defaults to "Good Till Canceled".
     * @returns The created order object.
     */
    stopEntryOrder(price: number, size: number, timeInForce?: TimeInForce, cancelAfter?: Date): Order;

    /**
     * Cancels a specific order by its unique identifier.
     *
     * @param id - The unique identifier of the order to cancel.
     */
    cancelOrder(id: string): void;

    /**
     * Retrieves all orders currently managed by the client, optionally filtered by their status.
     *
     * @returns An array of orders, optionally filtered by status.
     */
    getAllOrders(): Order[];

    /**
     * Retrieves all trades that have been executed by the client.
     *
     * @returns An array of executed trades.
     */
    getAllTrades(): Trade[];

    /**
     * Cancels all active orders currently managed by the client.
     */
    cancelAllOrders(): void;

    /**
     * Retrieves the account information associated with the client, including balance and product quantities.
     *
     * @returns The account details object.
     */
    getAccount(): Account;
}
