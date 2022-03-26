/* eslint-disable max-len */
import {
    app as electronApp,
    shell,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    dialog,
    app
} from 'electron';
import logger from './logger';
import MenuBuilder from './menu';
import * as contextBridgeTypes from './contextBridgeTypes';
import store, { StoreKeys } from '../main/store';
import {
    IIpcResult
} from './models/main';
import {
    AdxResourceType,
    AdxConfigurationFileType,
    emptySolution,
    IAdxConfigurationItem,
    IAdxSolution
} from './models/adxSolution';
import {
    IAdapterConfiguration,
    emptyAdapterConfig
} from './models/industrialConnect';
import {
    AzureManagementScope
} from '../main/models/msalAuth';
import {
    MsalAuthProvider
} from './providers/auth/msalAuth';
import { IoTCentralProvider } from './providers/iotCentral';
import { IndustrialConnectProvider } from './providers/industrialConnect';
import {
    requestApi,
    sleep
} from './utils';
import {
    join as pathJoin,
    basename as pathBasename
} from 'path';
import { platform as osPlatform } from 'os';
import axios from 'axios';
import * as fse from 'fs-extra';

const ModuleName = 'MainApp';

enum AzureResourceApiType {
    AzureDeployment = 'AzureDeployment',
    IoTCentralApi = 'IoTCentralApi',
    AzureDataExplorerApi = 'AzureDataExplorerApi'
}
interface IAzureManagementApiResponse {
    status: number;
    message: string;
    headers: any;
    payload?: any;
}

// Magic constants produced by Forge's webpack to locate the main entry and preload files.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class MainApp {
    private mainWindow: BrowserWindow = null;
    private authProvider: MsalAuthProvider = null;
    private iotCentralProvider: IoTCentralProvider;
    private industrialConnectProvider: IndustrialConnectProvider;

    constructor() {
        this.registerEventHandlers();
    }

    public async initializeApp(): Promise<void> {
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_WEBPACK_ENTRY: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);

        // Create the main browser window
        this.createMainWindow();

        const menuBuilder = new MenuBuilder(this.mainWindow);
        menuBuilder.buildMenu();

        this.authProvider = new MsalAuthProvider(ipcMain, this.mainWindow, MAIN_WINDOW_WEBPACK_ENTRY);

        // initialize the auth provider from the cache for app startup
        await this.authProvider.initialize();

        this.iotCentralProvider = new IoTCentralProvider(ipcMain, this.mainWindow, this.authProvider);
        await this.iotCentralProvider.initialize();

        this.industrialConnectProvider = new IndustrialConnectProvider(ipcMain, this.mainWindow, this.authProvider);
        await this.industrialConnectProvider.initialize();

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            // this.mainWindow.webContents.openDevTools();
        });

        // and load the index.html of the app
        await this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    public createMainWindow(): void {
        logger.log([ModuleName, 'info'], `createMainWindow`);

        this.mainWindow = new BrowserWindow({
            width: 1280,
            height: 768,
            show: false,
            icon: pathJoin(this.getAssetsPath(), osPlatform() === 'win32' ? 'icon.ico' : 'icons/64x64.png'),
            webPreferences: {
                // nodeIntegration: true,
                contextIsolation: true,
                preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
            }
        });

        this.mainWindow.webContents.on('will-redirect', (_event: Electron.Event, responseUrl: string) => {
            logger.log([ModuleName, 'info'], `will-redirect url found: ${responseUrl}`);
        });
    }

    private getAssetsPath(): string {
        return electronApp.isPackaged
            ? pathJoin(process.resourcesPath, 'assets')
            : pathJoin(__dirname, '../renderer/assets');
    }

    private registerEventHandlers(): void {
        ipcMain.handle(contextBridgeTypes.Ipc_Log, this.log.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_OpenConfiguration, this.openConfiguration.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_SaveConfiguration, this.saveConfiguration.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_StartProvisioning, this.startProvisioning.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_GetAdapterConfiguration, this.getAdapterConfiguration.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_SetAdapterConfiguration, this.setAdapterConfiguration.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_OpenLink, this.openLink.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_RequestApi, this.internalRequestApi.bind(this));
    }

    private async log(_event: IpcMainInvokeEvent, tags: string[], message: string): Promise<void> {
        logger.log(tags, message);
    }

    private async openConfiguration(_event: IpcMainInvokeEvent, loadLastConfiguration: boolean): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenConfiguration} handler`);

        const result: IIpcResult = {
            result: true,
            message: '',
            payload: emptySolution
        };

        try {
            if (loadLastConfiguration) {
                const lastConfigurationPath = store.get(StoreKeys.lastConfiguration);
                const lastConfigurationResult = fse.readJsonSync(lastConfigurationPath);

                result.payload = lastConfigurationResult || emptySolution;

                return result;
            }

            const openFileResult = await dialog.showOpenDialog(this.mainWindow, {
                title: 'Open IoT Central configuration',
                defaultPath: app.getPath('home'),
                buttonLabel: 'Open config',
                properties: ['openFile']
            });

            const configFilePath = openFileResult.canceled ? '' : openFileResult.filePaths[0];
            if (configFilePath) {
                // Configurations are copied to the electron local storage directory
                // and modified there. Opening a new configuration file will replace
                // the cached/last-opened configuration file.
                const configurationResult = fse.readJSONSync(configFilePath);

                // Configuration files are just pure JSON files. Look for the magic
                // GUID identifier to help ensure this is actually a compatible file.
                if (!configurationResult?.fileType || configurationResult.fileType !== AdxConfigurationFileType) {
                    result.result = false;
                    result.message = `Error: the selected file was either malformed or was not an ADX solution configuration file.`;
                    result.payload = emptySolution;

                    logger.log([ModuleName, 'error'], result.message);
                }
                else {
                    const destinationCachePath = pathJoin(app.getPath('appData'), app.getName(), 'adxConfigurationCache');
                    fse.ensureDirSync(destinationCachePath);

                    const destinationConfigFilePath = pathJoin(destinationCachePath, pathBasename(configFilePath));
                    fse.copyFileSync(configFilePath, destinationConfigFilePath);

                    store.set(StoreKeys.lastConfiguration, destinationConfigFilePath);

                    result.payload = configurationResult;
                }
            }
        }
        catch (ex) {
            result.result = false;
            result.message = `Error in ipcMain ${contextBridgeTypes.Ipc_OpenConfiguration} handler: ${ex.message}`;
            result.payload = emptySolution;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async saveConfiguration(_event: IpcMainInvokeEvent, adxSolution: IAdxSolution): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `saveConfiguration`);

        const result: IIpcResult = {
            result: true,
            message: 'Succeeded'
        };

        try {
            const configFilePath = store.get(StoreKeys.lastConfiguration);

            if (configFilePath) {
                fse.writeJSONSync(configFilePath, adxSolution);
            }
        }
        catch (ex) {
            result.result = false;
            result.message = `Error saving configuration file: ${ex.message}`;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async startProvisioning(_event: IpcMainInvokeEvent, adxSolution: IAdxSolution): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `startProvisioning`);

        void this.doProvisioning(adxSolution);

        return {
            result: true,
            message: 'Provisioning started'
        };
    }

    private async doProvisioning(adxSolution: IAdxSolution): Promise<void> {
        logger.log([ModuleName, 'info'], `Starting doProvisioning loop...`);

        const errorResult = {
            status: 0,
            title: 'Azure Resource Provisioning',
            message: ''
        };

        const subscriptionId = store.get(StoreKeys.subscriptionId);
        const resourceGroupName = adxSolution.configItems[0].resourceName;

        for (const configItem of adxSolution.configItems) {
            try {
                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_StartProvisioningItem, configItem.id);

                const config = await this.getRequestApiConfig(configItem, subscriptionId, resourceGroupName, AzureManagementScope);
                const provisionResponse = await this.azureManagementRequestApi(config);

                if (provisionResponse.status < 200 || provisionResponse.status > 299) {
                    errorResult.status = provisionResponse.status;
                    errorResult.message = `Error during provisioning step: ${provisionResponse.message}`;
                    logger.log([ModuleName, 'error'], errorResult.message);

                    break;
                }

                logger.log([ModuleName, 'info'], `Request succeeded - checking for long running operation status...`);

                if (configItem.resourceApiType === AzureResourceApiType.AzureDeployment) {
                    const succeeded = await this.waitForOperationWithStatus(provisionResponse.headers);
                    if (succeeded) {
                        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_SaveProvisioningResponse, configItem.id, provisionResponse.payload);
                    }
                }
            }
            catch (ex) {
                errorResult.status = 500;
                errorResult.message = `Error during provisioning step - ${configItem.name}: ${ex.message}`;
                logger.log([ModuleName, 'error'], errorResult.message);
            }
            finally {
                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_EndProvisioning);
            }
        }

        if (errorResult.status) {
            this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ServiceError, errorResult);
        }

        logger.log([ModuleName, 'info'], `Leaving doProvisioning loop...`);
    }

    private async waitForOperationWithStatus(operationHeaders: any): Promise<boolean> {
        logger.log([ModuleName, 'info'], `waitForOperationWithStatus`);

        const managementUrl = operationHeaders['azure-asyncoperation'] || operationHeaders['location'] || '';
        const retryAfter = operationHeaders['retry-after'] || 5;

        if (!managementUrl) {
            return true;
        }

        let response;

        do {
            const accessToken = await this.authProvider.getScopedToken(AzureManagementScope);
            response = await this.azureManagementRequestApi({
                method: 'get',
                url: managementUrl,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            logger.log([ModuleName, 'info'], `Operation status is code: ${response.status}, status: ${response?.payload?.status || 'unknown'}`);

            if ((response.status !== 200 && response.status !== 202) || response?.payload?.status !== 'Running') {
                break;
            }

            const value = response.payload?.percentComplete || 0.5;

            this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, {
                label: response.payload.status || 'Provisining...',
                value: value >= 1 ? value : value * 100,
                total: 100
            });

            await sleep(1000 * retryAfter);
        } while (response.status === 200 || response.status === 202);

        return response?.payload?.status === 'Succeeded';
    }

    private async getAdapterConfiguration(_event: IpcMainInvokeEvent, appId: string, deviceId: string): Promise<IAdapterConfiguration> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_GetAdapterConfiguration} handler`);

        return {
            ...emptyAdapterConfig,
            appId,
            deviceId
        };
    }

    private async setAdapterConfiguration(_event: IpcMainInvokeEvent, _adapterConfig: IAdapterConfiguration): Promise<boolean> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_SetAdapterConfiguration} handler`);

        return true;
    }

    private async openLink(_event: IpcMainInvokeEvent, url: string): Promise<void> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenLink} handler`);

        void shell.openExternal(url);
    }

    private async getRequestApiConfig(configItem: IAdxConfigurationItem, subscriptionId: string, resourceGroupName: string, apiScope: string): Promise<any> {
        const accessToken = await this.authProvider.getScopedToken(apiScope);

        let config;

        switch (configItem.itemType) {
            case AdxResourceType.ResourceGroup:
                config = {
                    method: 'put',
                    url: `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${configItem.resourceName}?api-version=2021-04-01`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },
                    data: configItem.payload
                };

                break;

            case AdxResourceType.IoTCentralApp:
                config = {
                    method: 'put',
                    url: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.IoTCentral/iotApps/${configItem.resourceName}?api-version=2021-06-01`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },
                    data: configItem.payload
                };

                break;

            case AdxResourceType.AzureDataExplorerCluster:
                config = {
                    method: 'put',
                    url: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Kusto/clusters/${configItem.resourceName}?api-version=2022-02-01`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },
                    data: configItem.payload
                };

                break;

            case AdxResourceType.VirtualMachine:
                break;
        }

        return {
            ...config,
            ...{
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        };
    }

    private async azureManagementRequestApi(config: any): Promise<IAzureManagementApiResponse> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_RequestApi} handler`);

        const apiResponse: IAzureManagementApiResponse = {
            status: 200,
            message: '',
            headers: []
        };

        try {
            const axiosResponse = await axios.request(config);

            apiResponse.headers = axiosResponse.headers;

            apiResponse.status = axiosResponse.status;
            apiResponse.message = axiosResponse.statusText || `${axiosResponse.status}`;

            if (axiosResponse.data) {
                apiResponse.payload = axiosResponse.data;
            }

            logger.log([ModuleName, apiResponse.status > 299 ? 'error' : 'info'], `requestApi: status: ${apiResponse.status}`);
        }
        catch (ex) {
            if (ex.isAxiosError && ex.response) {
                apiResponse.status = ex.response.status;
                apiResponse.message = ex.response?.data?.error?.message || `An error occurred during the request: ${ex.response.status}`;
            }
            else {
                apiResponse.status = 500;
                apiResponse.message = `An error occurred during the request: ${ex.message}`;
            }
        }

        return apiResponse;
    }

    private async internalRequestApi(_event: IpcMainInvokeEvent, config: any): Promise<any> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_RequestApi} handler`);

        let response;

        try {
            response = await requestApi(config);
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_RequestApi} handler: ${ex.message}`);
        }

        return response;
    }

    // private createAuthWindow(): BrowserWindow {
    //     logger.log([ModuleName, 'info'], `createAuthWindow`);

    //     const window = new BrowserWindow({
    //         width: 400,
    //         height: 600
    //     });

    //     window.on('closed', () => {
    //         logger.log([ModuleName, 'info'], `Main window received 'close'`);

    //         this.mainWindow = null;
    //     });

    //     return window;
    // }
}
