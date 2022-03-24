import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Segment, Header, Message, Item } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { IAdxConfigurationItem } from '../../../main/models/adxSolution';
import ADXConfigurationItem from './ADXConfigurationItem';

interface IADXConfigurationPanelProps {
    userDisplayName: string;
    confgurationName: string;
    configurationDateCreated: string;
    configItems: IAdxConfigurationItem[];
    deploying: boolean;
    progressTotal: number;
    progressValue: number;
    progressLabel: string;
}

const ADXConfigurationPanel: FC<IADXConfigurationPanelProps> = observer((props: IADXConfigurationPanelProps) => {
    const {
        confgurationName,
        configurationDateCreated,
        configItems,
        deploying,
        progressTotal,
        progressValue,
        progressLabel
    } = props;
    const {
        mainStore
    } = useStore();

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column>
                    <Header attached="top" as="h3" color='blue'>
                        {
                            (configItems?.length || 0) > 0
                                ? `${confgurationName}, ${configurationDateCreated}`
                                : 'No Configuration'
                        }
                    </Header>
                    <Segment attached="bottom">
                        {
                            (configItems?.length || 0) > 0
                                ? (
                                    <Item.Group>
                                        {
                                            configItems.map((item: IAdxConfigurationItem) => {
                                                return (
                                                    <ADXConfigurationItem
                                                        key={item.id}
                                                        name={item.name}
                                                        resourceName={item.resourceName}
                                                        resourceImageSrc={mainStore.solutionImageFromResourceType.get(item.resourceType)}
                                                        deploying={deploying}
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
});

export default ADXConfigurationPanel;