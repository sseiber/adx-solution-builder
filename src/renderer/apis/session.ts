import { IIotcMethodResponse } from './requestHelper';

export async function getUserSession(): Promise<IIotcMethodResponse> {
    return {
        statusCode: 200,
        message: 'Succeeded',
        payload: {
            userId: 'ad7628e4-e9b0-4939-818d-bfcf01020890',
            displayName: 'Scott Seiber',
            email: 'scott.seiber@outlook.com',
            authProvider: 'Outlook'
        }
    };

    // return requestHelper({
    //     method: 'get',
    //     url: makeUrl('/api/v1/user')
    // });
}
