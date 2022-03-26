import React, { FC } from 'react';
import { Label, Image, Message, Item, Progress, Grid } from 'semantic-ui-react';

interface IADXConfigurationItemProps {
    key: string;
    id: string;
    name: string;
    resourceName: string;
    resourceId: string;
    resourceImageSrc: string;
    deployingItemId: string;
    provisioned: boolean;
    progressTotal: number;
    progressValue: number;
    progressLabel: string;
}
const ADXConfigurationItem: FC<IADXConfigurationItemProps> = (props: IADXConfigurationItemProps) => {
    const {
        id,
        name,
        resourceName,
        resourceId,
        resourceImageSrc,
        deployingItemId,
        provisioned,
        // progressTotal,
        progressValue,
        progressLabel
    } = props;

    return (
        <Message>
            <Item>
                <Item.Content>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={10}>
                                <Image
                                    floated='left'
                                    style={{ width: '48px', height: 'auto' }}
                                    src={`./assets/${resourceImageSrc}`}
                                />
                                <Item.Header>{name}</Item.Header>
                                <Item.Meta>
                                    <span>{resourceId}</span>
                                </Item.Meta>
                            </Grid.Column>
                            <Grid.Column width={6}>
                                {
                                    deployingItemId === id
                                        ? (
                                            <>
                                                <Progress
                                                    color='blue'
                                                    percent={progressValue}
                                                    progress
                                                    // total={progressTotal}
                                                    // value={progressValue}
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
                {
                    provisioned
                        ? (
                            <Label color='green' ribbon='right' content={'provisioned'} />
                        )
                        : null
                }
                <Item.Extra>
                    <Label>
                        {resourceName}
                    </Label>
                </Item.Extra>
            </Item>
        </Message>
    );
};

export default ADXConfigurationItem;
