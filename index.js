const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const timeoutInSeconds = 60;
const maxNumberOfRetries = 5;

const STATUSES = {
    pending: 'PENDING',
    completed: 'COMPLETED',
    failed: 'FAILED',
}

class DKGClient {

    constructor(options) {
        if (!options.nodeHostname || !options.nodePort) {
            throw Error('nodeHostName and nodePort are required parameters');
        }
        this.nodeBaseUrl = `${options.useSSL ? 'https://' : 'http://'}${options.nodeHostname}:${options.nodePort}`;
    }

    /**
     * Get node information (version, is autoupgrade enbled, is telemetry enabled)
     */
    nodeInfo() {
        return new Promise((resolve, reject) => {
            this._sendNodeInfoRequest()
                .then((response) => resolve(response.data))
                .catch((error) => reject(error));
        })
    }

    _sendNodeInfoRequest() {
        console.debug('Sending node info request')
        return axios.get(
            `${this.nodeBaseUrl}/info`,
            { timeout: timeoutInSeconds * 1000 }
        )
    }

    /**
     * @param {object} options
     * @param {string} options.filepath - path to the dataset
     * @param {string[]} options.assets (optional)
     * @param {string[]} options.keywords (optional)
     */
    publish(options) {
        if (!options || !options.filepath) {
            throw Error('Please provide publish options in order to publish.');
        }
        return new Promise((resolve, reject) => {
            this._publishRequest(options)
                .then((response) => this._getResult({ handler_id: response.data.handler_id, operation: 'publish' }))
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => reject(error));
        });
    }

    _publishRequest(options) {
        console.debug('Sending publish request.');
        const form = new FormData();
        form.append('file', fs.createReadStream(options.filepath));
        form.append('assets', JSON.stringify([`${options.assets}`]));
        form.append('visibility', JSON.stringify(!!options.visibility));
        let axios_config = {
            method: 'post',
            url: `${this.nodeBaseUrl}/publish`,
            headers: {
                ...form.getHeaders()
            },
            data: form
        }

        return axios(axios_config);
    }

    /**
     * @param {object} options
     * @param {string[]} options.ids - assertion ids
     */
    resolve(options) {
        if (!options || !options.ids) {
            throw Error('Please provide resolve options in order to resolve.')
        }
        return new Promise((resolve, reject) => {
            this._resolveRequest(options)
                .then((response) =>
                    this._getResult({ handler_id: response.data.handler_id, operation: 'resolve' }))
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => reject(error));
        });
    }

    _resolveRequest(options) {
        console.debug('Sending resolve request.');
        const form = new FormData();
        let axios_config = {
            method: 'get',
            url: `${this.nodeBaseUrl}/resolve?ids=${options.ids}`,
            headers: {
                ...form.getHeaders()
            },
            data: form
        }
        return axios(axios_config);
    }

    /**
     * @param {object} options
     * @param {string} options.query - search term
     * @param {string} options.resultType - result type: assertions or entities
     * @param {boolean} options.prefix (optional)
     * @param {number} options.limit (optional)
     * @param {string[]} options.issuers (optional)
     * @param {string} options.schemaTypes (optional)
     * @param {number} options.numberOfResults (optional)
     * @param {number} options.timeout (optional)
     */
    search(options) {
        if (!options || !options.query || !options.resultType) {
            throw Error('Please provide search options in order to search.')
        }
        return new Promise((resolve, reject) => {
            this._searchRequest(options)
                .then((response) => this._getSearchResult({ handler_id: response.data.handler_id, resultType: options.resultType }))
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => reject(error));
        });
    }

    _searchRequest(options) {
        console.debug('Sending search request.');
        const form = new FormData();
        let prefix = options.prefix ? options.prefix : true;
        let limit = options.limit ? options.limit : 20;
        let query = options.query;
        let resultType = options.resultType;
        let url = `${this.nodeBaseUrl}/${resultType}:search?query=${query}`;
        if(resultType === 'entities'){
            url = `${this.nodeBaseUrl}/${resultType}:search?query=${query}&limit=${limit}&prefix=${prefix}`
        }
        let axios_config = {
            method: 'get',
            url,
            headers: {
                ...form.getHeaders()
            },
            data: form
        }
        return axios(axios_config);
    }

    async _getSearchResult(options) {
        if (!options.handler_id) {
            throw Error('Unable to get results, need handler id');
        }
        let searchResponse = {
            status: STATUSES.pending
        }
        let retries = 0;
        const form = new FormData();
        let axios_config = {
            method: 'get',
            url: `${this.nodeBaseUrl}/${options.resultType}:search/result/${options.handler_id}`,
            headers: {
                ...form.getHeaders()
            },
        }
        // TODO timeout or number of results
        do {
            retries++;
            await this.sleepForMilliseconds(1 * 1000);
            try {
                searchResponse = await axios(axios_config);
                console.debug(`Search result status: ${searchResponse.data.status}`);
            } catch (e) {
                console.log(e);
                if (retries === maxNumberOfRetries) {
                    throw e;
                }
            }
        } while (searchResponse.data.status === STATUSES.pending);
        if (searchResponse.data.status === STATUSES.failed) {
            throw Error(`Search failed. Reason: ${searchResponse.data.message}.`);
        }
        return searchResponse.data;
    }

    /**
     * @param {object} options
     * @param {string} options.query - sparql query
     */
    query(options) {
        if (!options || !options.query ) {
            throw Error('Please provide options in order to query.')
        }
        return new Promise((resolve, reject) => {
            this._queryRequest(options)
                .then((response) =>
                    this._getResult({ handler_id: response.data.handler_id, operation: 'query' }))
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => reject(error));
        });
    }

    _queryRequest(options) {
        console.debug('Sending query request.');
        const form = new FormData();
        let type = options.type ? options.type : 'construct';
        form.append('query', options.query);
        let axios_config = {
            method: 'post',
            url: `${this.nodeBaseUrl}/query?type=${type}`,
            headers: {
                ...form.getHeaders()
            },
            data: form
        }
        return axios(axios_config);
    }

    /**
     * @param {object} options
     * @param {string[]} options.assertions
     * @param {string[]} options.nquads
     * @param {object} options.validationInstructions
     */
    validate(options) {
        if (!options || !options.assertions || !options.nquads) {
            throw Error('Please provide assertions and nquads in order to get proofs.')
        }
        return new Promise((resolve, reject) => {
            this._getProofsRequest(options)
                .then((response) =>
                    this._getResult({ handler_id: response.data.handler_id, operation: 'proofs:get' }))
                .then((response) => {
                    console.log(response);

                    resolve(response)
                })
                .catch((error) => reject(error));
        });
    }

    _getProofsRequest(options) {
        console.debug('Sending get proofs request.');
        const form = new FormData();
        let assertions = options.assertions;
        let nquads = options.nquads;
        form.append('nquads', JSON.stringify([`${nquads}`]));
        let axios_config = {
            method: 'post',
            url: `${this.nodeBaseUrl}/proofs:get?assertions=${assertions}`,
            headers: {
                ...form.getHeaders()
            },
            data: form
        }
        return axios(axios_config);
    }

    async _getResult(options) {
        if (!options.handler_id || !options.operation) {
            throw Error('Unable to get results, need handler id and operation');
        }
        let response = {
            status: STATUSES.pending
        }
        let retries = 0;
        const form = new FormData();
        let axios_config = {
            method: 'get',
            url: `${this.nodeBaseUrl}/${options.operation}/result/${options.handler_id}`,
            headers: {
                ...form.getHeaders()
            },
        }
        do {
            retries++;
            await this.sleepForMilliseconds(1 * 1000);
            try {
                response = await axios(axios_config);
                console.debug(`${options.operation} result status: ${response.data.status}`);
            } catch (e) {
                console.log(e);
                if (retries === maxNumberOfRetries) {
                    throw e;
                }
            }
        } while (response.data.status === STATUSES.pending);
        if (response.data.status === STATUSES.failed) {
            throw Error(`Get ${options.operation} failed. Reason: ${response.data.message}.`);
        }
        return response.data;
    }

    async sleepForMilliseconds(milliseconds) {
        await new Promise(r => setTimeout(r, milliseconds));
    }

}

module.exports = DKGClient;
