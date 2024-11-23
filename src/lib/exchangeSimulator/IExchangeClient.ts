import { type Order, type Trade, OrderStatus, TimeInForce } from '../orders/types.js';
import { Account } from './types.js';

/**
 * More info in https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getaccounts
 * https://github.com/danpaquin/coinbasepro-python/blob/master/cbpro/authenticated_client.py
 */
export interface IExchangeClient {
    /**
     * Creates a buy order that should be filled at current market price
     * @param funds is the ammount of currency you want to buy in USD (eg: 1000)
     */
    marketBuyOrder(funds: number, timeInForce?: TimeInForce): Order;

    /**
     * Creates a Sell order that should be filled at current market price
     * @param size the amount cryptocurrency you want to sell (eg<. 0.5 of (BTC))
     */
    marketSellOrder(size: number, timeInForce?: TimeInForce): Order;
    /**
     *
     * @param productId
     * @param price
     * @param funds
     */
    limitBuyOrder(price: number, funds: number, timeInForce?: TimeInForce): Order;
    limitSellOrder(price: number, size: number, timeInForce?: TimeInForce): Order;
    stopEntryOrder(prize: number, funds: number, timeInForce?: TimeInForce): Order;
    stopLossOrder(prize: number, size: number, timeInForce?: TimeInForce): Order;
    cancelOrder(id: string): boolean;
    getAllOrders(filter?: OrderStatus[]): Order[];
    getAllTrades(): Trade[];
    cancelAllOrders(): void;
    getAccount(): Account;
}
