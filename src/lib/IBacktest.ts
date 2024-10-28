
export interface IBacktest {
    run(): Promise<void>;

    getResult(): BackTestResult;
}

export type BackTestResult = {
    product: string,
    size: number
}

export type BackTestOptions = {
    startDate?: Date;
    endDate?: Date;
}