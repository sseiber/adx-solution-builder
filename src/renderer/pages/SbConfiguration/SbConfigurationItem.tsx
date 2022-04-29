import React, { ReactElement, FC } from 'react';
import { Image, Message, Item, Grid, Divider, Label, Loader, Dimmer } from 'semantic-ui-react';
import { IoTCentralBaseDomain } from '../../../main/models/iotCentral';
import {
    SbDeploymentItem,
    ISbConfigurationItem
} from '../../../main/models/sbSolution';

interface ISbConfigurationItemProps {
    key: string;
    openLink: (url: string) => Promise<void>;
    item: ISbConfigurationItem;
    resourceSuffix: string;
    resourceImageSrc: string;
    deployingItemId: string;
    progressLabel: string;
}
const SbConfigurationItem: FC<ISbConfigurationItemProps> = (props: ISbConfigurationItemProps) => {
    const {
        openLink,
        item,
        resourceSuffix,
        resourceImageSrc,
        deployingItemId,
        progressLabel
    } = props;

    const getLabels = (): ReactElement => {
        return (
            <>
                {
                    (item?.provisionResponse || '')
                        ? <Label color='green'>provisioned</Label>
                        : null
                }
                <Label>{`${item.resourceName}${resourceSuffix}`}</Label>
                {
                    (item.itemType === SbDeploymentItem.IotcRegisterEdgeDevice)
                        ? <Label as='a' onClick={() => openLink(`https://${resourceSuffix}.${IoTCentralBaseDomain}/devices/details/industrial-connect-gw/commands`)}>{item.payload.deviceId}</Label>
                        : null
                }
                {
                    (item.itemType === SbDeploymentItem.IotcCreateApp)
                        ? (
                            <>
                                <Label as='a' onClick={() => openLink(`https://${resourceSuffix}.${IoTCentralBaseDomain}`)}>{`https://${resourceSuffix}.${IoTCentralBaseDomain}`}</Label>
                                <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/2021-11-01-previewcontrolplane/apps/create-or-update`)}>doc</Label>
                            </>
                        )
                        : null
                }
                {
                    (item.itemType === SbDeploymentItem.IotcImportEdgeCapabilityModel)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/1.1-previewdataplane/device-templates/create`)}>doc</Label>
                        : null
                }
                {
                    (item.itemType === SbDeploymentItem.IotcRegisterEdgeDevice)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/1.1-previewdataplane/devices/create`)}>doc</Label>
                        : null
                }
                {
                    (item.itemType === SbDeploymentItem.IotcGetEdgeDeviceAttestation)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/1.1-previewdataplane/devices/get-attestation`)}>doc</Label>
                        : null
                }
                {
                    (item.itemType === SbDeploymentItem.IotcProvisionIiotDevice)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://${resourceSuffix}.${IoTCentralBaseDomain}/devices/details/opc-anomaly-device/rawdata`)}>{item.payload.addOrUpdateAssetRequest.asset.assetId}</Label>
                        : null
                }
            </>
        );
    };

    return (
        <Message>
            <Item>
                <Item.Content>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width='10'>
                                <Image
                                    floated='left'
                                    style={{ width: '48px', height: 'auto' }}
                                    src={`./assets/${resourceImageSrc}`}
                                />
                                <div>
                                    <Item.Header>{item.name}</Item.Header>
                                    <Item.Meta>{item.description}</Item.Meta>
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Item.Content>
                <Divider hidden />
                <Item.Extra>
                    {
                        getLabels()
                    }
                </Item.Extra>
                <Dimmer style={{ border: '1px solid black', borderColor: '#cececf', borderRadius: '3px' }} active={deployingItemId === item.id} inverted>
                    <Loader>{progressLabel}</Loader>
                </Dimmer>
            </Item>
        </Message >
    );
};

export default SbConfigurationItem;
