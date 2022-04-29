import React, { FC } from 'react';
import { Grid, Segment, Header, Message, Item } from 'semantic-ui-react';
import { ISbConfigurationItem } from '../../../main/models/sbSolution';
import SbConfigurationItem from './SbConfigurationItem';

interface ISbConfigurationPanelProps {
    openLink: (url: string) => Promise<void>;
    userDisplayName: string;
    confgurationName: string;
    resourceSuffix: string;
    mapItemTypeToImageName: Map<string, string>;
    configItems: ISbConfigurationItem[];
    deployingItemId: string;
    progressLabel: string;
}

const SbConfigurationPanel: FC<ISbConfigurationPanelProps> = (props: ISbConfigurationPanelProps) => {
    const {
        openLink,
        confgurationName,
        resourceSuffix,
        mapItemTypeToImageName,
        configItems,
        deployingItemId,
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
                                                    <SbConfigurationItem
                                                        key={item.id}
                                                        openLink={openLink}
                                                        item={item}
                                                        resourceSuffix={resourceSuffix}
                                                        resourceImageSrc={mapItemTypeToImageName.get(item.itemType)}
                                                        deployingItemId={deployingItemId}
                                                        progressLabel={progressLabel}
                                                    />
                                                );
                                            })
                                        }
                                    </Item.Group>
                                )
                                : (
                                    <Message warning>
                                        <Message.Header>There are no Solution Builder items</Message.Header>
                                    </Message>
                                )
                        }
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default SbConfigurationPanel;
