/* eslint-disable max-len */
import {
    app,
    BrowserWindow,
    IpcMain,
    IpcMainInvokeEvent
} from 'electron';
import * as contextBridgeTypes from '../contextBridgeTypes';
import logger from '../logger';
import { AppProvider } from './appProvider';
import { IoTCentralApiScope } from '../models/msalAuth';
import { MsalAuthProvider } from './auth/msalAuth';
import { IoTCentralBaseDomain } from '../models/iotCentral';
import {
    IApiContext,
    IIndustrialDirectMethodResponse,
    IndustrialConnectCommands,
    IEndpoint,
    IBrowseNodesRequest
} from '../models/industrialConnect';
import {
    requestApi,
    fileStream,
    sleep
} from '../utils';
import {
    gzipSync,
    gunzipSync
} from 'zlib';
import { format } from 'date-fns';
import { resolve as resolvePath } from 'path';

const ModuleName = 'IndustrialConnectProvider';

interface IIndustrialConnectMethodResponse {
    status: number;
    message: string;
    payload?: any;
}

export class IndustrialConnectProvider extends AppProvider {
    private authProvider: MsalAuthProvider;

    constructor(ipcMain: IpcMain, authWindow: BrowserWindow, authProvider: MsalAuthProvider) {
        super(ipcMain, authWindow);

        this.authProvider = authProvider;

        this.registerIpcEventHandlers();
    }

    public registerIpcEventHandlers(): void {
        this.ipcMain.handle(contextBridgeTypes.Ipc_TestConnection, this.testConnection.bind(this));
        this.ipcMain.handle(contextBridgeTypes.Ipc_FetchNodes, this.fetchNodes.bind(this));
    }

    private async testConnection(_event: IpcMainInvokeEvent, apiContext: IApiContext, opcEndpoint: IEndpoint): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `testConnection`);

        this.authWindow.webContents.send(contextBridgeTypes.Ipc_TestConnectionProgress, {
            label: 'Testing connection',
            value: 1,
            total: 10
        });

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {
                endpointVerified: false
            }
        };

        try {
            const requestConfig = await this.getDirectMethodApiConfig(
                `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${IndustrialConnectCommands.TestConnection}?api-version=1.1-preview`,
                {
                    opcEndpoint
                },
                10,
                10
            );

            const testConnectionResponse = await this.iotCentralApiInvokeMethod(requestConfig);

            finalResponse.status = testConnectionResponse.status;

            if (testConnectionResponse.status === 200) {
                finalResponse.payload = {
                    endpointVerified: true
                };
            }
            else {
                finalResponse.message = `Error: status: ${testConnectionResponse.status} - ${testConnectionResponse.message}`;

                logger.log([ModuleName, 'error'], finalResponse.message);
            }
        }
        catch (ex) {
            finalResponse.message = `Error during testConnection: ${ex.message}`;

            logger.log([ModuleName, 'error'], finalResponse.message);
        }

        return finalResponse;
    }

    private async fetchNodes(event: IpcMainInvokeEvent, apiContext: IApiContext, browseNodesRequest: IBrowseNodesRequest): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `fetchNodes`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {}
        };

        try {
            this.authWindow.webContents.send(contextBridgeTypes.Ipc_FetchNodesProgress, {
                label: 'Testing connection',
                value: 1,
                total: 10
            });

            const testConnectionResponse = await this.testConnection(event, apiContext, browseNodesRequest.opcEndpoint);
            if (testConnectionResponse.status !== 200 || testConnectionResponse.payload.endpointVerified !== true) {
                finalResponse.message = `Unable to connect to the OPCUA endpoint - uri: ${browseNodesRequest.opcEndpoint.uri}`;
                logger.log([ModuleName, 'error'], finalResponse.message);

                return finalResponse;
            }

            logger.log([ModuleName, 'info'], `Starting node: ${browseNodesRequest.startNode}, depth: ${browseNodesRequest.depth}`);

            this.authWindow.webContents.send(contextBridgeTypes.Ipc_FetchNodesProgress, {
                label: 'Sending BrowseNodes request',
                value: 2,
                total: 10
            });

            const requestConfig = await this.getDirectMethodApiConfig(
                `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${IndustrialConnectCommands.FetchNodes}?api-version=1.1-preview`,
                browseNodesRequest
            );
            const browseNodesResponse = await this.iotCentralApiInvokeMethod(requestConfig);

            finalResponse.status = browseNodesResponse.status;

            if (browseNodesResponse.status !== 200) {
                finalResponse.message = browseNodesResponse.message || `Unknown error in the response from BrowseNodes - status: ${browseNodesResponse.status}`;
                logger.log([ModuleName, 'error'], finalResponse.message);

                return finalResponse;
            }
            else {
                const jobId = browseNodesResponse.payload?.JobId;
                const blobFilename = `fetchNodes-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
                const fetchedNodesFilePath = resolvePath(app.getPath('downloads'), blobFilename);

                let fetchBrowsedNodesResponse;

                const fetchedNodesFileStream = fileStream(fetchedNodesFilePath);
                fetchedNodesFileStream.create();

                try {
                    if (jobId) {
                        do {
                            const continuationToken: string = fetchBrowsedNodesResponse?.payload?.response?.ContinuationToken || '1';

                            logger.log([ModuleName, 'info'], `Calling fetchBrowsedNodes with JobId: ${jobId} and ContinuationToken: ${continuationToken}`);

                            this.authWindow.webContents.send(contextBridgeTypes.Ipc_FetchNodesProgress, {
                                label: 'Fetching nodes',
                                value: 3,
                                total: 10
                            });

                            fetchBrowsedNodesResponse = await this.fetchBrowsedNodes(apiContext, jobId, continuationToken);

                            logger.log([ModuleName, 'info'], `fetchBrowsedNodes returned status: ${fetchBrowsedNodesResponse.status}`);

                            if (fetchBrowsedNodesResponse.status === 200 && fetchBrowsedNodesResponse?.payload?.nodes) {
                                logger.log([ModuleName, 'info'], `fetchBrowsedNodes returned ${fetchBrowsedNodesResponse.payload.nodes.length} nodes`);

                                await fetchedNodesFileStream.writeJson(fetchBrowsedNodesResponse.payload.nodes);
                            }
                        } while (fetchBrowsedNodesResponse.status === 200 && fetchBrowsedNodesResponse?.payload?.continuationToken);
                    }
                    else if (browseNodesResponse.payload?.nodes) {
                        await fetchedNodesFileStream.writeJson(browseNodesResponse.payload?.nodes);
                    }
                }
                catch (ex) {
                    finalResponse.message = `Error while fetching node chunks: ${ex.message}`;

                    logger.log([ModuleName, 'error'], finalResponse.message);
                }
                finally {
                    await fetchedNodesFileStream.close();
                }

                if (fetchBrowsedNodesResponse.status === 200) {
                    // await this.uploadFetchedNodesFile(fetchedNodesFilePath, blobFilename, 'application/json');
                    logger.log([ModuleName, 'info'], `fetchNodes save completed file: ${fetchedNodesFilePath}`);
                }

                finalResponse.status = fetchBrowsedNodesResponse.status;
                finalResponse.message = fetchBrowsedNodesResponse.message;
                finalResponse.payload = {
                    fetchedNodesFilePath
                };
            }
        }
        catch (ex) {
            finalResponse.message = `Error during browseNodes: ${ex.message}`;

            logger.log([ModuleName, 'error'], finalResponse.message);
        }

        this.authWindow.webContents.send(contextBridgeTypes.Ipc_FetchNodesProgress, {
            label: 'Fetching nodes',
            value: 10,
            total: 10
        });

        return finalResponse;
    }

    private async fetchBrowsedNodes(apiContext: IApiContext, jobId: string, continuationToken: string): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `fetchBrowsedNodes`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {}
        };

        try {
            const fetchBrowsedNodesResponse = await this.chunkRequest(
                apiContext,
                'FetchBrowsedNodes_v1',
                {
                    jobId,
                    continuationToken
                });

            Object.assign(finalResponse, fetchBrowsedNodesResponse);
        }
        catch (ex) {
            finalResponse.status = 500;
            finalResponse.message = `fetchBrowsedNodes failed: ${ex.message}`;

            logger.log([ModuleName, 'error'], finalResponse.message);
        }

        return finalResponse;
    }

    private async chunkRequest(apiContext: IApiContext, methodName: string, methodRequest: any): Promise<IIndustrialDirectMethodResponse> {
        logger.log([ModuleName, 'info'], `chunkRequest`);

        const finalResponse: IIndustrialDirectMethodResponse = {
            status: 500,
            message: ``,
            payload: {}
        };

        try {
            const compressedRequest = gzipSync(JSON.stringify(methodRequest));

            let requestConfig = await this.getDirectMethodApiConfig(
                `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${methodName}?api-version=1.1-preview`,
                {
                    contentLength: compressedRequest.length,
                    payload: compressedRequest.toString('base64')
                }
            );
            let chunkResponse = await this.iotCentralApiInvokeMethod(requestConfig);

            finalResponse.status = chunkResponse.status;

            if (chunkResponse.status !== 202 || !chunkResponse?.payload?.RequestId) {
                finalResponse.message = chunkResponse.payload?.error.message || `Unknown error in the chunked response from ${methodName} - status: ${chunkResponse.status}`;

                logger.log([ModuleName, 'info'], finalResponse.message);
            }
            else {
                do {
                    await sleep(1000);

                    requestConfig = await this.getDirectMethodApiConfig(
                        `https://${apiContext.appSubdomain}.${IoTCentralBaseDomain}/api/devices/${apiContext.deviceId}/modules/${apiContext.moduleName}/commands/${methodName}?api-version=1.1-preview`,
                        {
                            RequestId: chunkResponse.payload.RequestId
                        }
                    );
                    chunkResponse = await this.iotCentralApiInvokeMethod(requestConfig);

                    logger.log([ModuleName, 'info'], `${methodName} returned status: ${chunkResponse.status}`);
                } while (chunkResponse.status === 102);

                if (chunkResponse.status === 200 && chunkResponse.payload?.Payload?.length) {
                    const resultBuffer = gunzipSync(Buffer.from(chunkResponse.payload.Payload, 'base64'));

                    finalResponse.message = `${methodName} succeeded`;
                    finalResponse.payload = JSON.parse(resultBuffer.toString());
                }
                else {
                    finalResponse.message = chunkResponse.payload?.error.message || `Unknown error in the chunked response from ${methodName} - status: ${chunkResponse.status}`;

                    logger.log([ModuleName, 'error'], finalResponse.message);
                }

                finalResponse.status = chunkResponse.status;
            }
        }
        catch (ex) {
            finalResponse.status = 500;
            finalResponse.message = `${methodName} failed: ${ex.message}`;

            logger.log([ModuleName, 'info'], finalResponse.message);
        }

        return finalResponse;
    }

    private async getDirectMethodApiConfig(url: string, request: any, connectionTimeout = 30, responseTimeout = 30): Promise<any> {
        const accessToken = await this.authProvider.getScopedToken(IoTCentralApiScope);

        return {
            method: 'post',
            url,
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            data: {
                connectionTimeout,
                responseTimeout,
                request
            }
        };
    }

    private async iotCentralApiInvokeMethod(config: any): Promise<IIndustrialConnectMethodResponse> {
        logger.log([ModuleName, 'info'], `iotCentralApiInvokeMethod`);

        const methodResponse: IIndustrialConnectMethodResponse = {
            status: 200,
            message: ''
        };

        try {
            const apiResponse = await requestApi(config);

            if (apiResponse.status >= 200 && apiResponse.status <= 299) {
                methodResponse.status = apiResponse.payload?.response.status || apiResponse.payload?.responseCode;
                methodResponse.message = apiResponse.payload?.response.message || '';

                if (apiResponse.payload?.response?.payload) {
                    methodResponse.payload = apiResponse.payload.response.payload;
                }

                logger.log([ModuleName, 'info'], `methodResponse: status: ${methodResponse.status}`);
            }
            else {
                methodResponse.status = apiResponse.status;
                methodResponse.message = `An error occurred during request: apiResponse status - ${apiResponse.status}`;

                logger.log([ModuleName, 'error'], methodResponse.message);
            }
        }
        catch (ex) {
            methodResponse.status = 500;
            methodResponse.message = `An error occurred during the request: ${ex.message}`;
        }

        return methodResponse;
    }
}

