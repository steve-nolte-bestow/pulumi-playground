import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as postgres from "@pulumi/postgresql";

// Minikube does not implement services of type `LoadBalancer`; require the user to specify if we're
// running on minikube, and if so, create only services of type ClusterIP.
const config = new pulumi.Config();
const isMinikube = config.requireBoolean("isMinikube");

// Define the PostgreSQL deployment
const postgresDeployment = new k8s.apps.v1.Deployment("postgres-deployment", {
    spec: {
        selector: { matchLabels: { app: "postgres" } },
        replicas: 1,
        template: {
            metadata: { labels: { app: "postgres" } },
            spec: {
                containers: [
                    {
                        name: "postgres",
                        image: "postgres:latest",
                        ports: [{ containerPort: 5432 }],
                        env: [
                            { name: "POSTGRES_USER", value: "admin" },
                            { name: "POSTGRES_PASSWORD", value: "password" },
                            { name: "POSTGRES_DB", value: "mydb" },
                        ],
                    },
                ],
            },
        },
    },
});

// Define the PostgreSQL service
const postgresService = new k8s.core.v1.Service("postgres-service", {
    spec: {
        selector: { app: "postgres" },
        ports: [{ port: 5432, targetPort: 5432 }],
    },
});

// Define the REST API deployment
const apiDeployment = new k8s.apps.v1.Deployment("api-deployment", {
    spec: {
        selector: { matchLabels: { app: "api" } },
        replicas: 1,
        template: {
            metadata: { labels: { app: "api" } },
            spec: {
                containers: [
                    {
                        name: "api",
                        image: "my-rest-api", // Replace with your API Docker image
			imagePullPolicy: "Never",
                        ports: [{ containerPort: 3000 }],
                        env: [
                            { name: "DATABASE_HOST", value: postgresService.metadata.name },
                            { name: "DATABASE_PORT", value: "5432" },
                            { name: "DATABASE_USER", value: "admin" },
                            { name: "DATABASE_PASSWORD", value: "password" },
                            { name: "DATABASE_NAME", value: "mydb" },
                        ],
                    },
                ],
            },
        },
    },
});

// Define the REST API service
const apiService = new k8s.core.v1.Service("api-service", {
    metadata: {
        name: "api-service" // user-specified name
    },
    spec: {
        selector: { app: "api" },
        ports: [{ port: 3000, targetPort: 3000 }],
        type: isMinikube ? "ClusterIP" : "LoadBalancer"
    },
});

// Export the API service URL
export const ip = isMinikube
    ? apiService.spec.clusterIP
    : apiService.status.loadBalancer.apply(
          (lb) => lb.ingress[0].ip || lb.ingress[0].hostname
      );
