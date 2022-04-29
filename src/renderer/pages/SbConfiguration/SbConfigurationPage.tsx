import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Grid } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import SbConfigurationPanel from './SbConfigurationPanel';

const SbConfigurationPage: FC = observer(() => {
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
                        <SbConfigurationPanel
                            openLink={mainStore.openLink}
                            userDisplayName={sessionStore.displayName}
                            confgurationName={`${mainStore.sbSolution.name}: ${mainStore.sbSolution.resourceSuffixName.toUpperCase()}`}
                            resourceSuffix={mainStore.sbSolution.resourceSuffixName}
                            mapItemTypeToImageName={mainStore.mapItemTypeToImageName}
                            configItems={mainStore.sbSolution.configItems}
                            deployingItemId={mainStore.deployingItemId}
                            progressLabel={mainStore.provisionProgressLabel}
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    );
});

export default SbConfigurationPage;
