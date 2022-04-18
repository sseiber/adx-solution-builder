import { IpcRendererEvent } from 'electron';
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIpcResult,
    ProvisioningState,
    IIpcProgress,
    emptyProgress,
    IServiceError,
    emptyServiceError
} from '../../main/models/main';
import {
    AdxDeploymentItem,
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

        this.mapItemTypeToImageName = new Map<string, string>();
        this.mapItemTypeToImageName.set(AdxDeploymentItem.ResourceGroup, 'resourcegroup.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcCreateApp, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcImportEdgeCapabilityModel, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcRegisterEdgeDevice, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcGetEdgeDeviceAttestation, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.VirtualMachine, 'vm.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcRegisterIiotDevice, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcGetIiotDeviceAttestation, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcProvisionIiotDevice, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.AdxCreateCluster, 'adx.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcConfigureCdeDestination, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.IotcConfigureCdeExport, 'iotcentral.png');
        this.mapItemTypeToImageName.set(AdxDeploymentItem.AdxConfigureDataImport, 'adx.png');

        window.ipcApi[contextBridgeTypes.Ipc_ProvisionProgress](contextBridgeTypes.Ipc_ProvisionProgress, this.onProvisionProgress.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_StartProvisioningItem](contextBridgeTypes.Ipc_StartProvisioningItem, this.onStartProvisioningItem.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_SaveProvisioningResponse](contextBridgeTypes.Ipc_SaveProvisioningResponse, this.onSaveProvisioningResponse.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_EndProvisioning](contextBridgeTypes.Ipc_EndProvisioning, this.onEndProvisioning.bind(this));
        window.ipcApi[contextBridgeTypes.Ipc_ServiceError](contextBridgeTypes.Ipc_ServiceError, this.onServiceError.bind(this));
    }

    public adxSolution: IAdxSolution = emptySolution;
    public serviceError: IServiceError = emptyServiceError;
    public mapItemTypeToImageName: Map<string, string>;
    public provisioningState = ProvisioningState.Inactive;
    public deployingItemId = '';
    public provisionProgress = emptyProgress;

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public clearServiceError(): void {
        runInAction(() => {
            this.serviceError = emptyServiceError;
        });
    }

    public setServiceError(error: IServiceError): void {
        runInAction(() => {
            this.serviceError = error;
        });
    }

    public async openSolution(loadLastSolution: boolean): Promise<IIpcResult> {
        const response = await window.ipcApi[contextBridgeTypes.Ipc_OpenSolution](loadLastSolution);
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
        runInAction(() => {
            this.provisioningState = ProvisioningState.Active;
        });

        const response = await window.ipcApi[contextBridgeTypes.Ipc_StartProvisioning](toJS(this.adxSolution));

        return response || {
            result: false,
            message: 'An unknown error occurred during the provisioning process.'
        };
    }

    public async getProvisioningState(): Promise<ProvisioningState> {
        return window.ipcApi[contextBridgeTypes.Ipc_ProvisioningState]();
    }

    public async openLink(url: string): Promise<void> {
        void window.ipcApi[contextBridgeTypes.Ipc_OpenLink](url);
    }

    private onStartProvisioningItem(_event: IpcRendererEvent, itemId: string): void {
        runInAction(() => {
            this.deployingItemId = itemId;
            this.provisionProgress = emptyProgress;
        });
    }

    private onSaveProvisioningResponse(_event: IpcRendererEvent, itemId: string, response: any): void {
        runInAction(() => {
            const configItem = this.adxSolution.configItems.find(item => item.id === itemId);
            if (configItem) {
                configItem.provisionResponse = response;
            }
        });

        void window.ipcApi[contextBridgeTypes.Ipc_SaveSolution](toJS(this.adxSolution));
    }

    private onProvisionProgress(_event: IpcRendererEvent, message: IIpcProgress): void {
        runInAction(() => {
            this.provisionProgress = message;
        });
    }

    private onEndProvisioning(_event: IpcRendererEvent): void {
        runInAction(() => {
            this.provisioningState = ProvisioningState.Inactive;
            this.deployingItemId = '';
            this.provisionProgress = emptyProgress;
        });
    }

    private onServiceError(_event: IpcRendererEvent, error: IServiceError): void {
        runInAction(() => {
            this.serviceError = error;
        });
    }
}
