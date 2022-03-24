import Store from 'electron-store';

export enum StoreKeys {
    lastOAuthError = 'lastOAuthError',
    configurationName = 'configurationName',
    clientId = 'clientId',
    tenantId = 'tenantId',
    subscriptionId = 'subscriptionId',
    redirectUri = 'redirectUri',
    aadAuthority = 'aadAuthority',
    graphEndpointHost = 'graphEndpointHost',
    graphMeEndpoint = 'graphMeEndpoint',
    appProtocolName = 'appProtocolName',
    lastConfiguration = 'lastConfiguration'
}

interface StoreType {
    lastOAuthError: string;
    configurationName: string;
    clientId: string;
    tenantId: string;
    subscriptionId: string;
    redirectUri: string;
    aadAuthority: string;
    graphEndpointHost: string;
    graphMeEndpoint: string;
    appProtocolName: string;
    lastConfiguration: string;
}

const store = new Store<StoreType>({
    defaults: {
        lastOAuthError: '',
        configurationName: '',
        clientId: '',
        tenantId: '',
        subscriptionId: '',
        redirectUri: '',
        aadAuthority: 'https://login.microsoftonline.com/common/',
        graphEndpointHost: 'https://graph.microsoft.com/',
        graphMeEndpoint: 'v1.0/me',
        appProtocolName: '',
        lastConfiguration: ''
    }
});

export default store;
