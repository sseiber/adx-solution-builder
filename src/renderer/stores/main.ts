import { IpcRendererEvent } from 'electron';
import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIpcResult,
    IIpcProgress
} from '../../main/contextBridgeTypes';
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

        this.solutionImageFromResourceType = new Map<string, string>();
        this.solutionImageFromResourceType.set(AdxResourceType.IoTCentralApp, 'iotcentral.png');
        this.solutionImageFromResourceType.set(AdxResourceType.IoTCentralAppFeature, 'iotcentral.png');
        this.solutionImageFromResourceType.set(AdxResourceType.AzureDataExplorerCluster, 'adx.png');
        this.solutionImageFromResourceType.set(AdxResourceType.AzureDataExplorerFeature, 'adx.png');
        this.solutionImageFromResourceType.set(AdxResourceType.VirtualMachine, 'vm.png');

        window.ipcApi[contextBridgeTypes.Ipc_ProvisionProgress](contextBridgeTypes.Ipc_ProvisionProgress, this.onProvisionProgress.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_StartProvisioningItem](contextBridgeTypes.Ipc_StartProvisioningItem, this.onStartProvisioningItem.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_EndProvisioning](contextBridgeTypes.Ipc_EndProvisioning, this.onEndProvisioning.bind(this));
    }

    public configuration: IAdxSolution = emptySolution;
    public serviceError = '';
    public solutionImageFromResourceType: Map<string, string>;
    public deployingItemId = '';
    public provisionProgress: IIpcProgress = {
        label: '',
        value: 0,
        total: 0
    };

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async openSolution(loadLastConfiguration: boolean): Promise<IIpcResult> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_OpenConfiguration](loadLastConfiguration);
        if (response && response.result && response.payload) {
            runInAction(() => {
                this.configuration = response.payload;
            });
        }

        return response || {
            result: false,
            message: 'An unknown error occurred while trying to open a new configuration file.'
        };
    }

    public async startProvisioning(): Promise<IIpcResult> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_StartProvisioning]();

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
}
