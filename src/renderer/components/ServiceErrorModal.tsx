import React, { FC } from 'react';
import { Button, Modal } from 'semantic-ui-react';
import { IErrorResult } from '../../main/models/main';

interface IServiceErrorModalProps {
    errorResult: IErrorResult;
    action?: string;
    onClose: () => void;
}

const ServiceErrorModal: FC<IServiceErrorModalProps> = (props: IServiceErrorModalProps) => {
    const {
        errorResult,
        action,
        onClose
    } = props;

    return (
        <Modal
            closeOnEscape={false}
            closeOnDimmerClick={false}
            open={!!errorResult.status}
        >
            <Modal.Header>{errorResult.title}</Modal.Header>
            <Modal.Content>
                <p>{errorResult.message}</p>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose()} positive>
                    {action || 'OK'}
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

export default ServiceErrorModal;
