#!/bin/sh

set -x

minikube start

pulumi login --local

pulumi new kubernetes-typescript --force

# https://www.pulumi.com/registry/packages/kubernetes/how-to-guides/kubernetes-ts-exposed-deployment/
pulumi config set isMinikube true

pulumi up

npm install @pulumi/kubernetes @pulumi/postgresql

