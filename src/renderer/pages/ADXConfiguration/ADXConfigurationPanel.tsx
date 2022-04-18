import React, { FC } from 'react';
import { Grid, Segment, Header, Message, Item } from 'semantic-ui-react';
import { IAdxConfigurationItem } from '../../../main/models/adxSolution';
import ADXConfigurationItem from './ADXConfigurationItem';

interface IADXConfigurationPanelProps {
    openLink: (url: string) => Promise<void>;
    userDisplayName: string;
    confgurationName: string;
    resourceSuffix: string;
    mapItemTypeToImageName: Map<string, string>;
    configItems: IAdxConfigurationItem[];
    deployingItemId: string;
    progressTotal: number;
    progressValue: number;
    progressLabel: string;
}

const ADXConfigurationPanel: FC<IADXConfigurationPanelProps> = (props: IADXConfigurationPanelProps) => {
    const {
        openLink,
        confgurationName,
        resourceSuffix,
        mapItemTypeToImageName,
        configItems,
        deployingItemId,
        progressTotal,
        progressValue,
        progressLabel
    } = props;

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column>
                    <Header attached="top" as="h3" color='blue'>
                        {
                            (configItems?.length || 0) > 0
                                ? `${confgurationName}`
                                : 'No Configuration'
                        }
                    </Header>
                    <Segment attached="bottom">
                        {
                            (configItems?.length || 0) > 0
                                ? (
                                    <Item.Group>
                                        {
                                            configItems.map((item) => {
                                                return (
                                                    <ADXConfigurationItem
                                                        key={item.id}
                                                        openLink={openLink}
                                                        item={item}
                                                        resourceSuffix={resourceSuffix}
                                                        resourceImageSrc={mapItemTypeToImageName.get(item.itemType)}
                                                        deployingItemId={deployingItemId}
                                                        progressTotal={progressTotal}
                                                        progressValue={progressValue}
                                                        progressLabel={progressLabel}
                                                    />
                                                );
                                            })
                                        }
                                    </Item.Group>
                                )
                                : (
                                    <Message warning>
                                        <Message.Header>There are no ADX solution items</Message.Header>
                                    </Message>
                                )
                        }
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default ADXConfigurationPanel;
