# Edge module VM deploy

This Azure ARM template is derived from the IoT Edge on Ubuntu Virtual Machines sample deployment template documented here:
[Run Azure IoT Edge on Ubuntu Virtual Machines](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-install-iot-edge-ubuntuvm?WT.mc_id=github-iotedgevmdeploy-pdecarlo)

## Azure CLI command to deploy an Azure Virtual Machine with IoT Edge runtime pre-configured for an IoT Central edge device

### First create an ssh key for access to the virtual machine
```bash
ssh-keygen -m PEM -t rsa -b 4096
```
After creating the ssh key, copy the public key results. On a Linux OS assuming you used the default name when you created the ssh key:
```bash
cat ~/.ssh/id_rsa.pub
```
Copy the output and use it for the "<VM_ADMIN_SSH_KEY>" value in the command below. Make sure you don't copy any extra/trailing spaces.

### Run the Azure CLI command to deploy the virtual machine into your subscription
In the command below the Edge device has already been created in the IoT Central app. Copy the values from IoT Central for this device and use them in the command below.
```bash
az deployment group create \
  --subscription "<SUBSCRIPTION_ID>" \
  --name "<DEPLOYMENT_NAME>" \
  --resource-group "<RESOURCE_GROUP_NAME>" \
  --template-file iotedgevm-template.json \
  --parameters dnsLabelPrefix="<NAME_FOR_DNS_PREFIX>" \
  --parameters adminUsername="<VM_ADMIN_USER>" \
  --parameters adminPasswordOrKey="<VM_ADMIN_SSH_KEY>" \
  --parameters scopeId="<IOT_CENTRAL_APP_SCOPE_ID>" \
  --parameters deviceId="<IOT_CENTRAL_EDGE_DEVICE_ID>" \
  --parameters symmetricKey="<IOT_CENTRAL_EDGE_DEVICE_SYMMETRIC_KEY"
```
