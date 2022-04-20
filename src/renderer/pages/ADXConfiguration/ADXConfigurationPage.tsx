import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Grid } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import IotCentralPanel from './ADXConfigurationPanel';

const ADXConfigurationPage: FC = observer(() => {
    const infoDialogContext = useInfoDialog();
    const {
        mainStore,
        sessionStore
    } = useStore();

    useAsyncEffect(
        async isMounted => {
            const result = await mainStore.openSolution(true);

            if (!isMounted()) {
                return;
            }

            if (!result.result && result.message) {
                await showInfoDialog(infoDialogContext, {
                    catchOnCancel: true,
                    variant: 'info',
                    title: 'Error',
                    description: result.message
                });
            }
        },
        []
    );

    return (
        <>
            <Grid style={{ padding: '5em 5em' }}>
                <Grid.Row>
                    <Grid.Column>
                        <IotCentralPanel
                            openLink={mainStore.openLink}
                            userDisplayName={sessionStore.displayName}
                            confgurationName={`${mainStore.adxSolution.name}: ${mainStore.adxSolution.resourceSuffixName.toUpperCase()}`}
                            resourceSuffix={mainStore.adxSolution.resourceSuffixName}
                            mapItemTypeToImageName={mainStore.mapItemTypeToImageName}
                            configItems={mainStore.adxSolution.configItems}
                            deployingItemId={mainStore.deployingItemId}
                            progressTotal={mainStore.provisionProgress.total}
                            progressValue={mainStore.provisionProgress.value}
                            progressLabel={mainStore.provisionProgress.label}
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    );
});

export default ADXConfigurationPage;
