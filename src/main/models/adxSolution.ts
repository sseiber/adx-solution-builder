export const AdxConfigurationFileType = '7c59ae46-6955-49cd-a81c-45d79cad908e';

export enum AdxResourceType {
    IoTCentralApp = 'IoTCentralApp',
    IoTCentralAppFeature = 'IoTCentralAppFeature',
    AzureDataExplorerCluster = 'AzureDataExplorerCluster',
    AzureContainerInstance = 'AzureContainerInstance',
    AzureDataExplorerFeature = 'AzureDataExplorerFeature',
    VirtualMachine = 'VirtualMachine',
    ResourceGroup = 'ResourceGroup'
}

export interface IAdxConfigurationItem {
    id: string;
    name: string;
    itemType: string;
    resourceApiType: string;
    resourceName: string;
    payload: any;
    provisionResponse?: any;
}

export interface IAdxSolution {
    fileType: string;
    name: string;
    id: string;
    resourceSuffixName: string;
    configItems: IAdxConfigurationItem[];
}

export const emptySolution: IAdxSolution = {
    fileType: AdxConfigurationFileType,
    name: '',
    id: '',
    resourceSuffixName: '',
    configItems: []
};
