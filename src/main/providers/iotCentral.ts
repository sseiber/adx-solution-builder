/* eslint-disable max-len */
import {
    BrowserWindow,
    IpcMain,
    IpcMainInvokeEvent
} from 'electron';
import * as contextBridgeTypes from '../contextBridgeTypes';
import logger from '../logger';
import { AppProvider } from './appProvider';
import store, { StoreKeys } from '../store';
import {
    AzureManagementScope,
    IoTCentralApiScope
} from '../models/msalAuth';
import { MsalAuthProvider } from './auth/msalAuth';
import {
    IoTCentralBaseDomain,
    IIotCentralApp,
    IIotCentralDevice,
    IIotCentralModule
} from '../models/iotCentral';
import { requestApi } from '../utils';

const ModuleName = 'IoTCentralProvider';

export class IoTCentralProvider extends AppProvider {
    private authProvider: MsalAuthProvider;

    constructor(ipcMain: IpcMain, authWindow: BrowserWindow, authProvider: MsalAuthProvider) {
        super(ipcMain, authWindow);

        this.authProvider = authProvider;

        this.registerIpcEventHandlers();
    }

    protected registerIpcEventHandlers(): void {
        this.ipcMain.handle(contextBridgeTypes.Ipc_GetIotcApps, async (_event: IpcMainInvokeEvent): Promise<IIotCentralApp[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetIotcApps} handler`);

            let apps: IIotCentralApp[] = [];

            try {
                apps = await this.getIotCentralApps();
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetIotcApps} handler: ${ex.message}`);
            }

            return apps;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_GetIotcDevices, async (_event: IpcMainInvokeEvent, appSubdomain: string, appId: string): Promise<IIotCentralDevice[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetIotcDevices} handler`);

            let devices: IIotCentralDevice[] = [];

            try {
                devices = await this.getIotCentralDevices(appSubdomain, appId);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetIotcDevices} handler: ${ex.message}`);
            }

            return devices;
        });

        this.ipcMain.handle(contextBridgeTypes.Ipc_GetIotcDeviceModules, async (_event: IpcMainInvokeEvent, appSubdomain: string, deviceId: string): Promise<IIotCentralModule[]> => {
            logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetIotcDeviceModules} handler`);

            let modules: IIotCentralModule[] = [];

            try {
                modules = await this.getIotCentralDeviceModules(appSubdomain, deviceId);
            }
            catch (ex) {
                logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_GetIotcDeviceModules} handler: ${ex.message}`);
            }

            return modules;
        });
    }

    private async getIotCentralApps(): Promise<IIotCentralApp[]> {
        logger.log([ModuleName, 'info'], `getIotCentralApps`);

        let apps: IIotCentralApp[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(AzureManagementScope);
            const config = {
                method: 'get',
                url: `https://management.azure.com/subscriptions/${store.get(StoreKeys.subscriptionId)}/providers/Microsoft.IoTCentral/iotApps?api-version=2021-06-01`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response) {
                apps = (response?.payload?.value || []).reduce((result: IIotCentralApp[], iotcApp: any): IIotCentralApp[] => {
                    if (iotcApp.tags?.integrationType === 'industrial-connect') {
                        return result.concat({
                            id: iotcApp.applicationId,
                            name: iotcApp.name,
                            location: iotcApp.location,
                            applicationId: iotcApp.properties.applicationId,
                            displayName: iotcApp.properties.displayName,
                            subdomain: iotcApp.properties.subdomain
                        });
                    }
                    return result;
                }, []);
            }
            else {
                logger.log([ModuleName, 'error'], `Error during getIotCentralApps`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralApps: ${ex.message}`);
        }

        return apps;
    }

    private async getIotCentralDevices(appSubdomain: string, appId: string): Promise<IIotCentralDevice[]> {
        logger.log([ModuleName, 'info'], `getIotCentralDevices`);

        let devices: IIotCentralDevice[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'get',
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 200) {
                devices = (response?.payload?.value || []).map((device: IIotCentralDevice): IIotCentralDevice => {
                    return {
                        appId,
                        id: device.id,
                        displayName: device.displayName
                    };
                });
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralDevices: ${ex.message}`);
        }

        return devices;
    }

    private async getIotCentralDeviceModules(appSubdomain: string, deviceId: string): Promise<IIotCentralModule[]> {
        logger.log([ModuleName, 'info'], `getIotCentralDevices`);

        let modules: IIotCentralModule[] = [];

        try {
            const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);
            const config = {
                method: 'get',
                url: `https://${appSubdomain}.${IoTCentralBaseDomain}/api/devices/${deviceId}/modules?api-version=1.1-preview`,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            const response = await requestApi(config);
            if (response && response.status === 200) {
                modules = (response?.payload?.value || []).map((module: IIotCentralModule): IIotCentralModule => {
                    return {
                        deviceId,
                        name: module.name,
                        displayName: module.displayName
                    };
                });
            }
            else {
                logger.log([ModuleName, 'error'], `Error: status: ${response.status}`);
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during getIotCentralDeviceModules: ${ex.message}`);
        }

        return modules;
    }
}
