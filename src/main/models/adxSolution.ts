export const AdxConfigurationFileType = '7c59ae46-6955-49cd-a81c-45d79cad908e';

export enum AzureApiType {
    AzureResourceDeployment = 'AzureResourceDeployment',
    IoTCentralApi = 'IoTCentralApi',
    AzureDataExplorerApi = 'AzureDataExplorerApi'
}

export enum AdxDeploymentItem {
    ResourceGroup = 'ResourceGroup',
    IotcCreateApp = 'IotcCreateApp',
    IotcImportEdgeCapabilityModel = 'IotcImportEdgeCapabilityModel',
    IotcRegisterEdgeDevice = 'IotcRegisterEdgeDevice',
    IotcGetEdgeDeviceAttestation = 'IotcGetEdgeDeviceAttestation',
    VirtualMachine = 'VirtualMachine',
    IotcRegisterIiotDevice = 'IotcRegisterIiotDevice',
    IotcGetIiotDeviceAttestation = 'IotcGetIiotDeviceAttestation',
    IotEdgeRuntimeStartup = 'IotEdgeRuntimeStartup',
    IotcProvisionIiotDevice = 'IotcProvisionIiotDevice',
    AdxCreateCluster = 'AdxCreateCluster',
    IotcConfigureCdeDestination = 'IotcConfigureCdeDestination',
    IotcConfigureCdeExport = 'IotcConfigureCdeExport',
    AdxConfigureDataImport = 'AdxConfigureDataImport'
}

export interface IAdxConfigurationItem {
    id: string;
    name: string;
    description: string;
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
