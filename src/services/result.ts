export default class ServiceResult {
    success: boolean;
    data?: any;
    error?: string;

    constructor(success: boolean, data?: any, error?: string) {
        this.success = success;
        this.data = data;
        this.error = error;
    }
}