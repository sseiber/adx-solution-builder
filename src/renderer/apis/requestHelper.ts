import axios from 'axios';

export interface IIotcMethodResponse {
    statusCode: number;
    message: string;
    payload?: any;
}

export async function requestHelper(config: any): Promise<IIotcMethodResponse> {
    const response: IIotcMethodResponse = {
        statusCode: 200,
        message: 'SUCCESS'
    };

    try {
        const axiosResponse = await axios.request(config);

        response.statusCode = axiosResponse.status;
        response.message = axiosResponse.statusText;

        if ((axiosResponse.data as any)?.payload) {
            response.payload = (axiosResponse.data as any).payload;
        }
    }
    catch (ex) {
        if (ex.isAxiosError && ex.response) {
            response.statusCode = ex.response.statusCode;
            response.message = `An error occurred during the request: ${ex.response.status}`;
        }
        else {
            response.statusCode = 500;
            response.message = `An error occurred during the request: ${ex.message}`;
        }
    }

    return response;
}
