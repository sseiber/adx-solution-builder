import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Grid, Message } from 'semantic-ui-react';
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

    const onStartProvisioning = () => {
        void mainStore.startProvisioning();
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size='large'>
                        <Message.Header>ADX Solution Builder</Message.Header>
                    </Message>
                    <IotCentralPanel
                        userDisplayName={sessionStore.displayName}
                        confgurationName={mainStore.configuration.name}
                        configurationDateCreated={mainStore.configuration.created}
                        configItems={mainStore.configuration.configItems}
                        deploying={mainStore.deploying}
                        progressTotal={mainStore.provisionProgress.total}
                        progressValue={mainStore.provisionProgress.value}
                        progressLabel={mainStore.provisionProgress.label}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button size='tiny' color='green' floated='right' onClick={onOpenSolution}>Open configuration</Button>
                    <Button size='tiny' color='green' floated='left' onClick={onStartProvisioning}>Start Provisioning</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default ADXConfigurationPage;
