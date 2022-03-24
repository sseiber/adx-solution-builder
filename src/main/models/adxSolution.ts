export const AdxConfigurationFileType = '7c59ae46-6955-49cd-a81c-45d79cad908e';

export enum AdxResourceType {
    IoTCentralApp = 'IoTCentralApp',
    IoTCentralAppFeature = 'IoTCentralAppFeature',
    AzureDataExplorerCluster = 'AzureDataExplorerCluster',
    AzureDataExplorerFeature = 'AzureDataExplorerFeature',
    VirtualMachine = 'VirtualMachine'
}

export interface IProvisionResult {
    resourceId: string;
    provisionResponse: any;
}

export interface IAdxConfigurationItem {
    id: string;
    name: string;
    resourceName: string;
    resourceType: string;
    payload: any;
    provisoinResult?: IProvisionResult;
}

export interface IAdxSolution {
    fileType: string;
    name: string;
    id: string;
    configItems: IAdxConfigurationItem[];
}

export const emptySolution: IAdxSolution = {
    fileType: AdxConfigurationFileType,
    name: '',
    id: '',
    configItems: []
};
