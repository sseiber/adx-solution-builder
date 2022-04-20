import React, { FC } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Menu, Grid, Icon, Dropdown } from 'semantic-ui-react';
import { useAsyncEffect } from 'use-async-effect';
import { useStore } from './stores/store';
import { InfoDialogServiceProvider, useInfoDialog, showInfoDialog } from './components/InfoDialogContext';
import { AuthenticationState } from './stores/session';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import HomePage from './pages/HomePage';
import AzureConfigPage from './pages/AzureConfigPage';
import ADXConfigurationPage from './pages/ADXConfiguration/ADXConfigurationPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import ServiceErrorModal from './components/ServiceErrorModal';
import { log } from './utils';
import { ProvisioningState } from '../main/models/main';

const ModuleName = 'App';

export enum AppNavigationPaths {
    Root = '/',
    AzureConfig = '/azureconfig',
    ADXConfig = '/iotcentral'
}

const App: FC = observer((props: any) => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        mainStore,
        sessionStore
    } = useStore();

    useAsyncEffect(async isMounted => {
        await sessionStore.getUserSessionInfo('');

        if (!isMounted()) {
            return;
        }

        if (sessionStore.authenticationState === AuthenticationState.Authenticated) {
            log([ModuleName, 'info'], `Would redirect to: ${params.redirectpath || location.pathname}`);

            navigate(AppNavigationPaths.ADXConfig);
        }
        else {
            sessionStore.redirectPath = location.pathname;
        }
    }, []);

    const onClickSignin = async () => {
        const msalConfig = await sessionStore.getMsalConfig();
        if (!msalConfig
            || !msalConfig.clientId
            || !msalConfig.tenantId
            || !msalConfig.subscriptionId
            || !msalConfig.redirectUri
            || !msalConfig.aadAuthority
            || !msalConfig.appProtocolName) {
            navigate(AppNavigationPaths.AzureConfig);
        }
        else {
            void sessionStore.signin(AppNavigationPaths.ADXConfig);
        }
    };

    const onEditAzureConfig = () => {
        navigate(AppNavigationPaths.AzureConfig);
    };

    const onClickSignout = async () => {
        await sessionStore.signout();
    };

    const onCloseErrorModal = () => {
        mainStore.clearServiceError();
    };

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
        const confirm = true;

        const currentState = await mainStore.getProvisioningState();
        if (currentState === ProvisioningState.Active) {
            // confirm = await showInfoDialog(infoDialogContext, {
            //     catchOnCancel: true,
            //     variant: 'confirm',
            //     title: 'Solution Provisioning',
            //     actionLabel: 'Start',
            //     description: 'A previous solution did not finish all of the provisioning steps. Do you want to attempt to start provisioning anyway?'
            // });
        }

        if (confirm) {
            void mainStore.startProvisioning();
        }
    };

    // const logoMenuTitle = sessionStore.authenticationState === AuthenticationState.Authenticated ? `Home` : `Azure IoT Central`;
    // const logoMenuLink = sessionStore.authenticationState === AuthenticationState.Authenticated ? AppNavigationPaths.ADXConfig : AppNavigationPaths.Root;
    const userNavItem = sessionStore.authenticationState === AuthenticationState.Authenticated
        ? (
            <Dropdown item trigger={(
                <span>
                    <Icon name={'user'} /> {sessionStore.displayName}
                </span>
            )}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onEditAzureConfig}>
                        <Icon name="edit" />
                        <span>&nbsp;&nbsp;Edit Azure config</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onClickSignout}>
                        <Icon name="sign out alternate" />
                        <span>&nbsp;&nbsp;Sign out</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown >
        )
        : (
            // <Menu.Item onClick={onClickSignin}>
            //     <Icon name="sign in alternate" />
            //     <span>&nbsp;&nbsp;Sign in</span>
            // </Menu.Item>
            <Dropdown item trigger={(
                <span>
                    <Icon name={'sign in alternate'} /> Action
                </span>
            )}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onEditAzureConfig}>
                        <Icon name="edit" />
                        <span>&nbsp;&nbsp;Edit Azure config</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onClickSignin}>
                        <Icon name="sign in alternate" />
                        <span>&nbsp;&nbsp;Sign in</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );

    let pageNavItem;

    if (sessionStore.authenticationState === AuthenticationState.Authenticated) {
        const navMenuTrigger = (
            <span><Icon name={'list'} /> Solution</span>
        );

        pageNavItem = (
            <Dropdown item trigger={navMenuTrigger}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onOpenSolution}>
                        <Icon name="folder open" />
                        <span>&nbsp;&nbsp;Open Solution</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onStartProvisioning}>
                        <Icon name="arrow circle right" />
                        <span>&nbsp;&nbsp;Start Provisioning</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown >
        );
    }
    else {
        pageNavItem = (
            <Menu.Item>
                <Icon name="bars" />
                <span>&nbsp;&nbsp;Home</span>
            </Menu.Item>
        );
    }

    const {
        children
    } = props;

    return (
        <ErrorBoundary>
            <InfoDialogServiceProvider>
                <Menu fixed="top" inverted color="grey" style={{ padding: '0em 5em' }}>
                    <Menu.Menu position="left">
                        {pageNavItem}
                    </Menu.Menu>
                    <Menu.Menu position="right">
                        {userNavItem}
                    </Menu.Menu>
                </Menu>
                <Grid>
                    <Grid.Column>
                        <Routes>
                            <Route path={AppNavigationPaths.Root} element={<HomePage />} />
                            <Route path={AppNavigationPaths.AzureConfig} element={<AzureConfigPage />} />
                            <Route path={AppNavigationPaths.ADXConfig}
                                element={
                                    <AuthenticatedRoute redirectTo={AppNavigationPaths.Root}>
                                        <ADXConfigurationPage />
                                    </AuthenticatedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to={AppNavigationPaths.Root} replace />} />
                            {children}
                        </Routes>
                    </Grid.Column>
                </Grid>
                <Menu fixed="bottom" inverted color="grey" style={{ padding: '1em 5em' }} />
                <ServiceErrorModal
                    serviceError={mainStore.serviceError}
                    onClose={onCloseErrorModal}
                />
            </InfoDialogServiceProvider>
        </ErrorBoundary>
    );
});

export default App;
