import { IpcRendererEvent } from 'electron';
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIpcResult,
    IIpcProgress,
    IErrorResult,
    emptyErrorResult
} from '../../main/models/main';
import {
    AdxResourceType,
    IAdxSolution,
    emptySolution
} from '../../main/models/adxSolution';

export enum AuthenticationState {
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
    Authenticating = 'Authenticating',
    CouldNotAuthenticate = 'CouldNotAuthenticate'
}

export class MainStore {
    constructor() {
        makeAutoObservable(this);

        this.mapItemImageFromType = new Map<string, string>();
        this.mapItemImageFromType.set(AdxResourceType.IoTCentralApp, 'iotcentral.png');
        this.mapItemImageFromType.set(AdxResourceType.IoTCentralAppFeature, 'iotcentral.png');
        this.mapItemImageFromType.set(AdxResourceType.AzureDataExplorerCluster, 'adx.png');
        this.mapItemImageFromType.set(AdxResourceType.AzureDataExplorerFeature, 'adx.png');
        this.mapItemImageFromType.set(AdxResourceType.VirtualMachine, 'vm.png');
        this.mapItemImageFromType.set(AdxResourceType.ResourceGroup, 'resourcegroup.png');

        window.ipcApi[contextBridgeTypes.Ipc_ProvisionProgress](contextBridgeTypes.Ipc_ProvisionProgress, this.onProvisionProgress.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_StartProvisioningItem](contextBridgeTypes.Ipc_StartProvisioningItem, this.onStartProvisioningItem.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_SaveProvisioningResponse](contextBridgeTypes.Ipc_SaveProvisioningResponse, this.onSaveProvisioningResponse.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_EndProvisioning](contextBridgeTypes.Ipc_EndProvisioning, this.onEndProvisioning.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_ServiceError](contextBridgeTypes.Ipc_ServiceError, this.onServiceError.bind(this));
    }

    public adxSolution: IAdxSolution = emptySolution;
    public serviceError = emptyErrorResult;
    public mapItemImageFromType: Map<string, string>;
    public deployingItemId = '';
    public provisionProgress: IIpcProgress = {
        label: '',
        value: 0,
        total: 0
    };

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public clearServiceError(): void {
        runInAction(() => {
            this.serviceError = emptyErrorResult;
        });
    }

    public setServiceError(errorResult: IErrorResult): void {
        runInAction(() => {
            this.serviceError = errorResult;
        });
    }

    public async openSolution(loadLastConfiguration: boolean): Promise<IIpcResult> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_OpenConfiguration](loadLastConfiguration);
        if (response && response.result && response.payload) {
            runInAction(() => {
                this.adxSolution = response.payload;
            });
        }

        return response || {
            result: false,
            message: 'An unknown error occurred while trying to open a new configuration file.'
        };
    }

    public async startProvisioning(): Promise<IIpcResult> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_StartProvisioning](toJS(this.adxSolution));

        return response || {
            result: false,
            message: 'An unknown error occurred during the provisioning process.'
        };
    }

    private onStartProvisioningItem(_event: IpcRendererEvent, itemId: string): void {
        runInAction(() => {
            this.deployingItemId = itemId;
        });
    }

    private onSaveProvisioningResponse(_event: IpcRendererEvent, itemId: string, response: any): void {
        runInAction(() => {
            const configItem = this.adxSolution.configItems.find(item => item.id === itemId);
            if (configItem) {
                configItem.provisionResponse = response;
            }
        });

        void window.ipcApi[contextBridgeTypes.Ipc_SaveConfiguration](toJS(this.adxSolution));
    }

    private onProvisionProgress(_event: IpcRendererEvent, message: IIpcProgress): void {
        runInAction(() => {
            this.provisionProgress = message;
        });
    }

    private onEndProvisioning(_event: IpcRendererEvent): void {
        runInAction(() => {
            this.deployingItemId = '';
        });
    }

    private onServiceError(_event: IpcRendererEvent, errorResult: IErrorResult): void {
        runInAction(() => {
            this.serviceError = errorResult;
        });
    }
}
