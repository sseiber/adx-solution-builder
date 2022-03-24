export const UserProfileScope = 'User.Read';
export const AzureManagementScope = 'https://management.azure.com/.default';
export const IoTCentralApiScope = 'https://apps.azureiotcentral.com/.default';

export interface IMsalConfig {
    clientId: string;
    tenantId: string;
    subscriptionId: string;
    redirectUri: string;
    aadAuthority: string;
    appProtocolName: string;
}
