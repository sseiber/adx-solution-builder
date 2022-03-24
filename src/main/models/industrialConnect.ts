export interface IIndustrialDirectMethodResponse {
    status: number;
    message: string;
    payload: any;
}

export interface IApiContext {
    appSubdomain: string;
    deviceId: string;
    moduleName: string;
}

export enum IndustrialConnectCommands {
    TestConnection = 'cmTestConnection',
    FetchNodes = 'cmFetchNodes',
    FetchBrowsedNodes = 'FetchBrowsedNodes_v1'
}

export enum SecurityMode {
    Lowest = 'Lowest',
    Best = 'Best'
}

export enum EndpointCredentialType {
    Anonymous = 'Anonymous',
    Username = 'Username'
}

export interface IEndpointCredentials {
    credentialType: EndpointCredentialType;
    username: string;
    password: string;
}

export interface IEndpoint {
    uri: string;
    securityMode: SecurityMode;
    credentials: IEndpointCredentials;
}

export enum OpcNodeClass {
    Object = 'Object',
    Variable = 'Variable'
}

export enum OpcAttribute {
    NodeClass = 'NodeClass',
    BrowseName = 'BrowseName',
    DisplayName = 'DisplayName',
    Description = 'Description',
    Value = 'Value',
    DataType = 'DataType',
    ValueRank = 'ValueRank',
    ArrayDimensions = 'ArrayDimensions',
    UserAccessLevel = 'UserAccessLevel'
}

export interface IBrowseNodesRequest {
    opcEndpoint: IEndpoint;
    startNode: string;
    depth: number;
    requestedNodeClasses: OpcNodeClass[];
    requestedAttributes: OpcAttribute[];
}

export interface IBrowseNodesConfig {
    startNode: string;
    depth: number;
    requestedNodeClasses: OpcNodeClass[];
    requestedAttributes: OpcAttribute[];
}

export interface IAdapterConfiguration {
    appId: string;
    deviceId: string;
    opcEndpoint: IEndpoint;
    browseNodesConfig: IBrowseNodesConfig;
}

export const emptyAdapterConfig: IAdapterConfiguration = {
    appId: '',
    deviceId: '',
    opcEndpoint: {
        uri: '',
        securityMode: SecurityMode.Lowest,
        credentials: {
            credentialType: EndpointCredentialType.Anonymous,
            username: '',
            password: ''
        }
    },
    browseNodesConfig: {
        startNode: '',
        depth: 1,
        requestedNodeClasses: [OpcNodeClass.Object, OpcNodeClass.Variable],
        requestedAttributes: [OpcAttribute.DisplayName, OpcAttribute.BrowseName]
    }
};

export interface IBrowseNodesResponse {
    jobId: string;
}
