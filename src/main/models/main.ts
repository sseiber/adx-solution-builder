export interface IIpcResult {
    result: boolean;
    message: string;
    payload?: any;
}

export interface IIpcProgress {
    label: string;
    value: number;
    total: number;
}

export interface IErrorResult {
    status: number;
    title: string;
    message: string;
}

export const emptyErrorResult: IErrorResult = {
    status: 0,
    title: '',
    message: ''
};
