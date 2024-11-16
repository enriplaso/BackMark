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
    SELL = 'sell',
}

export type Order = {
    id: string;
    type: OrderType;
    side: Side; // buy or sell
    quantity: number; // amount of base currency to buy/sell
    status: OrderStatus;
    timeInForce: TimeInForce;
    filledQuantity: number; // Track how much of the order has been filled (in base currency)
    createdAt: Date; // time at which order was placed
    price?: number; //price per unit of base currency (for LIMIT orders )
    funds?: number; //amount of quote currency to spend (for market orders)
    expireTime?: Date; // timestamp at which order expires
    doneAt?: Date; // time at which order was done
    doneReason?: string; // reason order was done (filled, rejected, or otherwise)
    rejectReason?: string; //TODO : check if is used
    fillFees?: number; //fees paid on current filled amount
    stop?: Stop;
    stopPrice?: number; // price (in quote currency) at which to execute the order
};

// Represent the price /volume of an assent in a concreate time
export type TradingData = {
    timestamp: number;
    price: number;
    volume: number; // Product quantiy e:g  num BTCs
};

export type Trade = {
    orderId: string;
    price: number; // Execution price
    side: Side; // buy or sell
    quantity: number; // Quantity traded
    createdAt: Date; // time at which Trade was placed
    balanceAfterTrade?: number;
    holdingsAfterTrade?: number;
};

export type SimulationOptions = {
    productName: string; // EG BTC-USD
    accountBalance: number; // The initial money that you have in your account
    fee?: number; // Exchange Operation Fee, default 1
    productQuantity?: number; //E.G Bitcoin quantity , default 0
    randomizeFactor?: 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8 | 9; // This will randomize how transaction are processed to give more realism
};

export type Account = {
    id: string;
    balance: number;
    holds: number; // Amount of cash hold in pending order
    available: number; // how much you can cash out
    currency: string;
};
