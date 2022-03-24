import React, { ErrorInfo, Component } from 'react';
import { Button, Modal, Form } from 'semantic-ui-react';

interface IErrorBoundaryProps {
    children: any;
}

interface IErrorBoundaryState {
    hasError: boolean;
    error: any;
    errorInfo: any;
}

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: any) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    public static getDerivedStateFromError(_error: Error): any {
        return {
            hasError: true
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // You can also log the error to an error reporting service
        /* eslint-disable no-console */
        // console.log(error.message);
        // console.log(errorInfo.componentStack);
        /* eslint-enable no-console */

        this.setState({
            error,
            errorInfo
        });
    }

    public render(): any {
        const {
            children
        } = this.props;

        const {
            hasError,
            error,
            errorInfo
        } = this.state;

        if (errorInfo) {
            return (
                <Modal size="mini" open={hasError}>
                    <Modal.Header>Error</Modal.Header>
                    <Modal.Content>
                        <Form>
                            <Form.Field>
                                <label>{error.message}</label>
                            </Form.Field>
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={this.dismiss.bind(this)}>Close</Button>
                    </Modal.Actions>
                </Modal>
            );
        }

        return children;
    }

    private dismiss() {
        this.setState({
            hasError: false
        });
    }
}
