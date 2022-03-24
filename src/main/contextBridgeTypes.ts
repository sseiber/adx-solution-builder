/* eslint-disable max-len */
import { IpcRendererEvent } from 'electron';
import { AccountInfo } from '@azure/msal-node';
import { IMsalConfig } from '../main/models/msalAuth';
import {
    IIotCentralApp,
    IIotCentralDevice,
    IIotCentralModule
} from '../main/models/iotCentral';
import {
    IIndustrialDirectMethodResponse,
    IApiContext,
    IEndpoint,
    IBrowseNodesRequest,
    IAdapterConfiguration
} from '../main/models/industrialConnect';

// Main
const Ipc_Log = 'Ipc_Log';
const Ipc_OpenConfiguration = 'Ipc_OpenConfiguration';
const Ipc_StartProvisioning = 'Ipc_StartProvisioning';
const Ipc_ProvisionProgress = 'Ipc_ProvisionProgress';
const Ipc_EndProvisioning = 'Ipc_EndProvisioning';
const Ipc_GetAdapterConfiguration = 'Ipc_GetAdapterConfiguration';
const Ipc_SetAdapterConfiguration = 'Ipc_SetAdapterConfiguration';
const Ipc_OpenLink = 'Ipc_OpenLink';

// Auth
const Ipc_GetLastOAuthError = 'Ipc_GetLastOAuthError';
const Ipc_SetLastOAuthError = 'Ipc_SetLastOAuthError';
const Ipc_SetMsalConfig = 'Ipc_SetMsalConfig';
const Ipc_GetMsalConfig = 'Ipc_GetMsalConfig';
const Ipc_Signin = 'Ipc_Signin';
const Ipc_Signout = 'Ipc_Signout';
const Ipc_GetAccount = 'Ipc_GetAccount';
const Ipc_GetProfile = 'Ipc_GetProfile';

// IoT Central
const Ipc_RequestApi = 'Ipc_RequestApi';
const Ipc_GetIotcApps = 'Ipc_GetIotcApps';
const Ipc_GetIotcDevices = 'Ipc_GetIotcDevices';
const Ipc_GetIotcDeviceModules = 'Ipc_GetIotcDeviceModules';

// Industrial Connect
const Ipc_TestConnection = 'Ipc_TestConnection';
const Ipc_TestConnectionProgress = 'Ipc_TestConnectionProgress';
const Ipc_FetchNodes = 'Ipc_FetchNodes';
const Ipc_FetchNodesProgress = 'Ipc_FetchNodesProgress';

const Ipc_ReceiveMessage = 'Ipc_ReceiveMessage';

interface IIpcResult {
    result: boolean;
    message: string;
    payload?: any;
}

interface IIpcProgress {
    label: string;
    value: number;
    total: number;
}

declare global {
    interface Window {
        ipcApi: {
            // Main
            [Ipc_Log]: (tags: string[], message: string) => Promise<void>;
            [Ipc_OpenConfiguration]: (loadLastConfiguration: boolean) => Promise<IIpcResult>;
            [Ipc_StartProvisioning]: () => Promise<IIpcResult>;
            [Ipc_ProvisionProgress]: (channel: string, receiver: (event: IpcRendererEvent, message: IIpcProgress) => void) => void;
            [Ipc_EndProvisioning]: (channel: string, receiver: (event: IpcRendererEvent) => void) => void;
            [Ipc_GetAdapterConfiguration]: (appId: string, deviceId: string) => Promise<IAdapterConfiguration>;
            [Ipc_SetAdapterConfiguration]: (adapterConfig: IAdapterConfiguration) => Promise<boolean>;
            [Ipc_OpenLink]: (url: string) => Promise<void>;

            // Auth
            [Ipc_GetLastOAuthError]: () => Promise<string>;
            [Ipc_SetLastOAuthError]: (message: string) => Promise<void>;
            [Ipc_SetMsalConfig]: (msalConfig: IMsalConfig) => Promise<void>;
            [Ipc_GetMsalConfig]: () => Promise<IMsalConfig>;
            [Ipc_Signin]: (redirectPath: string) => Promise<AccountInfo>;
            [Ipc_Signout]: () => Promise<void>;
            [Ipc_GetAccount]: () => Promise<AccountInfo>;
            [Ipc_GetProfile]: (msalConfig: IMsalConfig) => Promise<any>;

            // IoT Central
            [Ipc_RequestApi]: (config: any) => Promise<any>;
            [Ipc_GetIotcApps]: () => Promise<IIotCentralApp[]>;
            [Ipc_GetIotcDevices]: (appSubDomain: string, appId: string) => Promise<IIotCentralDevice[]>;
            [Ipc_GetIotcDeviceModules]: (appSubdomain: string, deviceId: string) => Promise<IIotCentralModule[]>;

            // Industrial Connect
            [Ipc_TestConnection]: (apiContext: IApiContext, opcEndpoint: IEndpoint) => Promise<IIndustrialDirectMethodResponse>;
            [Ipc_TestConnectionProgress]: (channel: string, receiver: (event: IpcRendererEvent, message: IIpcProgress) => void) => void;
            [Ipc_FetchNodes]: (apiContext: IApiContext, browseNodesRequest: IBrowseNodesRequest) => Promise<IIndustrialDirectMethodResponse>;
            [Ipc_FetchNodesProgress]: (channel: string, receiver: (event: IpcRendererEvent, message: IIpcProgress) => void) => void;

            [Ipc_ReceiveMessage]: (channel: string, receiver: (event: IpcRendererEvent, ...args: any[]) => void) => void;
        };
    }
}

export {
    Ipc_Log,
    Ipc_OpenConfiguration,
    Ipc_StartProvisioning,
    Ipc_ProvisionProgress,
    Ipc_EndProvisioning,
    Ipc_GetAdapterConfiguration,
    Ipc_SetAdapterConfiguration,
    Ipc_OpenLink,
    Ipc_GetLastOAuthError,
    Ipc_SetLastOAuthError,
    Ipc_SetMsalConfig,
    Ipc_GetMsalConfig,
    Ipc_Signin,
    Ipc_Signout,
    Ipc_GetAccount,
    Ipc_GetProfile,
    Ipc_RequestApi,
    Ipc_GetIotcApps,
    Ipc_GetIotcDevices,
    Ipc_GetIotcDeviceModules,
    Ipc_TestConnection,
    Ipc_TestConnectionProgress,
    Ipc_FetchNodes,
    Ipc_FetchNodesProgress,
    Ipc_ReceiveMessage,
    IIpcResult,
    IIpcProgress
};
