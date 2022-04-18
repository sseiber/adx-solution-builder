import React, { FC } from 'react';
import { Image, Message, Item, Progress, Grid, Divider, Label } from 'semantic-ui-react';
import { IoTCentralBaseDomain } from '../../../main/models/iotCentral';
import {
    AdxResourceType,
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
                        (item?.provisionResponse?.id || '')
                            ? <Label color='green'>provisioned</Label>
                            : null
                    }
                    <Label>{`${item.resourceName}${resourceSuffix}`}</Label>
                    {
                        (item.itemType === AdxResourceType.IoTCentralApp)
                            ? <Label as='a' onClick={() => openLink(`https://${resourceSuffix}.${IoTCentralBaseDomain}`)}>{`https://${resourceSuffix}.${IoTCentralBaseDomain}`}</Label>
                            : null
                    }
                </Item.Extra>
            </Item>
        </Message >
    );
};

export default ADXConfigurationItem;
