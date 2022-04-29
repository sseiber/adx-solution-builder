import { createContext, useContext } from 'react';
import { MainStore } from './main';
import { SessionStore } from './session';
import { IotCentralStore } from './iotCentral';

export interface IStore {
    mainStore: MainStore;
    sessionStore: SessionStore;
    iotCentralStore: IotCentralStore;
}

export const store: IStore = {
    mainStore: new MainStore(),
    sessionStore: new SessionStore(),
    iotCentralStore: new IotCentralStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
