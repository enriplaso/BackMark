import type { Account, SimulationOptions, TradingData } from './types.js';
import type { IExchangeSimulator } from './IExchangeSImulator.js';
import type { Order, Trade } from '../orders/types.js';
import { OrderStatus, OrderType, Side, Stop, TimeInForce } from '../orders/types.js';
import { randomUUID } from 'crypto';
import { IOrderManager } from '../orders/IOrderManager.js';
import { OrderManager } from '../orders/orderManager.js';
import assert from 'assert';

export class ExchangeSimulator implements IExchangeSimulator {
    private account: Account;
    private currentTradeTimestamp: number = Date.now();

    constructor(
        private readonly options: SimulationOptions,
        private readonly orderManager: IOrderManager = new OrderManager(),
    ) {
        this.account = {
            id: randomUUID(),
            balance: this.options.accountBalance,
            available: this.options.accountBalance,
            currency: 'USD',
            productQuantity: this.options.productQuantity || 0,
            fee: this.options.fee || 0,
        };
    }

    public processOrders(tradingData: TradingData): void {
        this.currentTradeTimestamp = tradingData.timestamp;
        this.orderManager.getActiveOrders().forEach((order) => {
            this.orderManager.processOrder(order, this.account, tradingData);
        });
    }

    public marketBuyOrder(funds: number, timeInForce?: TimeInForce): Order {
        this.assertFunds(funds);
        return this.createOrder(Side.BUY, OrderType.MARKET, funds, undefined, undefined, timeInForce);
    }

    public marketSellOrder(quantity: number, timeInForce?: TimeInForce): Order {
        this.assertQuantity(quantity);
        return this.createOrder(Side.SELL, OrderType.MARKET, undefined, quantity, undefined, timeInForce);
    }

    public limitBuyOrder(limitPrice: number, funds: number, timeInForce?: TimeInForce): Order {
        this.assertFunds(funds);
        this.assertPrice(limitPrice);
        return this.createOrder(Side.BUY, OrderType.LIMIT, funds, undefined, limitPrice, timeInForce);
    }

    public limitSellOrder(limitPrice: number, quantity: number, timeInForce?: TimeInForce): Order {
        this.assertQuantity(quantity);
        return this.createOrder(Side.SELL, OrderType.LIMIT, undefined, quantity, limitPrice, timeInForce);
    }

    public stopEntryOrder(stopPrice: number, funds: number, timeInForce?: TimeInForce): Order {
        this.assertFunds(funds);
        return this.createOrder(Side.BUY, OrderType.MARKET, funds, undefined, stopPrice, timeInForce, Stop.ENTRY);
    }

    public stopLossOrder(stopPrice: number, quantity: number, timeInForce?: TimeInForce): Order {
        this.assertQuantity(quantity);
        this.assertPrice(stopPrice);
        return this.createOrder(Side.SELL, OrderType.MARKET, undefined, quantity, stopPrice, timeInForce, Stop.LOSS);
    }

    public cancelOrder(id: string): void {
        this.orderManager.cancelOrder(id, this.currentTradeTimestamp);
    }

    public cancelAllOrders(): void {
        this.orderManager.cancelAllOrders(this.currentTradeTimestamp);
    }

    public getAllOrders(filter?: OrderStatus[]): Order[] {
        const orders = this.orderManager.getActiveOrders();
        return filter?.length ? orders.filter((order) => filter.includes(order.status)) : orders;
    }

    public getAllTrades(): Trade[] {
        return this.orderManager.getAllTrades();
    }

    public getAccount(): Account {
        return this.account;
    }

    // Private Helper Methods

    private createOrder(
        side: Side,
        type: OrderType,
        funds?: number,
        quantity?: number,
        price?: number,
        timeInForce: TimeInForce = TimeInForce.GOOD_TILL_CANCEL,
        stop?: Stop,
    ): Order {
        const order: Order = {
            id: randomUUID(),
            side,
            type,
            funds,
            quantity,
            price,
            stop,
            stopPrice: stop ? price : undefined,
            timeInForce,
            createdAt: new Date(this.currentTradeTimestamp),
            status: OrderStatus.RECEIVED,
        };

        this.orderManager.addOrder(order);
        return order;
    }

    private assertFunds(funds: number): void {
        assert(funds > 0, 'Funds must be greater than 0.');
        assert(funds + this.account.fee <= this.account.balance, 'There is not enough funds in the account.');
    }

    private assertQuantity(quantity: number): void {
        assert(quantity > 0, 'Quantity must be greater than 0.');
        assert(quantity <= this.account.productQuantity, 'There is not enough product quantity to sell.');
    }

    private assertPrice(price: number): void {
        assert(price > 0, 'Price must be greater than 0.');
    }
}
