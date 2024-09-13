# Vector Search Workshop with Couchbase and Node.js
![Test Suite](https://github.com/hummusonrails/vector-search-nodejs-workshop/actions/workflows/test.yml/badge.svg)
![Couchbase Capella](https://img.shields.io/badge/Couchbase_Capella-Enabled-red)
[![License: MIT](https://cdn.prod.website-files.com/5e0f1144930a8bc8aace526c/65dd9eb5aaca434fac4f1c34_License-MIT-blue.svg)](/LICENSE)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/hummusonrails/vector-search-nodejs-workshop)

This workshop is designed to help you get started with vector search using Couchbase and Node.js. We will be using the [Couchbase Node.js SDK](https://docs.couchbase.com/nodejs-sdk/current/hello-world/start-using-sdk.html) and [Couchbase Capella](https://www.couchbase.com/products/cloud) managed database service.

The entire workshop will be run from inside a GitHub Codespace, which is a cloud-based development environment that is pre-configured with all the necessary tools and services. You don't need to install anything on your local machine.

## Prerequisites

- A GitHub account
- A Couchbase Capella account

## Workshop Outline

1. [Create a Capella Account](#create-a-capella-account)
2. [Create a Couchbase Cluster](#create-a-couchbase-cluster)
3. [Create a Bucket](#create-a-bucket)
4. [Transform Data](#transform-data)
5. [Index Data](#index-data)
6. [Search Data](#search-data)

## Create a Capella Account

Couchbase Capella is a fully managed database service that provides a seamless experience for developers to build modern applications. You can sign up for a free account at [https://cloud.couchbase.com/signup](https://cloud.couchbase.com/signup).

<img src="workshop_images/capella_create_account_page.png" alt="Create an Account Page Screenshot" width="50%">

## Create a Couchbase Cluster

Once you have created an account, you can create a new Couchbase cluster by following the steps below:

1. Click on the "Create Cluster" button on the Capella dashboard.

<img src="workshop_images/create_cluster_button.png" alt="Create Cluster Button Screenshot" width="50%">

2. Choose a cloud provider, name and region for your cluster and click on the "Create Cluster" button.

<img src="workshop_images/create_cluster_options.png" alt="Create Cluster Options Screenshot" width="50%">

## Create a Bucket

After creating a cluster, you can create a new bucket by following the steps below:

1. Click on the "+ Create" button from inside the cluster dashboard.

<img src="workshop_images/create_bucket_button.png" alt="Create Bucket Button Screenshot" width="50%">

2. Define the options for your bucket and click on the "Create" button.

<img src="workshop_images/create_bucket_options.png" alt="Create Bucket Options Screenshot" width="50%">

## Transform Data

Before we can index and search data, we need to transform it into a format that can be used by the vector search engine. We will be using [Couchbase Vector Search](https://docs.couchbase.com/server/current/fts/fts-vector-search.html) for this workshop.

Provided in this repository is an Express.js application that will expose a `/embed` endpoint to transform the data.

The Codespace environment already has all the dependencies installed. You can start the Express.js application by running the following command:

```bash
node server.js
```

The repository also has a sample set of data in the `./data` directory. You can transform this data by making a POST request to the `/embed` endpoint providing the paths to the data files as an array in the request body.

```bash
curl -X POST http://localhost:3000/embed -H "Content-Type: application/json" -d '["./data/data1.json", "./data/data2.json"]'
```

The data has now been converted into vector embeddings and stored in the Couchbase bucket that you created earlier.

## Index Data

Once the vector embeddings have been stored in the Couchbase bucket, we can create a vector search index to enable similarity search. 

