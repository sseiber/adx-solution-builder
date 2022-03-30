import React, { FC } from 'react';
import { Label, Image, Message, Item, Progress, Grid, Divider } from 'semantic-ui-react';

interface IADXConfigurationItemProps {
    key: string;
    id: string;
    name: string;
    description: string;
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
        description,
        resourceName,
        resourceImageSrc,
        deployingItemId,
        provisioned,
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
                                    <Item.Header>{name}</Item.Header>
                                    <Item.Meta>{description}</Item.Meta>
                                </div>
                            </Grid.Column>
                            <Grid.Column width='6'>
                                {
                                    deployingItemId === id
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
                        provisioned
                            ? (
                                <Label color='green'>
                                    provisioned
                                </Label>
                            )
                            : null
                    }
                    <Label>
                        {resourceName}
                    </Label>
                </Item.Extra>
            </Item>
        </Message >
    );
};

export default ADXConfigurationItem;
