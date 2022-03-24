import { IpcRendererEvent } from 'electron';
import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import { IIpcProgress } from '../../main/contextBridgeTypes';
import {
    IApiContext,
    IEndpoint,
    IBrowseNodesRequest,
    emptyAdapterConfig,
    IAdapterConfiguration
} from '../../main/models/industrialConnect';

export class IndustrialConnectStore {
    constructor() {
        makeAutoObservable(this);

        window.ipcApi[contextBridgeTypes.Ipc_TestConnectionProgress](contextBridgeTypes.Ipc_TestConnectionProgress, this.onTestConnectionProgress.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_FetchNodesProgress](contextBridgeTypes.Ipc_FetchNodesProgress, this.onFetchNodesProgress.bind(this));
    }

    public adapterConfig = emptyAdapterConfig;
    public waitingOnEndpointVerification = false;
    public waitingOnFetchNodes = false;
    public endpointVerified = false;
    public testConnectionProgress: IIpcProgress = {
        label: '',
        value: 0,
        total: 0
    };
    public fetchNodesProgress: IIpcProgress = {
        label: '',
        value: 0,
        total: 0
    };
    public browsedNodesResultFilePath: string;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async loadAdapterConfiguration(appId: string, deviceId: string): Promise<void> {
        const adapterConfig = await window.ipcApi[contextBridgeTypes.Ipc_GetAdapterConfiguration](appId, deviceId);
        if (adapterConfig) {
            runInAction(() => {
                this.adapterConfig = adapterConfig;
            });
        }
    }

    public async saveAdapterConfig(config: IAdapterConfiguration): Promise<void> {
        await window.ipcApi[contextBridgeTypes.Ipc_SetAdapterConfiguration](config);
    }

    public async testConnection(apiContext: IApiContext, opcEndpoint: IEndpoint): Promise<void> {
        runInAction(() => {
            this.waitingOnEndpointVerification = true;
        });

        try {
            const testConnectionResponse = await window.ipcApi[contextBridgeTypes.Ipc_TestConnection](apiContext, opcEndpoint);

            runInAction(() => {
                this.endpointVerified = testConnectionResponse.status === 200 && testConnectionResponse.payload.endpointVerified === true;
            });
        }
        catch (ex) {
            runInAction(() => {
                this.endpointVerified = false;

                this.serviceError = `An error occurred while testing the connection to the OPCUA server: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingOnEndpointVerification = false;
            });
        }
    }

    public async fetchNodes(apiContext: IApiContext, browseNodesRequest: IBrowseNodesRequest): Promise<void> {
        runInAction(() => {
            this.waitingOnFetchNodes = true;
        });

        try {
            const fetchNodesResponse = await window.ipcApi[contextBridgeTypes.Ipc_FetchNodes](apiContext, browseNodesRequest);

            runInAction(() => {
                this.browsedNodesResultFilePath = fetchNodesResponse.status === 200 ? fetchNodesResponse.payload.fetchedNodesFilePath : '';
            });
        }
        catch (ex) {
            runInAction(() => {
                this.browsedNodesResultFilePath = '';

                this.serviceError = `An error occurred while attempting to browse the node heirarchy on the OPCUA server: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingOnFetchNodes = false;
            });
        }
    }

    private onTestConnectionProgress(_event: IpcRendererEvent, message: IIpcProgress): void {
        runInAction(() => {
            this.testConnectionProgress = message;
        });
    }

    private onFetchNodesProgress(_event: IpcRendererEvent, message: IIpcProgress): void {
        runInAction(() => {
            this.fetchNodesProgress = message;
        });
    }
}
