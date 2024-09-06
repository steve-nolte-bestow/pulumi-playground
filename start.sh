#!/bin/sh

set -x

minikube start

pulumi login --local

pulumi new kubernetes-typescript --force

# copy docker image into minikube
minikube image load my-rest-api

# https://www.pulumi.com/registry/packages/kubernetes/how-to-guides/kubernetes-ts-exposed-deployment/
# didn't work :shrug:
#pulumi config set isMinikube true

pulumi up

npm install @pulumi/kubernetes @pulumi/postgresql

# forward the cluster port to the local machine and access the service via localhost:3000
kubectl port-forward services/api-service 3000:3000

curl http://localhost:3000/api | jq .

