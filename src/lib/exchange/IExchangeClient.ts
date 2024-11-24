import { type Order, type Trade, OrderStatus, TimeInForce } from '../orders/types.js';
import { Account } from './types.js';

export interface IExchangeClient {
    /**
     * Creates a buy order to be filled at the current market price.
     * @param funds The amount of currency you want to buy in USD (e.g., 1000 for $1000).
     * @param timeInForce Optional. The duration the order will remain active. Defaults to "Good Till Canceled".
     * @returns The created order.
     */
    marketBuyOrder(funds: number, timeInForce?: TimeInForce): Order;

    /**
     * Creates a sell order to be filled at the current market price.
     * @param size The amount of cryptocurrency you want to sell (e.g., 0.5 for 0.5 BTC).
     * @param timeInForce Optional. The duration the order will remain active. Defaults to "Good Till Canceled".
     * @returns The created order.
     */
    marketSellOrder(size: number, timeInForce?: TimeInForce): Order;

    /**
     * Creates a limit buy order that will be executed when the specified price is reached.
     * @param price The target price at which to execute the buy order.
     * @param funds The amount of funds to use for the buy order.
     * @param timeInForce Optional. The duration the order will remain active. Defaults to "Good Till Canceled".
     * @returns The created order.
     */
    limitBuyOrder(price: number, funds: number, timeInForce?: TimeInForce): Order;

    /**
     * Creates a limit sell order that will be executed when the specified price is reached.
     * @param price The target price at which to execute the buy order.
     * @param quantity The amount product to sell
     * @param timeInForce Optional. The duration the order will remain active. Defaults to "Good Till Canceled".
     * @returns The created order.
     */
    limitSellOrder(price: number, quantity: number, timeInForce?: TimeInForce): Order;

    /**
     * Creates a stop-loss order that will be triggered when the specified price is reached.
     * @param price The trigger price for the stop-loss order.
     * @param size The amount of cryptocurrency to sell when the stop-loss is triggered.
     * @param timeInForce Optional. The duration the order will remain active. Defaults to "Good Till Canceled".
     * @returns The created order.
     */
    stopLossOrder(price: number, size: number, timeInForce?: TimeInForce): Order;

    /**
     * Creates a stop-entry buy order that will be triggered when the specified price is reached.
     * @param price The trigger price for the stop-loss order.
     * @param size The amount of cryptocurrency to sell when the stop-loss is triggered.
     * @param timeInForce Optional. The duration the order will remain active. Defaults to "Good Till Canceled".
     * @returns The created order.
     */
    stopEntryOrder(price: number, size: number, timeInForce?: TimeInForce): Order;

    /**
     * Cancels a specific order.
     * @param id The unique identifier of the order to cancel.
     */
    cancelOrder(id: string): void;

    /**
     * Retrieves all orders, optionally filtered by their status.
     * @param filter Optional. An array of order statuses to filter the results by.
     * @returns An array of orders matching the filter.
     */
    getAllOrders(filter?: OrderStatus[]): Order[];

    /**
     * Retrieves all trades executed by the client.
     * @returns An array of trades.
     */
    getAllTrades(): Trade[];

    /**
     * Cancels all active orders.
     */
    cancelAllOrders(): void;

    /**
     * Returns the account information created during the simulation. This includes balance and product quantities.
     * @returns The account details.
     */
    getAccount(): Account;
}
