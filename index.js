const axios = require('axios');
const logger = require('./utilities/logger');
const timeoutInSeconds = 60;
const maxNumberOfImportRetries = 5;
const maxNumberOfReplicationRetries = 5;
const maxNumberOfExportRetries = 5;
const maxNumberOfRemoteFetchRetries = 5;

const simpleDatasetObjectIdPlaceholder = 'OBJECT_ID';
const simpleDatasetObjectValuePlaceholder = 'OBJECT_VALUE';
const simpleDatasetPropertiesPlaceholder = 'PROPERTIES';
const simpleDatasetTemplate = `
{
  "@graph": [
    {
      "@id": "${simpleDatasetObjectValuePlaceholder}",
      "@type": "otObject",
      "identifiers": [
        {
          "@type": "${simpleDatasetObjectIdPlaceholder}",
          "@value": "${simpleDatasetObjectValuePlaceholder}"
        }
      ],
      "properties": ${simpleDatasetPropertiesPlaceholder},
      "relations": []
    }
  ]
}
`

const IMPORT_STATUSES = {
    pending: 'PENDING',
    completed: 'COMPLETED',
    failed: 'FAILED'
}

const REPLICATION_STATUSES = {
    pending: 'PENDING',
    initialized: 'INITIALIZED',
    failed: 'FAILED'
}

const EXPORT_STATUSES = {
    pending: 'PENDING',
    failed: 'FAILED'
}

const REMOTE_FETCH_STATUSES = {
    pending: 'PENDING',
    failed: 'FAILED'
}

const defaultPublishOptions = {
    holding_time_in_minutes: 10,
    standard_id: 'GRAPH', // GS1-EPCIS | WOT | GRAPH
    urgent: true,
    blockchain_id: null,
}

const defaultExportOptions = {
    standard_id: 'GRAPH', // GS1-EPCIS | WOT | GRAPH
}

const defaultRemoteFetchOptions = {
    standard_id: 'GRAPH', // GS1-EPCIS | WOT | GRAPH
}

class DKGClient {

    init(nodeHostName, nodePort, useSSL = true, blockchainId = null, wallet = null) {
        if (!nodeHostName || !nodePort) {
            throw Error('nodeHostName and nodePort are required parameters');
        }
        this.nodeBaseUrl = `${useSSL? 'https://': 'http://'}${nodeHostName}:${nodePort}`;
    }

    /**
     * @param objectData -> { "identifierType": "id_name", "identifierValue": "id_value", "properties": {}}
     */
    simplePrepare(objectData) {

        var objectIdReg = new RegExp(simpleDatasetObjectIdPlaceholder, "g");
        var objectValueReg = new RegExp(simpleDatasetObjectValuePlaceholder, "g");
        let simpleDataset = simpleDatasetTemplate
            .replace(objectIdReg, objectData.identifier_type)
            .replace(objectValueReg, objectData.identifier_value);
        let properties = '{}';
        if (objectData.properties) {
            properties = JSON.stringify(objectData.properties);
        }
        simpleDataset = simpleDataset.replace(simpleDatasetPropertiesPlaceholder, properties);
        return simpleDataset;
    }

    publish(dataset, options = defaultPublishOptions) {
        if (!dataset) {
            throw Error('Please provide dataset in order to publish.')
        }
        let datasetId = '';
        return new Promise((resolve, reject) => {
            this._sendImportRequest( dataset, options)
                .then((response) => this._getImportResult(response.data.handler_id))
                .then((response) => {
                    datasetId = response.data.dataset_id;
                })
                .then(() => this._sendReplicationRequest(datasetId, options))
                .then((response) => this._getReplicationResult(response.data.handler_id))
                .then((response) => {
                    response.data.dataset_id = datasetId;
                    resolve(response)
                })
                .catch((error) => reject(error));
        });
    }

    export (datasetId, options = defaultExportOptions) {
        if (!datasetId) {
            throw Error('Please provide datasetId for export.')
        }
        return new Promise((resolve, reject) => {
            this._sendExportRequest(datasetId, options)
                .then((response) => this._getExportResult(response.data.handler_id))
                .then((response) => resolve(response))
                .catch((error) => reject(error));
        });
    }

    trail (query) {
        if (!query) {
            throw Error('Query parameter is required');
        }
        return new Promise((resolve, reject) => {
            this._sendTrailRequest(query)
                .then((response) => resolve(response.data))
                .catch((error) => reject(error))
        })
    }

    nodeInfo () {
        return new Promise((resolve, reject) => {
            this._sendNodeInfoRequest()
                .then((response) => resolve(response.data))
                .catch((error) => reject(error));
        })
    }

    networkQuery (query) {
        return new Promise((resolve, reject) => {
            let query_id;
            this._sendNetworkQuery(query)
                .then(async (response) =>{
                    logger.debug('Waiting for network query to be finalized before fetching query response')
                    await this.sleepForMilliseconds(10000);
                    query_id = response.data.query_id;
                })
                .then(() => this._getNetworkQueryResponse(query_id))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => reject(error));
        })
    }

    remoteFetch (networkReplyId, datasetId, options = defaultRemoteFetchOptions) {
        if (!networkReplyId || !datasetId) {
            throw Error('networkReplyId and datasetId are required parameters')
        }
        return new Promise((resolve, reject) => {
            let remoteFetchHandlerId;
            this._sendNetworkReadExportRequest(networkReplyId, datasetId, options)
                .then(async (response) =>{
                    remoteFetchHandlerId = response.data.handler_id;
                })
                .then(() => this._getNetworkReadExportResponse(remoteFetchHandlerId))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => reject(error));
        })
    }

    _sendNetworkReadExportRequest(networkReplyId, datasetId, options) {
        logger.debug('Sending remote fetch request')
        return axios.post(
            `${this.nodeBaseUrl}/api/latest/network/read_export`,
            {
                reply_id: networkReplyId,
                data_set_id: datasetId,
                standard_id: options.standard_id,
            },
            {timeout: timeoutInSeconds * 1000})
    }

    async _getNetworkReadExportResponse(networkReadExportHandlerId) {
        if (!networkReadExportHandlerId) {
            throw Error('Missing remote fetch handler id');
        }
        let response = {
            status: REMOTE_FETCH_STATUSES.pending
        }
        let retries = 0;
        do {
            retries++;
            await this.sleepForMilliseconds(5 * 1000);
            try {
                response = await axios.get(
                    `${this.nodeBaseUrl}/api/latest/network/read_export/result/${networkReadExportHandlerId}`,
                    {timeout: timeoutInSeconds * 1000}
                )
                logger.debug(`Remote fetch status: ${response.data.status}`);
            } catch (e) {
                if (retries === maxNumberOfRemoteFetchRetries) {
                    throw e;
                }
            }
        } while (response.data.status === REMOTE_FETCH_STATUSES.pending);
        if (response.data.status === REMOTE_FETCH_STATUSES.failed) {
            throw Error(`Network fetch failed. Reason: ${response.data.message}.`);
        }
        return response.data;
    }

    _sendNetworkQuery(query) {
        logger.debug('Sending network query request')
        return axios.post(
            `${this.nodeBaseUrl}/api/latest/network/query`,
            { headers: {'Content-Type': 'application/json'}, query},
            {timeout: timeoutInSeconds * 1000})
    }

    _getNetworkQueryResponse(networkQueryHandlerId) {
        logger.debug('Getting network query responses')
        return axios.get(
            `${this.nodeBaseUrl}/api/latest/network/query/responses/${networkQueryHandlerId}`,
            {timeout: timeoutInSeconds * 1000}
        )
    }

    _sendNodeInfoRequest() {
        logger.debug('Sending node info request')
        return axios.get(
            `${this.nodeBaseUrl}/api/latest/info`,
            {timeout: timeoutInSeconds * 1000}
        )
    }

    _sendImportRequest(dataset, options) {
        logger.debug('Sending import request.');
        return axios.post(
            `${this.nodeBaseUrl}/api/latest/import`,
            { standard_id: options.standard_id, file: dataset},
            { timeout: timeoutInSeconds * 1000 }
        );
    }

    async _getImportResult (importHandlerId) {
        if (!importHandlerId) {
            throw Error('Unable to start import');
        }
        let importResponse = {
            status: IMPORT_STATUSES.pending
        }
        let retries = 0;
        do {
            retries++;
            await this.sleepForMilliseconds(5 * 1000);
            try {
                importResponse = await axios.get(
                    `${this.nodeBaseUrl}/api/latest/import/result/${importHandlerId}`,
                    {timeout: timeoutInSeconds * 1000}
                )
                logger.debug(`Import result status: ${importResponse.data.status}`);
            } catch (e) {
                if (retries === maxNumberOfImportRetries) {
                    throw e;
                }
            }
        } while (importResponse.data.status === IMPORT_STATUSES.pending);
        if (importResponse.data.status === IMPORT_STATUSES.failed) {
            throw Error(`Import failed. Reason: ${importResponse.data.message}.`);
        }
        return importResponse.data;
    }

    _sendReplicationRequest(datasetId, options) {
        logger.debug('Sending replication request.');
        return axios.post(`${this.nodeBaseUrl}/api/latest/replicate`, {
            headers: { 'Content-Type': 'application/json' },
            dataset_id: datasetId,
            blockchain_id: options.blockchain_id,
            holding_time_in_minutes: options.holding_time_in_minutes,
            urgent: options.urgent,
        }, { timeout: timeoutInSeconds * 1000 })
    }

    async _getReplicationResult(replicationHandlerId) {
        if (!replicationHandlerId) {
            throw Error('Unable to start replication, handler id undefined.');
        }
        let replicationResponse = {
            status: REPLICATION_STATUSES.pending
        }
        let retries = 0;
        do {
            retries++;
            await this.sleepForMilliseconds(5 * 1000);
            try {
                replicationResponse = await axios.get(
                    `${this.nodeBaseUrl}/api/latest/replicate/result/${replicationHandlerId}`,
                    {timeout: timeoutInSeconds * 1000}
                )
                logger.debug(`Replication result status: ${replicationResponse.data.status}`);
            } catch (e) {
                if (retries === maxNumberOfReplicationRetries) {
                    throw e;
                }
            }
        } while (replicationResponse.data.status === REPLICATION_STATUSES.pending || replicationResponse.data.status === REPLICATION_STATUSES.initialized);
        if (replicationResponse.data.status === REPLICATION_STATUSES.failed) {
            throw Error(`Replication failed. Reason: ${replicationResponse.data.message}.`);
        }
        return replicationResponse.data
    }

    _sendExportRequest (datasetId, options) {
        logger.debug('Sending export request.');
        return axios.post(
            `${this.nodeBaseUrl}/api/latest/export`,
            { standard_id: options.standard_id, dataset_id: datasetId},
            { timeout: timeoutInSeconds * 1000 }
        );
    }

    async _getExportResult (exportHandlerId) {
        if (!exportHandlerId) {
            throw Error('Unable to start export, handler id undefined.');
        }
        let exportResponse = {
            status: EXPORT_STATUSES.pending
        }
        let retries = 0;
        do {
            retries++;
            await this.sleepForMilliseconds(5 * 1000);
            try {
                exportResponse = await axios.get(
                    `${this.nodeBaseUrl}/api/latest/export/result/${exportHandlerId}`,
                    {timeout: timeoutInSeconds * 1000}
                )
                logger.debug(`Export result status: ${exportResponse.data.status}`);
            } catch (e) {
                if (retries === maxNumberOfExportRetries) {
                    throw e;
                }
            }
        } while (exportResponse.data.status === EXPORT_STATUSES.pending);
        if (exportResponse.data.status === EXPORT_STATUSES.failed) {
            throw Error(`Export failed. Reason: ${exportResponse.data.message}.`);
        }
        return exportResponse.data
    }

    _sendTrailRequest(query){
        logger.debug('Sending trail request.');
        return axios.post(
            `${this.nodeBaseUrl}/api/latest/trail`,
            {
                headers: { 'Content-Type': 'application/json' },
                identifier_types: query.identifier_types,
                identifier_values: query.identifier_values,
                connection_types: query.connection_types,
                opcode: query.opcode,
                depth: query.depth,
                extended: query.extended,
            },
            { timeout: timeoutInSeconds * 1000 }
        );
    }

    async sleepForMilliseconds(milliseconds) {
        await new Promise(r => setTimeout(r, milliseconds));
    }
}

module.exports = DKGClient;
