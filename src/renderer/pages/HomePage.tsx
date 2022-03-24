import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Message, Segment } from 'semantic-ui-react';
import { useAsyncEffect } from 'use-async-effect';
import { useStore } from '../stores/store';
import { AuthenticationState } from '../stores/session';
import { useInfoDialog, showInfoDialog } from '../components/InfoDialogContext';

const HomePage: FC = observer(() => {
    const infoDialogContext = useInfoDialog();
    const {
        sessionStore
    } = useStore();

    useAsyncEffect(async isMounted => {
        const lastOAuthError = await sessionStore.getLastOAuthError();

        if (!isMounted()) {
            return;
        }

        if (lastOAuthError) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Azure MSAL',
                description: lastOAuthError
            });

            await sessionStore.setLastOAuthError('');

            return;
        }
    }, []);

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size='large'>
                        <Message.Header>Azure</Message.Header>
                        <p>ADX Solution Builder</p>
                    </Message>
                    {
                        sessionStore.authenticationState !== AuthenticationState.Authenticated
                            ? (
                                <Segment basic>
                                    Use the signin link above to access your Azure subscription resources.
                                </Segment>
                            )
                            : null
                    }
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default HomePage;

