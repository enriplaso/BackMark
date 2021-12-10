import exp = require('constants');

export interface IExchangeClient {
    marketBuyOrder(productId: string, price: number, size: number): Promise<Order>;
    marketSellOrder(productId: string, funds: number): Promise<Order>;
    limitBuyOrder(productId: string): Promise<Order>;
    limitSellOrder(productId: string): Promise<Order>;
    stopEntryOrder(productId: string): Promise<Order>;
    stopLossOrder(productId: string): Promise<Order>;
    cancelOrder(id: string): Promise<boolean>;
    getAllOrders(filter?: Array<OrderStatus>, limit?: number): Promise<Array<Order>>;
    cancellAllOrders();
}

export enum OrderStatus {
    OPEN = 'open', // Limit order exists on the order book
    PENDING = 'pending', //Order compleated but will be pending until there have been enough network confirmations (e.g by miners)
    REJECTED = 'rejected', // Order couldn’t be placed
    DONE = 'done', // Order no longer resting on the order book (executed)
    ACTIVE = 'active', // Stop order exists on the order book
    RECEIVED = 'receved', // Order received and not yet processed by the trading engine
    ALL = 'all',
}

export enum TimeInForce {
    GOOD_TILL_CANCEL = 'GTC', // Good till canceled orders remain open on the book until canceled. (Default)
    GOOD_TILL_TIME = 'GTT', // Good till time orders remain open on the book until canceled or the allotted cancel_after is depleted on the matching engine
    INMEDIATE_OR_CANCELL = 'IOC', // Immediate or cancel orders instantly cancel the remaining size of the limit order instead of opening it on the book.
    FILL_OR_KILL = 'FOK', // Fill or kill orders are rejected if the entire size cannot be matched.
}

export enum cancel_after {
    MIN = 'min',
    HOUR = 'hour',
    DAY = 'day', // Order will be cancelled in 24 hours
}
export enum OrderType {
    LIMIT = 'limit',
    MARKET = 'market',
}

export enum Stop {
    LOSS = 'loss', // Triggers when the last trade price changes to a value at or below the
    ENRTRY = 'entry', //  Triggers when the last trade price changes to a value at or above the
}

export interface Order {
    id: string;
    price: string; //price per unit of base currency
    size: string; // amount of base currency to buy/sell
    productId: string; // book the order was placed on
    profile_id?: string; // profile_id that placed the order
    side: string;
    funds?: string; //amount of quote currency to spend (for market orders)
    specified_funds?: string; //funds with fees
    type?: OrderType;
    time_in_force: TimeInForce;
    expire_time?: Date; // timestamp at which order expires
    post_only: boolean; // if true, forces order to be maker only
    created_at: Date; // time at which order was placed
    done_at?: Date; // time at which order was done
    done_reason?: string; // reason order was done (filled, rejected, or otherwise)
    reject_reason?: string;
    fill_fees: number; //fees paid on current filled amount
    filled_size: number; //amount (in base currency) of the order that has been filled
    executed_value?: number;
    status: OrderStatus;
    settled: boolean; // true if funds have been exchanged and settled
    stop?: Stop;
    stop_price?: number; // price (in quote currency) at which to execute the order
    funding_amount?: number;
}
