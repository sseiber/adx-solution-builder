import React, { createContext, useContext, useState, useRef } from 'react';
import { InfoDialog, IInfoDialogOptions } from './InfoDialog';

export type InfoDialogType = (options: IInfoDialogOptions) => Promise<void>;
const InfoServiceContext = createContext<InfoDialogType>(Promise.reject);

export const useInfoDialog = (): InfoDialogType => useContext(InfoServiceContext);

export const InfoDialogServiceProvider = ({ children }: { children: any }): any => {
    const [infoDialogState, setInfoDialogState] = useState<IInfoDialogOptions | null>(null);

    const awaitingPromiseRef = useRef<{
        resolve: () => void;
        reject: () => void;
    }>();

    const openInfoDialog = (options: IInfoDialogOptions) => {
        setInfoDialogState(options);

        return new Promise<void>((resolve, reject) => {
            awaitingPromiseRef.current = { resolve, reject };
        });
    };

    const handleClose = () => {
        if (infoDialogState.catchOnCancel && awaitingPromiseRef.current) {
            awaitingPromiseRef.current.reject();
        }

        setInfoDialogState(null);
    };

    const handleOk = () => {
        if (awaitingPromiseRef.current) {
            awaitingPromiseRef.current.resolve();
        }

        setInfoDialogState(null);
    };

    return (
        <>
            <InfoServiceContext.Provider
                value={openInfoDialog}
                children={children}
            />

            <InfoDialog
                visible={Boolean(infoDialogState)}
                okCallback={handleOk}
                closeCallback={handleClose}
                {...infoDialogState}
            />
        </>
    );
};

export async function showInfoDialog(context: InfoDialogType, options: IInfoDialogOptions): Promise<boolean> {
    try {
        await context(options);
    }
    catch (ex) {
        return false;
    }

    return true;
}
