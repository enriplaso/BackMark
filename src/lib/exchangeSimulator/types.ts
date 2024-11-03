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

export enum CancelAfter {
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
    ENTRY = 'entry', // Triggers when the last trade price changes to a value at or above the
}

export enum Side {
    BUY = 'buy',
    SELL = 'Sell',
}

// Entry type indicates the reason for the account change.
export enum EntryType {
    TRANSFER = 'transfer', // Funds moved to/from Coinbase to cbpro
    MATCH = 'match', // Funds moved as a result of a trade
    FEE = 'fee', //Fee as a result of a trade
    REBATE = 'rebate', //Fee rebate as per our fee schedule
}

export type Order = {
    id: string;
    status: OrderStatus;
    time_in_force: TimeInForce;
    price?: number; //price per unit of base currency
    size?: number; // amount of base currency to buy/sell
    profile_id?: string; // rofile_id that placed the order
    side?: Side; // buy or sell
    funds?: number; //amount of quote currency to spend (for market orders)
    specified_funds?: string; //funds with fees
    type?: OrderType;
    expire_time?: Date; // timestamp at which order expires
    post_only?: boolean; // if true, forces order to be maker only
    created_at: Date; // time at which order was placed
    done_at?: Date; // time at which order was done
    done_reason?: string; // reason order was done (filled, rejected, or otherwise)
    reject_reason?: string;
    fill_fees?: number; //fees paid on current filled amount
    filled_size?: number; //amount (in base currency) of the order that has been filled
    executed_value?: number;
    settled?: boolean; // true if funds have been exchanged and settled
    stop?: Stop;
    stop_price?: number; // price (in quote currency) at which to execute the order
    funding_amount?: number; // Amount of margin funding to be provided for the order
};

export type Account = {
    id: string;
    balance: number;
    holds: number; // Amount of cash hold in pending order
    available: number; // how much you can cash out
    currency: string;
};

export type AccountHistory = {
    id: string;
    ccreated_at: Date;
    amount: number;
    balance: number;
    type: EntryType;
    details: AccountHistoryDetails;
};

export type AccountHistoryDetails = {
    order_id: string;
    product_id: string;
    trade_id: string;
};

export type TradingData = {
    timestamp: number;
    price: number;
    volume?: number;
};

export type Trade = {
    entryTime: number;
    entryPrice: number;
    closeTime?: number;
    closePrice?: number;
    netProfit?: number;
};

export type SimulationOptions = {
    productName: string; // EG BTC-USD
    accountBalance: number; // The initial money that you have in your account
    fee?: number; // Exchange Operation Fee, default 1
    productQuantity?: number; //E.G Bitcoin quantity , default 0
    randomizeFactor?: 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8 | 9; // This will randomize how transaction are processed to give more realism
};
