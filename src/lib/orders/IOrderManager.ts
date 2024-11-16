import type { Order } from '../exchangeSimulator/types';

export interface IOrderManager {
    addOrder(order: Order): void;
}
