import { createContext, useContext } from 'react';
import { MainStore } from './main';
import { SessionStore } from './session';
import { IotCentralStore } from './iotCentral';
import { IndustrialConnectStore } from './industrialConnect';

export interface IStore {
    mainStore: MainStore;
    sessionStore: SessionStore;
    iotCentralStore: IotCentralStore;
    industrialConnectStore: IndustrialConnectStore;
}

export const store: IStore = {
    mainStore: new MainStore(),
    sessionStore: new SessionStore(),
    iotCentralStore: new IotCentralStore(),
    industrialConnectStore: new IndustrialConnectStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
