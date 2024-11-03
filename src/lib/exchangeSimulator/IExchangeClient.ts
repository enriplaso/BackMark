import { Account, Order, OrderStatus, Trade } from './types.js';

/**
 * More info in https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getaccounts
 * https://github.com/danpaquin/coinbasepro-python/blob/master/cbpro/authenticated_client.py
 */
export interface IExchangeClient {
    /**
     * Creates a buy order that should be filled at current market price
     * @param funds is the ammount of currency you want to buy in USD (eg: 1000)
     */
    marketBuyOrder(funds: number): Order;

    /**
     * Creates a Sell order that should be filled at current market price
     * @param size the amount cryptocurrency you want to sell (eg<. 0.5 of (BTC))
     */
    marketSellOrder(size: number): Order;
    /**
     *
     * @param productId
     * @param price
     * @param funds
     */
    limitBuyOrder(price: number, funds: number): Order;
    limitSellOrder(price: number, size: number): Order;
    stopEntryOrder(): Order;
    stopLossOrder(): Order;
    cancelOrder(id: string): boolean;
    getAllOrders(filter?: OrderStatus[], limit?: number): Order[];
    getAllTrades(): Trade[];
    cancelAllOrders(): void;
    getAccount(id: string): Account;
    getAccountHistory(id: string): void;
    getProductSize(): number;
}
