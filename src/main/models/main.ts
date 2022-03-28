export interface IIpcResult {
    result: boolean;
    message: string;
    payload?: any;
}

export enum ProvisioningState {
    Active,
    Inactive
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

export const emptyProgress: IIpcProgress = {
    label: '',
    value: 0,
    total: 100
};

export const emptyErrorResult: IErrorResult = {
    status: 0,
    title: '',
    message: ''
};
