![](https://i.imgur.com/XkISdML.png)

# DKG Client v6

**Javascript library for interaction with the OriginTrail Decentralized Knowledge Graph**

**Note**: This library is currently in beta, so you can expect issues to arise. We'd appreciate that if you do run into trouble, you [open up an issue on this repository](https://github.com/OriginTrail/dkg-client/issues) and let us know. 
Also, there are two actively maintained versions, v5 and v6, make sure you are using the appropriate one.
The official OriginTrail documentation for v6 can be found [here](https://docs.origintrail.io/dkg-v6-upcoming-version/introduction-to-dkg-v6-start-here).


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

```sh
npm install dkg-client
```

### Setting up your development environment

The easiest way to jumpstart development in a local environment is to [set up OT-node v6 in local environment or connect it to public beta DKG](https://docs.origintrail.io/dkg-v6-upcoming-version/setup-instructions-dockerless).

### Getting started


```js
const DKGClient = require('dkg-client');

const OT_NODE_HOSTNAME = '0.0.0.0';
const OT_NODE_PORT = '8900';

// initialize connection to your DKG Node
let options = { endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, useSSL: false };
const dkg = new DKGClient(options);

// get info about endpoint that you connected to
dkg.nodeInfo().then(result => console.log(result));

// publishing a dataset
options = { filepath: './kg-example.json', assets: ['ExecutiveAnvil'], keywords: ['Product', 'Executive Objects', 'ACME'], visibility: true };
dkg.publish(options).then((result) => {
    console.log(JSON.stringify(result))
});

// resolving assertion
options =  { ids: [
        '066787bc7269c062fe73b0ebb004c258e07151777e6dfba027fea046df5caf7c',
        '2286826799d0a32a6f0eec7813fcb627910be45fca21f6378cb26ca95097c939'
    ] };dkg.resolve(options).then((result) => {
    console.log(JSON.stringify(result));
});

// search assertions
options = { query: 'Product', resultType: 'assertions' };
dkg.search(options).then((result) => {
    console.log(JSON.stringify(result));
});

// search entities
options = { query: 'Product', resultType: 'entities' };
dkg.search(options).then((result) => {
    console.log(JSON.stringify(result));
});

// execute sparql query on dkg
options = {
    query: `PREFIX schema: <http://schema.org/>
            CONSTRUCT { ?s ?p ?o }
            WHERE {
                GRAPH ?g {
                ?s ?p ?o .
                ?s schema:hasVisibility ?v
            }
        }`
};
dkg.query(options).then((result) => {
    console.log(JSON.stringify(result));
});

// validate some triples that we can get querying
options = {
    nquads: ['<did:dkg:87c4edd8695ab8a493015361b5a564c82f90f4c5e6c5e5cc9adccf4e11a63ad7> <http://schema.org/hasType> \"person\" .',
        '<did:dkg:25304bfd61ddcf490dfe852b883c01918768c114a84dcda0ac4aff179ff9ba65> <http://schema.org/hasType> \"person\" .',
    ],
};
await dkg.validate(options).then((result) => {
    console.log(JSON.stringify(result, null, 2));
});

```

## Learn more

More information can be found on the [official DKGv6 documentation](https://docs.origintrail.io/dkg-v6-upcoming-version/introduction-to-dkg-v6-start-here), [website](https://origintrail.io) and [Github](https://github.com/OriginTrail).

## Get in touch

Get in touch with the OriginTrail tech community through [Discord](https://discordapp.com/invite/FCgYk2S). 


#traceon
