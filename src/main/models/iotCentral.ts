export const IoTCentralBaseDomain = 'azureiotcentral.com';

export interface IIotCentralApp {
    id: string;
    name: string;
    location: string;
    applicationId: string;
    displayName: string;
    subdomain: string;
}

export interface IIotCentralDevice {
    appId: string;
    id: string;
    displayName: string;
}

export interface IIotCentralModule {
    deviceId: string;
    name: string;
    displayName: string;
}
