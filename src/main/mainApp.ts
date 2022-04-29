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
    IIpcResult,
    ProvisioningState,
    IAzureManagementApiResponse,
    IServiceResponse,
    serviceResponseSucceeded
} from './models/main';
import {
    IoTCentralBaseDomain
} from './models/iotCentral';
import {
    SbDeploymentItem,
    SbConfigurationFileType,
    emptySolution,
    ISbConfigurationItem,
    ISbSolution,
    AzureApiType
} from './models/sbSolution';
import {
    AzureDataExplorerApiScope,
    AzureManagementScope, IoTCentralApiScope
} from '../main/models/msalAuth';
import {
    MsalAuthProvider
} from './providers/auth/msalAuth';
import { IoTCentralProvider } from './providers/iotCentral';
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
import { differenceInSeconds } from 'date-fns';

const ModuleName = 'MainApp';

// Magic constants produced by Forge's webpack to locate the main entry and preload files.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const maxWaitForIotRuntimeStartup = (60 * 5);

export class MainApp {
    private mainWindow: BrowserWindow = null;
    private authProvider: MsalAuthProvider = null;
    private iotCentralProvider: IoTCentralProvider;
    private mapApiTypeToApiScope: Map<string, string> = new Map<string, string>();
    private mapDeploymentStepProps: Map<string, any> = new Map<string, any>();

    constructor() {
        this.registerEventHandlers();
    }

    public async initializeApp(): Promise<void> {
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_WEBPACK_ENTRY: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
        logger.log([ModuleName, 'info'], `MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);

        this.mapApiTypeToApiScope.set(AzureApiType.AzureResourceDeployment, AzureManagementScope);
        this.mapApiTypeToApiScope.set(AzureApiType.IoTCentralApi, IoTCentralApiScope);
        this.mapApiTypeToApiScope.set(AzureApiType.AzureDataExplorerApi, AzureDataExplorerApiScope);

        // Create the main browser window
        this.createMainWindow();

        const menuBuilder = new MenuBuilder(this.mainWindow);
        menuBuilder.buildMenu();

        this.authProvider = new MsalAuthProvider(ipcMain, this.mainWindow, MAIN_WINDOW_WEBPACK_ENTRY);

        // initialize the auth provider from the cache for app startup
        await this.authProvider.initialize();

        this.iotCentralProvider = new IoTCentralProvider(ipcMain, this.mainWindow, this.authProvider);
        await this.iotCentralProvider.initialize();

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
        ipcMain.handle(contextBridgeTypes.Ipc_OpenSolution, this.openSolution.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_SaveSolution, this.saveSolution.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_StartProvisioning, this.startProvisioning.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_ProvisioningState, this.provisioningState.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_OpenLink, this.openLink.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_RequestApi, this.internalApiRequest.bind(this));
    }

    private async log(_event: IpcMainInvokeEvent, tags: string[], message: string): Promise<void> {
        logger.log(tags, message);
    }

    private async openSolution(_event: IpcMainInvokeEvent, loadLastConfiguration: boolean): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenSolution} handler`);

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
                if (!configurationResult?.fileType || configurationResult.fileType !== SbConfigurationFileType) {
                    result.result = false;
                    result.message = `Error: the selected file was either malformed or was not an Solution Builder configuration file.`;
                    result.payload = emptySolution;

                    logger.log([ModuleName, 'error'], result.message);
                }
                else {
                    const destinationCachePath = pathJoin(app.getPath('appData'), app.getName(), 'sbConfigurationCache');
                    fse.ensureDirSync(destinationCachePath);

                    const destinationConfigFilePath = pathJoin(destinationCachePath, pathBasename(configFilePath));
                    fse.copyFileSync(configFilePath, destinationConfigFilePath);

                    store.set(StoreKeys.lastConfiguration, destinationConfigFilePath);
                    store.set(StoreKeys.provisioningState, false);

                    result.payload = configurationResult;
                }
            }
        }
        catch (ex) {
            result.result = false;
            result.message = `Error in ipcMain ${contextBridgeTypes.Ipc_OpenSolution} handler: ${ex.message}`;
            result.payload = emptySolution;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async saveSolution(_event: IpcMainInvokeEvent, sbSolution: ISbSolution): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `saveConfiguration`);

        const result: IIpcResult = {
            result: true,
            message: 'Succeeded'
        };

        try {
            const configFilePath = store.get(StoreKeys.lastConfiguration);

            if (configFilePath) {
                fse.writeJSONSync(configFilePath, sbSolution);
            }
        }
        catch (ex) {
            result.result = false;
            result.message = `Error saving configuration file: ${ex.message}`;

            logger.log([ModuleName, 'error'], result.message);
        }

        return result;
    }

    private async startProvisioning(_event: IpcMainInvokeEvent, sbSolution: ISbSolution): Promise<IIpcResult> {
        logger.log([ModuleName, 'info'], `startProvisioning`);

        void this.doProvisioning(sbSolution);

        return {
            result: true,
            message: 'Provisioning started'
        };
    }

    private async provisioningState(_event: IpcMainInvokeEvent): Promise<ProvisioningState> {
        logger.log([ModuleName, 'info'], `provisioningState`);

        return store.get(StoreKeys.provisioningState) ? ProvisioningState.Active : ProvisioningState.Inactive;
    }

    private async doProvisioning(sbSolution: ISbSolution): Promise<void> {
        logger.log([ModuleName, 'info'], `Starting doProvisioning loop...`);

        let response: IServiceResponse = {
            status: 200,
            message: ''
        };

        store.set(StoreKeys.provisioningState, true);

        const subscriptionId = store.get(StoreKeys.subscriptionId);

        this.mapDeploymentStepProps.clear();

        for (const configItem of sbSolution.configItems) {
            try {
                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_StartProvisioningItem, configItem.id);
                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, 'Provisioning...');
                await sleep(1000);

                logger.log([ModuleName, 'info'], `Processing step: ${configItem.name}, type: ${configItem.resourceApiType}`);

                response = await this.executeDeploymentStep(configItem, sbSolution, subscriptionId);
            }
            catch (ex) {
                response.status = 500;
                response.message = `Error during provisioning step - ${configItem.name}: ${ex.message}`;

                logger.log([ModuleName, 'error'], response.message);
            }
            finally {
                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, 'Provisioning step finished');
                await sleep(1000);

                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_EndProvisioning);
            }

            if (!serviceResponseSucceeded(response)) {
                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ServiceError, {
                    status: response.status,
                    title: configItem.itemType,
                    message: response.message
                });

                break;
            }
        }

        store.set(StoreKeys.provisioningState, false);

        logger.log([ModuleName, 'info'], `Leaving doProvisioning loop...`);
    }

    private async openLink(_event: IpcMainInvokeEvent, url: string): Promise<void> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_OpenLink} handler`);

        void shell.openExternal(url);
    }

    private async executeDeploymentStep(configItem: ISbConfigurationItem, sbSolution: ISbSolution, subscriptionId: string): Promise<IServiceResponse> {
        logger.log([ModuleName, 'info'], `executeDeploymentStep for config item type: ${configItem.itemType}`);

        let response: IServiceResponse = {
            status: 200,
            message: ''
        };

        try {
            const resourceName = `${configItem.resourceName}${sbSolution.resourceSuffixName}`;
            const apiConfig: any = {};

            switch (configItem.itemType) {
                case SbDeploymentItem.ResourceGroup: {
                    apiConfig.method = 'put';
                    apiConfig.url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceName}?api-version=2021-04-01`;
                    apiConfig.data = {
                        ...configItem.payload,
                        tags: {
                            ...(configItem.payload?.tags || {}),
                            iotcsbid: sbSolution.id
                        }
                    };

                    break;
                }

                case SbDeploymentItem.IotcCreateApp: {
                    const resourceGroupName = this.mapDeploymentStepProps.get(SbDeploymentItem.ResourceGroup).name;

                    apiConfig.method = 'put';
                    apiConfig.url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.IoTCentral/iotApps/${resourceName}?api-version=2021-06-01`;
                    apiConfig.data = {
                        ...configItem.payload,
                        properties: {
                            displayName: `${configItem.payload.properties.displayName}${sbSolution.resourceSuffixName}`,
                            subdomain: `${configItem.payload.properties.subdomain}${sbSolution.resourceSuffixName}`
                        },
                        tags: {
                            ...(configItem.payload?.tags || {}),
                            iotcsbid: sbSolution.id
                        }
                    };

                    break;
                }

                case SbDeploymentItem.IotcImportEdgeCapabilityModel: {
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;

                    apiConfig.method = 'put';
                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/deviceTemplates/${configItem.payload.templateId}?api-version=1.1-preview`;
                    apiConfig.data = configItem.payload.template;

                    break;
                }

                case SbDeploymentItem.IotcRegisterEdgeDevice: {
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;

                    apiConfig.method = 'put';
                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/devices/${configItem.payload.deviceId}?api-version=1.1-preview`;
                    apiConfig.data = configItem.payload.deviceConfig;

                    break;
                }

                case SbDeploymentItem.IotcGetEdgeDeviceAttestation: {
                    apiConfig.method = 'get';
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;
                    const deviceId = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcRegisterEdgeDevice).id;

                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/devices/${deviceId}/credentials?api-version=1.1-preview`;

                    break;
                }

                case SbDeploymentItem.VirtualMachine: {
                    const resourceGroupName = this.mapDeploymentStepProps.get(SbDeploymentItem.ResourceGroup).name;

                    const templateParameters = configItem.payload.properties.template.parameters;
                    templateParameters.dnsLabelPrefix.defaultValue = sbSolution.resourceSuffixName;
                    templateParameters.adminUsername.defaultValue = `${sbSolution.resourceSuffixName}_admin`;

                    const deviceAttestation = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcGetEdgeDeviceAttestation);

                    templateParameters.scopeId.defaultValue = deviceAttestation.idScope;
                    templateParameters.deviceId.defaultValue = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcRegisterEdgeDevice).id;
                    templateParameters.symmetricKey.defaultValue = deviceAttestation.symmetricKey.primaryKey;

                    apiConfig.method = 'put';
                    apiConfig.url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroupName}/providers/Microsoft.Resources/deployments/${resourceName}?api-version=2020-10-01`;
                    apiConfig.data = {
                        ...configItem.payload,
                        tags: {
                            ...(configItem.payload?.tags || {}),
                            iotcsbid: sbSolution.id
                        }
                    };

                    break;
                }

                case SbDeploymentItem.IotcRegisterIiotDevice: {
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;

                    apiConfig.method = 'put';
                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/devices/${configItem.payload.deviceId}?api-version=1.1-preview`;
                    apiConfig.data = configItem.payload.deviceConfig;

                    break;
                }

                case SbDeploymentItem.IotcGetIiotDeviceAttestation: {
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;
                    const deviceId = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcRegisterIiotDevice).id;

                    apiConfig.method = 'get';
                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/devices/${deviceId}/credentials?api-version=1.1-preview`;

                    break;
                }

                case SbDeploymentItem.IotEdgeRuntimeStartup: {
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;
                    const moduleId = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcRegisterEdgeDevice).id;
                    const opcEndpoint = `${subdomain}.westus2.cloudapp.azure.com`; // this.mapDeploymentStepProps.get(SbDeploymentItem.VirtualMachine);
                    const opcEndpointParameter = configItem.payload.testConnectionRequest.opcEndpoint;
                    opcEndpointParameter.uri = `opc.tcp://${opcEndpoint}:50000`;

                    apiConfig.method = 'post';
                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/devices/${moduleId}/modules/${configItem.payload.moduleName}/commands/cmTestConnection?api-version=1.1-preview`;
                    apiConfig.data = {
                        connectionTimeout: 5,
                        responseTimeout: 5,
                        request: configItem.payload.testConnectionRequest
                    };

                    const startTime = Date.now();
                    let waitingForIoTEdgeRuntime = true;
                    do {
                        const waitResponse = await this.executeApi(apiConfig, configItem);
                        if (serviceResponseSucceeded(waitResponse) && waitResponse.payload?.response?.status === 200 && (waitResponse.payload?.response?.message || '').startsWith('testConnection succeeded')) {
                            waitingForIoTEdgeRuntime = false;

                            break;
                        }

                        const waitSeconds = differenceInSeconds(Date.now(), startTime);

                        logger.log([ModuleName, 'info'], `Waiting for IoT Edge runtime startup - elapsed ${waitSeconds} sec....`);

                        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, `Provisioning (est. ${Math.floor((waitSeconds * 100) / maxWaitForIotRuntimeStartup)}%)...`);

                        // wait for Azure IoT Edge runtime to startup and provision the manifest (5min. max)
                        if (waitSeconds > maxWaitForIotRuntimeStartup) {
                            response.status = 500;
                            response.message = 'The Azure IoT runtime is taking longer than expected. You can try to provision the remaining steps manually. See the README for help with this.';

                            break;
                        }
                        await sleep(3000);
                    } while (waitingForIoTEdgeRuntime);

                    break;
                }

                case SbDeploymentItem.IotcProvisionIiotDevice: {
                    const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;
                    const edgeDeviceId = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcRegisterEdgeDevice).id;

                    const iiotDeviceAttestation = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcGetIiotDeviceAttestation);
                    const deviceCredentialParameters = configItem.payload.addOrUpdateAssetRequest.asset.deviceCredentials;
                    deviceCredentialParameters.idScope = iiotDeviceAttestation.idScope;
                    deviceCredentialParameters.primaryKey = iiotDeviceAttestation.symmetricKey.primaryKey;
                    deviceCredentialParameters.secondaryKey = iiotDeviceAttestation.symmetricKey.secondaryKey;

                    const opcEndpoint = `${subdomain}.westus2.cloudapp.azure.com`; // this.mapDeploymentStepProps.get(SbDeploymentItem.VirtualMachine);
                    const opcEndpointParameter = configItem.payload.addOrUpdateAssetRequest.asset.opcEndpoint;
                    opcEndpointParameter.uri = `opc.tcp://${opcEndpoint}:50000`;


                    apiConfig.method = 'post';
                    apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/devices/${edgeDeviceId}/modules/${configItem.payload.edgeModuleId}/commands/cmAddOrUpdateAssets?api-version=1.1-preview`;
                    apiConfig.data = {
                        connectionTimeout: 30,
                        responseTimeout: 30,
                        request: [
                            configItem.payload.addOrUpdateAssetRequest
                        ]
                    };

                    break;
                }

                case SbDeploymentItem.AdxCreateCluster: {
                    const resourceGroupName = this.mapDeploymentStepProps.get(SbDeploymentItem.ResourceGroup).name;

                    apiConfig.method = 'put';
                    apiConfig.url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Kusto/clusters/${resourceName}?api-version=2022-02-01`;
                    apiConfig.data = {
                        ...configItem.payload,
                        tags: {
                            ...(configItem.payload?.tags || {}),
                            iotcsbid: sbSolution.id
                        }
                    };

                    break;
                }

                case SbDeploymentItem.AdxCreateDatabaseTable:
                    // ClientRequestProperities options:
                    // https://github.com/MicrosoftDocs/dataexplorer-docs/blob/main/data-explorer/kusto/api/netfx/request-properties.md
                    break;

                case SbDeploymentItem.IotcConfigureCdeDestination: {
                    // const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;

                    // apiConfig.method = 'put';
                    // apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/dataExport/destinations/${configItem.payload.destinationId}?api-version=1.1-preview`;
                    // apiConfig.data = configItem.payload.addOrUpdateAssetRequest;

                    break;
                }

                case SbDeploymentItem.IotcConfigureCdeExport: {
                    // const subdomain = this.mapDeploymentStepProps.get(SbDeploymentItem.IotcCreateApp).properties.subdomain;

                    // apiConfig.method = 'put';
                    // apiConfig.url = `https://${subdomain}.${IoTCentralBaseDomain}/api/dataExport/export/${configItem.payload.exportId}?api-version=1.1-preview`;
                    // apiConfig.data = configItem.payload.addOrUpdateAssetRequest;

                    break;
                }

                case SbDeploymentItem.AdxConfigureDataImport:
                    // case: configure adx to import dashboards, etc.

                    break;

                default:
                    response.status = 400;
                    response.message = `Unknown config item type: ${configItem.itemType}`;

                    logger.log([ModuleName, 'error'], response.message);
            }

            if (serviceResponseSucceeded(response) && configItem.itemType !== SbDeploymentItem.IotEdgeRuntimeStartup) {
                response = await this.executeApi(apiConfig, configItem);

                this.mapDeploymentStepProps.set(configItem.itemType, response.payload);

                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_SaveProvisioningResponse, configItem.id, response.payload);

                if (configItem?.pauseStep) {
                    await sleep(configItem?.pauseStep || 0);
                }
            }
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error in deployment step: ${ex.message}`);
        }

        return response;
    }

    private async executeApi(apiConfig: any, configItem: ISbConfigurationItem): Promise<IServiceResponse> {
        let response: IServiceResponse = {
            status: 200,
            message: ''
        };

        const apiScope = this.mapApiTypeToApiScope.get(configItem.resourceApiType);

        const accessToken = await this.authProvider.getScopedToken(apiScope);
        if (!accessToken) {
            response.status = 401;
            response.message = `Could not retrieve a valid authentication token`;

            logger.log([ModuleName, 'error'], response.message);

            return response;
        }

        const apiConfigWithAuthToken = {
            ...apiConfig,
            headers: {
                ...apiConfig.headers,
                Authorization: `Bearer ${accessToken}`
            }
        };

        if (configItem.resourceApiType === AzureApiType.AzureResourceDeployment) {
            response = await this.executeAzureResourceApiRequest(apiConfigWithAuthToken);
        }
        else {
            response = await this.azureApiRequest(apiConfigWithAuthToken);
        }

        return response;
    }

    private async executeAzureResourceApiRequest(apiConfig: any): Promise<IServiceResponse> {
        const mainResponse = await this.azureApiRequest(apiConfig);
        if (!serviceResponseSucceeded(mainResponse)) {
            logger.log([ModuleName, 'error'], `Error during provisioning step: ${mainResponse.message}`);

            return mainResponse;
        }

        logger.log([ModuleName, 'info'], `Request succeeded - checking for long running operation status...`);

        const lroResponse = await this.waitForOperationWithStatus(mainResponse.headers);
        if (!serviceResponseSucceeded(lroResponse)) {
            logger.log([ModuleName, 'warning'], `Long running operation status returned an error - ${lroResponse.status}`);
        }

        return mainResponse;
    }

    private async waitForOperationWithStatus(operationHeaders: any): Promise<IServiceResponse> {
        logger.log([ModuleName, 'info'], `waitForOperationWithStatus`);

        let response: IAzureManagementApiResponse = {
            status: 200,
            message: ''
        };

        try {
            const managementUrl = operationHeaders['azure-asyncoperation'] || operationHeaders['location'] || '';
            const retryAfter = operationHeaders['retry-after'] || 5;

            if (!managementUrl) {
                // not an error
                return response;
            }

            do {
                const accessToken = await this.authProvider.getScopedToken(AzureManagementScope);
                response = await this.azureApiRequest({
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

                this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, response.payload.status || 'Provisioning...');

                await sleep(1000 * retryAfter);
            } while (response.status === 200 || response.status === 202);

            response.message = response?.payload?.status || 'Succeeded';
        }
        catch (ex) {
            response.status = 500;
            response.message = `An error occurred while waiting for provisioning to complete ${ex.message}`;
        }

        return response;
    }

    private async azureApiRequest(config: any): Promise<IAzureManagementApiResponse> {
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
            apiResponse.message = axiosResponse.statusText || `${axiosResponse.status} `;

            if (axiosResponse.data) {
                apiResponse.payload = axiosResponse.data;
            }

            logger.log([ModuleName, apiResponse.status > 299 ? 'error' : 'info'], `requestApi: status: ${apiResponse.status} `);
        }
        catch (ex) {
            if (ex.isAxiosError && ex.response) {
                apiResponse.status = ex.response.status;
                apiResponse.message = ex.response?.data?.error?.message || `An error occurred during the request: ${ex.response.status} `;
            }
            else {
                apiResponse.status = 500;
                apiResponse.message = `An error occurred during the request: ${ex.message} `;
            }
        }

        return apiResponse;
    }

    private async internalApiRequest(_event: IpcMainInvokeEvent, config: any): Promise<any> {
        logger.log([ModuleName, 'info'], `ipcMain ${contextBridgeTypes.Ipc_RequestApi} handler`);

        let response;

        try {
            response = await requestApi(config);
        }
        catch (ex) {
            logger.log([ModuleName, 'error'], `Error during ${contextBridgeTypes.Ipc_RequestApi} handler: ${ex.message} `);
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
