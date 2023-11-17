export class Result<T = any> {
    success: boolean;
    data?: T;
    error?: string;

    constructor(success: boolean, data?: T, error?: string) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    get guardedData(): T {
        if (!this.data) {
            throw new Error('Result "data" is null or undefined when attempting to access it through a guard. Please report this on GitHub.');
        }

        return this.data;
    }

    static success<T = any>(data?: T) {
        return new Result<T>(true, data);
    }

    static conditional<T>(condition: boolean, data?: T) {
        return new Result<T>(condition, data);
    }

    static fail<T = any>(error?: string) {
        return new Result<T>(false, undefined, error);
    }
}

export class ItemCloneResult {
    item: string;
    type: string;
    error?: string;

    constructor(item: string, type: string, error?: string) {
        this.item = item;
        this.type = type;
        this.error = error;
    }
}