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
    available: number; // how much you can cash out
    currency: string;
    productQuantity: number;
    fee: number; // Fee in percentage that the exchange/broker will chare for each Trades
};
// Represent the price /volume of an assent in a concreate time
export type TradingData = {
    timestamp: number;
    price: number;
    volume: number; // Product quantiy e:g  num BTCs
};
