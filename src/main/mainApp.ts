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
import { IIpcResult } from './contextBridgeTypes';
import store, { StoreKeys } from '../main/store';
import {
    AdxConfigurationFileType,
    emptySolution
} from './models/adxSolution';
import {
    IAdapterConfiguration,
    emptyAdapterConfig
} from './models/industrialConnect';
import {
    MsalAuthProvider
} from './providers/auth/msalAuth';
import { IoTCentralProvider } from './providers/iotCentral';
import { IndustrialConnectProvider } from './providers/industrialConnect';
import { requestApi } from './utils';
import {
    join as pathJoin,
    basename as pathBasename
} from 'path';
import { platform as osPlatform } from 'os';
import * as fse from 'fs-extra';

const ModuleName = 'MainApp';

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
        ipcMain.handle(contextBridgeTypes.Ipc_StartProvisioning, this.startProvisioning.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_GetAdapterConfiguration, this.getAdapterConfiguration.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_SetAdapterConfiguration, this.setAdapterConfiguration.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_OpenLink, this.openLink.bind(this));
        ipcMain.handle(contextBridgeTypes.Ipc_RequestApi, this.requestApi.bind(this));
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

    private async startProvisioning(_event: IpcMainInvokeEvent): Promise<IIpcResult> {
        void this.doProvisioning();

        return {
            result: true,
            message: ''
        };
    }

    private async doProvisioning(): Promise<void> {
        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, {
            label: 'Provisioning <app>',
            value: 3,
            total: 10
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                return resolve('');
            }, 1000 * 2);
        });

        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, {
            label: 'Provisioning <app>',
            value: 4,
            total: 10
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                return resolve('');
            }, 1000 * 2);
        });

        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, {
            label: 'Provisioning <app>',
            value: 7,
            total: 10
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                return resolve('');
            }, 1000 * 2);
        });

        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, {
            label: 'Provisioning <app>',
            value: 9,
            total: 10
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                return resolve('');
            }, 1000 * 1);
        });

        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_ProvisionProgress, {
            label: 'Provisioning <app>',
            value: 10,
            total: 10
        });

        await new Promise((resolve) => {
            setTimeout(() => {
                return resolve('');
            }, 1000 * 1);
        });

        this.mainWindow.webContents.send(contextBridgeTypes.Ipc_EndProvisioning);
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

    private async requestApi(_event: IpcMainInvokeEvent, config: any): Promise<any> {
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
