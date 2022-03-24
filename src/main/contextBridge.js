/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
const {
    contextBridge,
    ipcMain,
    ipcRenderer
} = require('electron');
const contextBridgeTypes = require('./contextBridgeTypes.ts');

contextBridge.exposeInMainWorld('ipcApi', {
    // Main
    [contextBridgeTypes.Ipc_Log]: (tags, message) => ipcRenderer.invoke(contextBridgeTypes.Ipc_Log, tags, message),
    [contextBridgeTypes.Ipc_OpenConfiguration]: (loadLastConfiguration) => ipcRenderer.invoke(contextBridgeTypes.Ipc_OpenConfiguration, loadLastConfiguration),
    [contextBridgeTypes.Ipc_StartProvisioning]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_StartProvisioning),
    [contextBridgeTypes.Ipc_ProvisionProgress]: (channel, receiver) => {
        ipcRenderer.on(channel, (event, message) => receiver(event, message));
    },
    [contextBridgeTypes.Ipc_EndProvisioning]: (channel, receiver) => {
        ipcRenderer.on(channel, (event) => receiver(event));
    },
    [contextBridgeTypes.Ipc_GetAdapterConfiguration]: (appId, deviceId) => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetAdapterConfiguration, appId, deviceId),
    [contextBridgeTypes.Ipc_SetAdapterConfiguration]: (adapterConfig) => ipcRenderer.invoke(contextBridgeTypes.Ipc_SetAdapterConfiguration, adapterConfig),
    [contextBridgeTypes.Ipc_OpenLink]: (url) => ipcRenderer.invoke(contextBridgeTypes.Ipc_OpenLink, url),

    // Auth
    [contextBridgeTypes.Ipc_GetLastOAuthError]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetLastOAuthError),
    [contextBridgeTypes.Ipc_SetLastOAuthError]: (message) => ipcRenderer.invoke(contextBridgeTypes.Ipc_SetLastOAuthError, message),
    [contextBridgeTypes.Ipc_SetMsalConfig]: (msalConfig) => ipcRenderer.invoke(contextBridgeTypes.Ipc_SetMsalConfig, msalConfig),
    [contextBridgeTypes.Ipc_GetMsalConfig]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetMsalConfig),
    [contextBridgeTypes.Ipc_Signin]: (redirectPath) => ipcRenderer.invoke(contextBridgeTypes.Ipc_Signin, redirectPath),
    [contextBridgeTypes.Ipc_Signout]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_Signout),
    [contextBridgeTypes.Ipc_GetAccount]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetAccount),
    [contextBridgeTypes.Ipc_GetProfile]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetProfile),

    // IoT Central
    [contextBridgeTypes.Ipc_RequestApi]: (config) => ipcRenderer.invoke(contextBridgeTypes.Ipc_RequestApi, config),
    [contextBridgeTypes.Ipc_GetIotcApps]: () => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetIotcApps),
    [contextBridgeTypes.Ipc_GetIotcDevices]: (appSubdomain, appId) => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetIotcDevices, appSubdomain, appId),
    [contextBridgeTypes.Ipc_GetIotcDeviceModules]: (appSubdomain, deviceId) => ipcRenderer.invoke(contextBridgeTypes.Ipc_GetIotcDeviceModules, appSubdomain, deviceId),

    // Industrial Connect
    [contextBridgeTypes.Ipc_TestConnection]: (apiContext, opcEndpoint) => ipcRenderer.invoke(contextBridgeTypes.Ipc_TestConnection, apiContext, opcEndpoint),
    [contextBridgeTypes.Ipc_TestConnectionProgress]: (channel, receiver) => {
        ipcRenderer.on(channel, (event, message) => receiver(event, message));
    },
    [contextBridgeTypes.Ipc_FetchNodes]: (apiContext, browseNodesRequest) => ipcRenderer.invoke(contextBridgeTypes.Ipc_FetchNodes, apiContext, browseNodesRequest),
    [contextBridgeTypes.Ipc_FetchNodesProgress]: (channel, receiver) => {
        ipcRenderer.on(channel, (event, message) => receiver(event, message));
    },
    [contextBridgeTypes.Ipc_ReceiveMessage]: (channel, receiver) => {
        ipcRenderer.on(channel, (event, ...args) => receiver(event, ...args));
    }
});
