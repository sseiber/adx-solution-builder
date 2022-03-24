import { makeAutoObservable, runInAction } from 'mobx';
import * as contextBridgeTypes from '../../main/contextBridgeTypes';
import {
    IIotCentralApp,
    IIotCentralDevice,
    IIotCentralModule
} from '../../main/models/iotCentral';

export class IotCentralStore {
    constructor() {
        makeAutoObservable(this);
    }

    public waitingIotCentralCall = false;
    public mapApps: Map<string, IIotCentralApp> = new Map<string, IIotCentralApp>();
    public mapAppDevices: Map<string, IIotCentralDevice[]> = new Map<string, IIotCentralDevice[]>();
    public mapDeviceApp: Map<string, IIotCentralApp> = new Map<string, IIotCentralApp>();
    public mapDeviceModules: Map<string, IIotCentralModule[]> = new Map<string, IIotCentralModule[]>();

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    public async getIotCentralApps(refresh: boolean): Promise<void> {
        runInAction(() => {
            this.waitingIotCentralCall = true;
        });

        try {
            if (!refresh && this.mapApps.size > 0) {
                return;
            }

            const apps = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcApps]();
            if (apps) {
                runInAction(() => {
                    this.mapApps.clear();
                    this.mapAppDevices.clear();
                    this.mapDeviceApp.clear();
                    this.mapDeviceModules.clear();

                    for (const app of apps) {
                        this.mapApps.set(app.applicationId, app);
                    }
                });
            }
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An error occurred while attempting to get the list of IoT Central apps: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingIotCentralCall = false;
            });
        }
    }

    public async getIotCentralDevices(appId: string, refresh: boolean): Promise<void> {
        runInAction(() => {
            this.waitingIotCentralCall = true;
        });

        try {
            if (!refresh && this.mapAppDevices.get(appId)?.length) {
                return;
            }

            const appSubdomain = this.mapApps.get(appId).subdomain;
            const devices = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDevices](appSubdomain, appId);
            if (devices) {
                runInAction(() => {
                    this.mapAppDevices.clear();
                    this.mapDeviceApp.clear();
                    this.mapDeviceModules.clear();

                    this.mapAppDevices.set(appId, devices);

                    for (const device of devices) {
                        this.mapDeviceApp.set(device.id, this.mapApps.get(appId));
                    }
                });
            }
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An error occurred while attempting to get the list of devices: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingIotCentralCall = false;
            });
        }
    }

    public async getDeviceModules(deviceId: string): Promise<void> {
        runInAction(() => {
            this.waitingIotCentralCall = true;
        });

        try {
            if (this.mapDeviceModules.size > 0) {
                return;
            }

            const appSubdomain = this.mapDeviceApp.get(deviceId).subdomain;
            const modules = await window.ipcApi[contextBridgeTypes.Ipc_GetIotcDeviceModules](appSubdomain, deviceId);
            if (modules) {
                runInAction(() => {
                    this.mapDeviceModules.clear();

                    this.mapDeviceModules.set(deviceId, modules);
                });
            }
        }
        catch (ex) {
            runInAction(() => {
                this.serviceError = `An error occurred while attempting to get the list of device modules: ${ex.message}`;
            });
        }
        finally {
            runInAction(() => {
                this.waitingIotCentralCall = false;
            });
        }
    }
}
