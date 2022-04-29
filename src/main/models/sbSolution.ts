export const SbConfigurationFileType = '7c59ae46-6955-49cd-a81c-45d79cad908e';

export enum AzureApiType {
    AzureResourceDeployment = 'AzureResourceDeployment',
    IoTCentralApi = 'IoTCentralApi',
    AzureDataExplorerApi = 'AzureDataExplorerApi'
}

export enum SbDeploymentItem {
    ResourceGroup = 'ResourceGroup',
    IotcCreateApp = 'IotcCreateApp',
    IotcWaitForAppProvision = 'IotcWaitForAppProvision',
    IotcImportEdgeCapabilityModel = 'IotcImportEdgeCapabilityModel',
    IotcRegisterEdgeDevice = 'IotcRegisterEdgeDevice',
    IotcGetEdgeDeviceAttestation = 'IotcGetEdgeDeviceAttestation',
    VirtualMachine = 'VirtualMachine',
    IotcRegisterIiotDevice = 'IotcRegisterIiotDevice',
    IotcGetIiotDeviceAttestation = 'IotcGetIiotDeviceAttestation',
    IotEdgeRuntimeStartup = 'IotEdgeRuntimeStartup',
    IotcProvisionIiotDevice = 'IotcProvisionIiotDevice',
    AdxCreateCluster = 'AdxCreateCluster',
    AdxCreateDatabase = 'AdxCreateDatabase',
    AdxAddDatabaseServicePrincipal = 'AdxAddDatabaseServicePrincipal',
    AdxCreateDatabaseTable = 'AdxCreateDatabaseTable',
    IotcConfigureCdeDestination = 'IotcConfigureCdeDestination',
    IotcConfigureCdeExport = 'IotcConfigureCdeExport',
    AdxConfigureDataImport = 'AdxConfigureDataImport'
}

export interface ISbConfigurationItem {
    id: string;
    name: string;
    description: string;
    itemType: string;
    resourceApiType: string;
    resourceName: string;
    pauseStep?: number;
    docLink?: string;
    payload: any;
    provisionResponse?: any;
}

export interface ISbSolution {
    fileType: string;
    name: string;
    id: string;
    resourceSuffixName: string;
    configItems: ISbConfigurationItem[];
}

export const emptySolution: ISbSolution = {
    fileType: SbConfigurationFileType,
    name: '',
    id: '',
    resourceSuffixName: '',
    configItems: []
};

export interface ISbDeploymentContext {
    foo: string;
}
