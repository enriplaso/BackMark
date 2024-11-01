import { Account, Order, OrderStatus } from './types.js';

/**
 * More info in https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getaccounts
 * https://github.com/danpaquin/coinbasepro-python/blob/master/cbpro/authenticated_client.py
 */
export interface IExchangeClient {
    /**
     * Creates a buy order that should be filled at current market price
     * @param productId must match a valid product eg: BTC-USD
     * @param funds is the ammount of currency you want to buy in USD (eg: 1000)
     */
    marketBuyOrder(productId: string, funds: number): Order;

    /**
     * Creates a Sell order that should be filled at current market price
     * @param productId must match a valid product eg: BTC-USD
     * @param size the amount cryptocurrency you want to sell (eg<. 0.5 of (BTC))
     */
    marketSellOrder(productId: string, size: number): Order;
    /**
     *
     * @param productId
     * @param price
     * @param funds
     */
    limitBuyOrder(productId: string, price: number, funds: number): Order;
    limitSellOrder(productId: string, price: number, size: number): Order;
    stopEntryOrder(productId: string): Promise<Order>;
    stopLossOrder(productId: string): Promise<Order>;
    cancelOrder(id: string): Promise<boolean>;
    getAllOrders(filter?: Array<OrderStatus>, limit?: number): Promise<Array<Order>>;
    cancelAllOrders(): void;
    getAccount(id: string): Promise<Account>;
    getAccountHistory(id: string): void;
    getProductSize(productId: string): number;
}
