import React, { ReactElement, FC } from 'react';
import { Image, Message, Item, Progress, Grid, Divider, Label } from 'semantic-ui-react';
import { IoTCentralBaseDomain } from '../../../main/models/iotCentral';
import {
    AdxDeploymentItem,
    IAdxConfigurationItem
} from '../../../main/models/adxSolution';

interface IADXConfigurationItemProps {
    key: string;
    openLink: (url: string) => Promise<void>;
    item: IAdxConfigurationItem;
    resourceSuffix: string;
    resourceImageSrc: string;
    deployingItemId: string;
    progressTotal: number;
    progressValue: number;
    progressLabel: string;
}
const ADXConfigurationItem: FC<IADXConfigurationItemProps> = (props: IADXConfigurationItemProps) => {
    const {
        openLink,
        item,
        resourceSuffix,
        resourceImageSrc,
        deployingItemId,
        progressTotal,
        progressValue,
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
                    (item.itemType === AdxDeploymentItem.IotcRegisterEdgeDevice)
                        ? <Label as='a' onClick={() => openLink(`https://${resourceSuffix}.${IoTCentralBaseDomain}/devices/details/industrial-connect-gw/commands`)}>{item.payload.deviceId}</Label>
                        : null
                }
                {
                    (item.itemType === AdxDeploymentItem.IotcCreateApp)
                        ? (
                            <>
                                <Label as='a' onClick={() => openLink(`https://${resourceSuffix}.${IoTCentralBaseDomain}`)}>{`https://${resourceSuffix}.${IoTCentralBaseDomain}`}</Label>
                                <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/2021-11-01-previewcontrolplane/apps/create-or-update`)}>doc</Label>
                            </>
                        )
                        : null
                }
                {
                    (item.itemType === AdxDeploymentItem.IotcImportEdgeCapabilityModel)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/1.1-previewdataplane/device-templates/create`)}>doc</Label>
                        : null
                }
                {
                    (item.itemType === AdxDeploymentItem.IotcRegisterEdgeDevice)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/1.1-previewdataplane/devices/create`)}>doc</Label>
                        : null
                }
                {
                    (item.itemType === AdxDeploymentItem.IotcGetEdgeDeviceAttestation)
                        // eslint-disable-next-line max-len
                        ? <Label as='a' onClick={() => openLink(`https://docs.microsoft.com/en-us/rest/api/iotcentral/1.1-previewdataplane/devices/get-attestation`)}>doc</Label>
                        : null
                }
                {
                    (item.itemType === AdxDeploymentItem.IotcProvisionIiotDevice)
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
                            <Grid.Column width='6'>
                                {
                                    deployingItemId === item.id
                                        ? (
                                            <>
                                                <Progress
                                                    color='blue'
                                                    size='small'
                                                    // percent={progressValue}
                                                    progress='percent'
                                                    total={progressTotal}
                                                    value={progressValue}
                                                    active
                                                    content={progressLabel}
                                                />
                                            </>
                                        )
                                        : null
                                }
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
            </Item>
        </Message >
    );
};

export default ADXConfigurationItem;
