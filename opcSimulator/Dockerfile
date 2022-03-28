# docker pull mcr.microsoft.com/iotedge/opc-plc:2.2.0
# docker run --rm -it -p 50000:50000 -p 8080:8080 --name enipoc mcr.microsoft.com/iotedge/opc-plc:2.2.0 --pn=50000 --autoaccept --sph --sn=5 --sr=10 --st=uint --fn=5 --fr=1 --ft=uint --ctb --scn --ref --gn=5
# "dotnet", "opcplc.dll", "--pn=50000", "--autoaccept", "--sph", "--sn=5", "--sr=10", "--st=uint", "--fn=5", "--fr=1", "--ft=uint", "--ctb", "--scn", "--ref", "--gn=5"
# "dotnet opcplc.dll --pn=50000 --autoaccept --sph --sn=5 --sr=10 --st=uint --fn=5 --fr=1 --ft=uint --ctb --scn --ref --gn=5"
# "./opcplc", "--pn=50000", "--autoaccept", "--sph", "--sn=5", "--sr=10", "--st=uint", "--fn=5", "--fr=1", "--ft=uint", "--ctb", "--scn", "--ref", "--gn=5"
# "./opcplc --pn=50000 --autoaccept --sph --sn=5 --sr=10 --st=uint --fn=5 --fr=1 --ft=uint --ctb --scn --ref --gn=5"

# az container create \
#     --resource-group iotc-rg-adxsb16 \
#     --name iotc-aci-plcsim \
#     --image mcr.microsoft.com/iotedge/opc-plc:2.2.0 \
#     --command-line "./opcplc  --pn=50000 --autoaccept --sph --sn=5 --sr=10 --st=uint --fn=5 --fr=1 --ft=uint --ctb --scn --ref --gn=5" \
# --restart-policy OnFailure

FROM mcr.microsoft.com/iotedge/opc-plc:2.2.0
