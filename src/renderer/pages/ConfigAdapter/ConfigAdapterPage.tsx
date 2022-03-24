import React, { ChangeEvent, SyntheticEvent, FormEvent, FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Divider, Form, FormProps, Grid, Header, Message, Segment, DropdownProps, Input, Dimmer, Loader, Item, Progress, Label } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import {
    IApiContext,
    SecurityMode,
    EndpointCredentialType,
    OpcNodeClass,
    OpcAttribute,
    IEndpoint,
    IBrowseNodesRequest,
    IBrowseNodesConfig,
    IAdapterConfiguration
} from '../../../main/models/industrialConnect';
import { createSelectOptionsFromEnum } from '../../utils';

const ConfigAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        iotCentralStore,
        industrialConnectStore
    } = useStore();

    const appId = (location.state as any).appId;
    const appSubdomain = (location.state as any).appSubdomain;
    const deviceId = (location.state as any).deviceId;
    const deviceName = (location.state as any).deviceName;

    const [opcEndpointUri, setOpcEndpointUri] = useState('');
    const [opcEndpointSecurityMode, setOpcEndpointSecurityMode] = useState<SecurityMode>(SecurityMode.Lowest);
    const [opcEndpointCredentialType, setOpcEndpointCredentialType] = useState<EndpointCredentialType>(EndpointCredentialType.Anonymous);
    const [opcEndpointUsername, setOpcEndpointUsername] = useState('');
    const [opcEndpointPassword, setOpcEndpointPassword] = useState('');
    const [fetchNodesStartNode, setFetchNodesStartNode] = useState('');
    const [fetchNodesDepth, setFetchNodesDepth] = useState(1);
    const [fetchNodesClasses, setFetchNodesClasses] = useState<OpcNodeClass[]>([OpcNodeClass.Object, OpcNodeClass.Variable]);
    const [fetchNodesAttributes, setFetchNodesAttributes] = useState<OpcAttribute[]>([OpcAttribute.BrowseName, OpcAttribute.DisplayName]);

    useAsyncEffect(
        async (isMounted) => {
            try {
                await iotCentralStore.getDeviceModules(deviceId);
                await industrialConnectStore.loadAdapterConfiguration(appId, deviceId);

                if (!isMounted()) {
                    return;
                }

                setOpcEndpointUri(industrialConnectStore.adapterConfig.opcEndpoint.uri);
                setOpcEndpointSecurityMode(industrialConnectStore.adapterConfig.opcEndpoint.securityMode);
                setOpcEndpointCredentialType(industrialConnectStore.adapterConfig.opcEndpoint.credentials.credentialType);
                setOpcEndpointUsername(industrialConnectStore.adapterConfig.opcEndpoint.credentials.username);
                setOpcEndpointPassword(industrialConnectStore.adapterConfig.opcEndpoint.credentials.password);
                setFetchNodesStartNode(industrialConnectStore.adapterConfig.browseNodesConfig.startNode);
                setFetchNodesDepth(industrialConnectStore.adapterConfig.browseNodesConfig.depth);
                setFetchNodesClasses([...industrialConnectStore.adapterConfig.browseNodesConfig.requestedNodeClasses]);
                setFetchNodesAttributes([...industrialConnectStore.adapterConfig.browseNodesConfig.requestedAttributes]);
            }
            catch (ex) {
                await showInfoDialog(infoDialogContext, {
                    catchOnCancel: true,
                    variant: 'info',
                    title: 'Error',
                    description: ex.message
                });
            }

        },
        []
    );

    const onFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        switch (e.target.id) {
            case 'testConnectionUri':
                setOpcEndpointUri(e.target.value);
                break;
            case 'testConnectionUsername':
                setOpcEndpointUsername(e.target.value);
                break;
            case 'testConnectionPassword':
                setOpcEndpointPassword(e.target.value);
                break;
            case 'browseNodesRequestStartNode':
                setFetchNodesStartNode(e.target.value);
                break;
            case 'browseNodesRequestDepth': {
                const value = e.target.value !== '' ? parseInt(e.target.value, 10) : 0;
                if (!isNaN(value)) {
                    setFetchNodesDepth(value);
                }
                break;
            }
        }
    };

    const getOpcEndpoint = (): IEndpoint => {
        return {
            uri: opcEndpointUri,
            securityMode: opcEndpointSecurityMode,
            credentials: {
                credentialType: opcEndpointCredentialType,
                username: opcEndpointUsername,
                password: opcEndpointPassword
            }
        };
    };

    const getBrowseNodesConfig = (): IBrowseNodesConfig => {
        return {
            startNode: fetchNodesStartNode,
            depth: fetchNodesDepth,
            requestedNodeClasses: fetchNodesClasses,
            requestedAttributes: fetchNodesAttributes
        };
    };

    const getBrowseNodesRequest = (): IBrowseNodesRequest => {
        return {
            opcEndpoint: getOpcEndpoint(),
            ...getBrowseNodesConfig()
        };
    };

    const getAdapterConfig = (): IAdapterConfiguration => {
        return {
            appId,
            deviceId,
            opcEndpoint: getOpcEndpoint(),
            browseNodesConfig: getBrowseNodesConfig()
        };
    };

    const testConnection = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!opcEndpointUri) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Please enter a valid opc endpoint uri'
            });

            return;
        }

        await industrialConnectStore.saveAdapterConfig(getAdapterConfig());

        const apiContext: IApiContext = {
            appSubdomain,
            deviceId,
            moduleName: iotCentralStore.mapDeviceModules.get(deviceId)[0].name
        };
        await industrialConnectStore.testConnection(apiContext, getOpcEndpoint());
    };

    const fetchNodes = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!opcEndpointUri
            || !fetchNodesStartNode
            || !fetchNodesClasses.length
            || !fetchNodesAttributes.length) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Some required parameters are missing for fetch nodes request'
            });

            return;
        }

        await industrialConnectStore.saveAdapterConfig(getAdapterConfig());

        const apiContext: IApiContext = {
            appSubdomain,
            deviceId,
            moduleName: iotCentralStore.mapDeviceModules.get(deviceId)[0].name
        };
        await industrialConnectStore.fetchNodes(apiContext, getBrowseNodesRequest());
    };

    const onSaveConfig = async () => {
        return;
    };

    const securityModeOptions = createSelectOptionsFromEnum(SecurityMode, false);

    const onSecurityModeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setOpcEndpointSecurityMode(props.value as SecurityMode);
    };

    const endpointCredentialTypeOptions = createSelectOptionsFromEnum(EndpointCredentialType, false);

    const onEndpointCredentialTypeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setOpcEndpointCredentialType(props.value as EndpointCredentialType);
    };

    const nodeClassOptions = createSelectOptionsFromEnum(OpcNodeClass, false);

    const onNodeClassesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setFetchNodesClasses(props.value as OpcNodeClass[]);
    };

    const nodeAttributeOptions = createSelectOptionsFromEnum(OpcAttribute, false);

    const onNodeAttributesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setFetchNodesAttributes(props.value as OpcAttribute[]);
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size='large' attached="top">
                        <Message.Header>Industrial Connector Gateway Device Configuration</Message.Header>
                    </Message>
                    <Segment attached="bottom">
                        <Item.Group>
                            <Item>
                                <Item.Image
                                    style={{ width: '32px', height: 'auto' }}
                                    src={'./assets/iotedge.png'}
                                />
                                <Item.Content>
                                    <Item.Header>{deviceName}</Item.Header>
                                    <Item.Extra>
                                        <b>Id: </b>{deviceId}
                                    </Item.Extra>
                                </Item.Content>
                            </Item>
                        </Item.Group>
                        {/*
                            Test Connection Segment
                        */}
                        <Header attached="top" as="h3" color='blue'>OPCUA server connection</Header>
                        <Segment attached="bottom">
                            <Form size='small' onSubmit={testConnection}>
                                <Form.Field width={16}>
                                    <label>Uri:</label>
                                    <Input
                                        id="testConnectionUri"
                                        placeholder="Example: opc.tcp://192.168.4.101:4840"
                                        value={opcEndpointUri}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={3}
                                    label="Security mode:"
                                    selection
                                    options={securityModeOptions}
                                    defaultValue={opcEndpointSecurityMode}
                                    onChange={onSecurityModeChange}
                                />
                                <Form.Dropdown
                                    width={3}
                                    label="Credentials:"
                                    selection
                                    options={endpointCredentialTypeOptions}
                                    defaultValue={opcEndpointCredentialType}
                                    onChange={onEndpointCredentialTypeChange}
                                />
                                {
                                    opcEndpointCredentialType === EndpointCredentialType.Username
                                        ? (
                                            <Segment basic compact attached='bottom'>
                                                <Form.Field width={16}>
                                                    <label>Username:</label>
                                                    <Input
                                                        id="testConnectionUsername"
                                                        value={opcEndpointUsername}
                                                        onChange={onFieldChange}
                                                    />
                                                </Form.Field>
                                                <Form.Field width={16}>
                                                    <label>Password:</label>
                                                    <Input
                                                        id="testConnectionPassword"
                                                        value={opcEndpointPassword}
                                                        onChange={onFieldChange}
                                                    />
                                                </Form.Field>
                                            </Segment>
                                        )
                                        : null
                                }
                                <Divider hidden />
                                <Grid>
                                    <Grid.Column width={3}>
                                        <Button fluid size='tiny' type="submit" content="Test Connection" />
                                    </Grid.Column>
                                    {
                                        industrialConnectStore.waitingOnEndpointVerification
                                            ? (
                                                <Grid.Column width={4} verticalAlign='middle'>
                                                    <Progress percent={100} active content="Testing connection" />
                                                </Grid.Column>
                                            )
                                            : (
                                                <Grid.Column width={4} verticalAlign='middle'>
                                                    <Label
                                                        size='small'
                                                        color={industrialConnectStore.endpointVerified ? 'green' : 'grey'}
                                                        content={industrialConnectStore.endpointVerified ? '\u00A0\u00A0\u00A0Verified' : '\u00A0\u00A0\u00A0Unverified'}
                                                        icon={industrialConnectStore.endpointVerified ? 'check circle' : 'delete'}
                                                    />
                                                </Grid.Column>
                                            )
                                    }
                                </Grid>
                            </Form>
                        </Segment>
                        {/*
                            Browse Nodes Segment
                        */}
                        <Header attached="top" as="h3" color='blue'>Browse OPCUA Server</Header>
                        <Segment attached="bottom">
                            <Form size='small' onSubmit={fetchNodes}>
                                <Form.Field width={16}>
                                    <label>Starting node:</label>
                                    <Input
                                        id="browseNodesRequestStartNode"
                                        placeholder="Example: ns=0;i=85"
                                        value={fetchNodesStartNode}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Field width={2}>
                                    <label>Depth:</label>
                                    <Input
                                        id="browseNodesRequestDepth"
                                        value={fetchNodesDepth}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={6}
                                    label="Node classes:"
                                    multiple
                                    selection
                                    options={nodeClassOptions}
                                    value={fetchNodesClasses}
                                    onChange={onNodeClassesChange}
                                />
                                <Form.Dropdown
                                    width={6}
                                    label="Node attributes:"
                                    multiple
                                    selection
                                    options={nodeAttributeOptions}
                                    value={fetchNodesAttributes}
                                    onChange={onNodeAttributesChange}
                                />
                                <Divider hidden />
                                <Grid>
                                    <Grid.Column width={3}>
                                        <Button fluid size='tiny' type="submit" content="Browse Nodes" />
                                    </Grid.Column>
                                    {
                                        industrialConnectStore.waitingOnFetchNodes
                                            ? (
                                                <Grid.Column width={4} verticalAlign='middle'>
                                                    <Progress
                                                        progress='ratio'
                                                        total={industrialConnectStore.fetchNodesProgress.total}
                                                        value={industrialConnectStore.fetchNodesProgress.value}
                                                        active content={industrialConnectStore.fetchNodesProgress.label}
                                                    />
                                                </Grid.Column>
                                            )
                                            : null
                                    }
                                </Grid>
                            </Form>
                        </Segment>
                    </Segment>
                    <Dimmer active={iotCentralStore.waitingIotCentralCall} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button size='tiny' color='green' floated='right' onClick={onSaveConfig}>Save Configuration</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default ConfigAdapterPage;
