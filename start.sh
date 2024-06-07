#!/bin/sh

set -x

minikube start

pulumi login --local

pulumi new kubernetes-typescript --force

pulumi up

