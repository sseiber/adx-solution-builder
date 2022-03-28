import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Grid } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import { ProvisioningState } from '../../../main/models/main';
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

    const onOpenSolution = async () => {
        const result = await mainStore.openSolution(false);
        if (!result.result && result.message) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Error',
                description: result.message
            });
        }
    };

    const onStartProvisioning = async () => {
        let confirm = true;

        const currentState = await mainStore.getProvisioningState();
        if (currentState === ProvisioningState.Active) {
            confirm = await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'confirm',
                title: 'Solution Provisioning',
                actionLabel: 'Start',
                description: 'A previous solution did not finish all of the provisioning steps. Do you want to attempt to start provisioning anyway?'
            });
        }

        if (confirm) {
            void mainStore.startProvisioning();
        }
    };

    return (
        <>
            <Grid style={{ padding: '5em 5em' }}>
                <Grid.Row>
                    <Grid.Column>
                        <IotCentralPanel
                            userDisplayName={sessionStore.displayName}
                            confgurationName={mainStore.adxSolution.name}
                            resourceSuffixName={mainStore.adxSolution.resourceSuffixName}
                            mapItemTypeToImageName={mainStore.mapItemTypeToImageName}
                            configItems={mainStore.adxSolution.configItems}
                            deployingItemId={mainStore.deployingItemId}
                            progressTotal={mainStore.provisionProgress.total}
                            progressValue={mainStore.provisionProgress.value}
                            progressLabel={mainStore.provisionProgress.label}
                        />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column>
                        <Button size='tiny' color='green' floated='right' onClick={onOpenSolution}>Open solution</Button>
                        <Button size='tiny' color='green' floated='left' onClick={onStartProvisioning}>Start Provisioning</Button>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    );
});

export default ADXConfigurationPage;
