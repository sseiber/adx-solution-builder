import {
    ISbConfigurationItem,
    ISbDeploymentContext,
    ISbSolution
} from '../models/sbSolution';
import { IServiceResponse } from '../models/main';

// eslint-disable-next-line max-len
export function deploymentStep(configItem: ISbConfigurationItem, _sbContext: ISbDeploymentContext, sbSolution: ISbSolution, subscriptionId: string, resourceName: string): Promise<IServiceResponse> {
    // @ts-ignore
    const apiConfig: any = {
        method: 'put',
        url: `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceName}?api-version=2021-04-01`,
        data: {
            ...configItem.payload,
            tags: {
                ...(configItem.payload?.tags || {}),
                iotcsbid: sbSolution.id
            }
        }
    };

    return;
}
