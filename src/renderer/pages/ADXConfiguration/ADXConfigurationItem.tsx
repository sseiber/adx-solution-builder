import React, { FC } from 'react';
import { Label, Image, Message, Item, Progress, Grid } from 'semantic-ui-react';

interface IADXConfigurationItemProps {
    key: string;
    name: string;
    resourceName: string;
    resourceImageSrc: string;
    deploying: boolean;
    progressTotal: number;
    progressValue: number;
    progressLabel: string;
}
const ADXConfigurationItem: FC<IADXConfigurationItemProps> = (props: IADXConfigurationItemProps) => {
    const {
        name,
        resourceName,
        resourceImageSrc,
        deploying,
        progressTotal,
        progressValue,
        progressLabel
    } = props;

    const provisioned = false;
    const resourceId = '';

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
                                    <span>{provisioned ? resourceId : ''}</span>
                                </Item.Meta>
                            </Grid.Column>
                            <Grid.Column width={6}>
                                {
                                    deploying
                                        ? (
                                            <>
                                                <Progress
                                                    color='blue'
                                                    progress={'ratio'}
                                                    total={progressTotal}
                                                    value={progressValue}
                                                    active
                                                // content={progressLabel}
                                                />
                                                value={progressValue}
                                                label={progressLabel}
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
