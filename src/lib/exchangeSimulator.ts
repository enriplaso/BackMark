import { IExchangeClient, Order, OrderStatus } from './IExchangeClient';

class exchangeSimulator implements IExchangeClient {
    private orders: Array<Order>;

    constructor() {}

    marketBuyOrder(productId: string, price: number, size: number): Promise<Order> {
        throw new Error('Method not implemented.');
    }

    marketSellOrder(productId: string, funds: number): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    limitBuyOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    limitSellOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    stopEntryOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    stopLossOrder(productId: string): Promise<Order> {
        throw new Error('Method not implemented.');
    }
    cancelOrder(id: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    getAllOrders(filter?: OrderStatus[], limit?: number): Promise<Order[]> {
        throw new Error('Method not implemented.');
    }
    cancellAllOrders() {
        throw new Error('Method not implemented.');
    }
}
