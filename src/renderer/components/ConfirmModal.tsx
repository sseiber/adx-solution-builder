import React, { FC } from 'react';
import { Button, Modal, Form } from 'semantic-ui-react';
import { ModalTypes, useGlobalModalContext } from './GlobalModal';

export interface IConfirmModalInfo {
    confirm: boolean;
}

export const ConfirmModal: FC = (() => {
    const { hideModal, modalStore } = useGlobalModalContext();
    // const { modalProps } = modalStore || {};
    const {
        title,
        description,
        action,
        onConfirmCallback
    } = modalStore[ModalTypes.ConfirmModalDialog] || {};

    const onCloseModal = () => {
        hideModal(ModalTypes.ConfirmModalDialog);
    };

    const onConfirm = (_e: any) => {
        onConfirmCallback({
            confirm: true
        });
    };

    return (
        <Modal
            size="small"
            open
            onClose={onCloseModal}
            closeOnDimmerClick={false}
        >
            <Modal.Header>{title}</Modal.Header>
            <Modal.Content>
                <Form>
                    <Form.Field>
                        {description}
                    </Form.Field>
                </Form>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={onCloseModal}>Cancel</Button>
                <Button color={'green'} onClick={onConfirm}>{action}</Button>
            </Modal.Actions>
        </Modal>
    );
});
