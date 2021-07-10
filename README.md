![](https://i.imgur.com/XkISdML.png)

# DKG Client

**Javascript library for interaction with the OriginTrail Decentralized Knowledge Graph**

**Note**: This library is currently in beta, so you can expect issues to arise. We'd appreciate that if you do run into trouble, you [open up an issue on this repository](https://github.com/OriginTrail/dkg-client/issues) and let us know. 

The official OriginTrail documentation can be found [here](https://docs.origintrail.io/en/latest/).


## Intro - What is a Decentralized Knowledge Graph (DKG)


There are many avaialable definitions of a knowlege graph, therefore we will present a simplified one focused on usability, rather than completeness. The purpose of this introduction is not to be a comprehensive guide for knowledge graphs, however it aims to get you started with the basics.

A **knowledge graph (KG)** is a network of entities — physical & digital objects, events or concepts — illustrating the relationship between them (aka a semantic network). KGs are used by major companies such as [Amazon](http://lunadong.com/talks/PG.pdf), [Google](https://en.wikipedia.org/wiki/Google_Knowledge_Graph), [Uber](https://www.youtube.com/watch?v=r3yMSl5NB_Q), [IBM](https://www.ibm.com/cloud/learn/knowledge-graph) etc for various applications: search, data integration, knowledge reasoning, recommendation engines, analytics, machine learning and AI etc.

Key characteristics of knowledge graphs:
* focus on data connections as "first class citizens" (linked data) 
* designed to ingest data from multiple sources, usually in different formats
* flexible data model, easily extendable

Common knowledge graphs however are deployed within the domain of one organization and are designed to capture knowledge from various sources both from within and outside of the organization.

We define **decentralized knowledge graph (DKG)** as a global shared knowledge graph that is designed to benefit organizations and individuals by providing a common infrastructure for data exchange. The DKG:

* Enables Dapps with search, integration, analytics, AI and ML capabilities for any data source: blockchains, IPFS, enterprise systems, web services, personal devices 
* Removes central authorities (decentralized infrastructure)
* Enables permissionless PUBLISH and QUERY (public network)
* Decentralized identity & Verifiable Credentials based access control (references private data)

## The OriginTrail DKG Architecture 

The OriginTrail Decentralized Network implements the DKG according the the OriginTrail protocol.

It is:

* **a permissionless network** - anyone can run OriginTrail nodes
* **a multi-chain data exchange network** - connects to several blockchains (currently Ethereum and xDai with more integrations upcoming such as with Polkadot)
* **designed for off-chain data exchange using standardized data models** (GS1 & W3C standards and recommendations)
* **public open source software**
* **infrastructure for knowledge marketplaces & tenders** - more info [here](https://www.youtube.com/watch?v=4uCxYGRh5fk)

More information is available on the OriginTrail [website](https://origintrail.io), [official documentation](https://docs.origintrail.io) and [blog](https://medium.com/origintrail).


![](https://i.imgur.com/yTNtZE1.png)



## DKG Client library

This library provides an interface into the OriginTrail Decentralized Knowledge Graph, enabling:

* importing & publishing of data to the public DKG
* network and local querying of information based on topics and identifiers
* verifying the integrity of queried data
* exporting of datasets in different [formats](https://docs.origintrail.io/en/latest/ODN-Functionalities/dataset-operations.html#supported-standards)

### Instalation

```
npm install dkg-client
```

### Setting up your development environment

The easiest way to jumpstart development in a local environment is to [initialize a local OriginTrail DKG network](https://github.com/OriginTrail/ot-node/tree/develop/tools/local-network-setup).

This process will:
* run two instances of EVM blockchains (evm_chain_1 and evm_chain_2) on local ganache
* deploy OriginTrail DKG Smart contracts two both blockchains
* bootstrap a network of N DKG nodes (default is 4 at ports 8900, 8901, 8902, 8903)


### Getting started


```javascript=
const DKGClient = require('@origintrail-official/dkg-client');

const dkg = new DKGClient();

const OT_NODE_HOSTNAME = '0.0.0.0';
const OT_NODE_PORT = '8900';

# initialize connection to your DKG Node
dkg.init(OT_NODE_HOSTNAME,OT_NODE_PORT,false);


# prepare a simple dataset for publishing, containing one entity
const simpleDataset = dkg.simplePrepare({
    identifier_type: 'type_of_indentifier', #e.g. DID, SGTIN, URL etc
    identifier_value: '12345',
    properties:{
        hello: 'world'
    }
});


# publishing a dataset
dkg.publish(simpleDataset).then((publish_result)=>{
    console.log(publish_result);
});


# exporting a dataset
dkg.export(dataset_id).then((export_result)=>{
    console.log(export_result);
});


# traverses the graph of the entity identified with the identifier (the trail)
dkg.trail({
        identifier_types: ['type_of_identifier'],
        identifier_values: ['12345'],
        connection_types: [],
        opcode: 'EQ',
        depth: 10,
        extended: false
}).then((result)=>{
        console.log(result);
});
    

# simple query for the same object on the network, a remote fetch it from the first response received    
dkg.networkQuery([{
            path: 'type_of_identifier',
            value: '12345',
            opcode: 'EQ'
        }]
).then((result)=>{
       console.logo(result);
        const queryResponse = result[0];
        dkg.remoteFetch(queryResponse.reply_id, queryResponse.datasets[0].data_set_id).then((result)=>{
            console.log(result);
        }, (error) => {
            console.log(error.response.data.message);
        }).catch((error) => {
            console.log(error);
        })
});

```

### Complex queries

Complex queries are currently supported on the level of the local graph database instance. The workflow for interacting with the DKG is to:

* discover information on the network via the network query
* remote-fetch information in the local graph DB
* query the graph DB locally

The upcoming versions of ot-node will add further support for complex querying (SPARQL, GraphQL, Pathquery), however the intention of the OriginTrail DKG is not to reinvent the wheel, rather leverage existing graph solutions in the space - OriginTrail is about connecting, rather than replacing. 
To stay up to date, check out the official project [roadmap](https://origintrail.io/roadmap).

## Learn more

More information can be found on the [official DKG documentation](https://docs.origintrail.io/), [website](https://origintrail.io) and [Github](https://github.com/OriginTrail).

## Get in touch

Get in touch with the OriginTrail tech community through [Discord](https://discordapp.com/invite/FCgYk2S). 


#traceon