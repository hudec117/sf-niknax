export default class ServiceResult {
    success: boolean;
    data?: any;
    error?: string;

    constructor(success: boolean, data?: any, error?: string) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    static success(data?: any) {
        return new ServiceResult(true, data);
    }

    static fail(error?: string) {
        return new ServiceResult(false, null, error);
    }
}