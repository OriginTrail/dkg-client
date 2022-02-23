const AbstractClient = require("./abstract-client");
const AssetsProxyPath = require("../utilities/assets-proxy-path");

class AssetsClient extends AbstractClient {
    constructor(options) {
        super(options);
        this._assetsProxyPath = new AssetsProxyPath(options);
    }

    /**
     * @param {object} options
     * @param {string} options.filepath - path to the dataset (optional)
     * @param {string} options.data - stringified dataset (optional)
     * @param {string[]} options.keywords (optional)
     */
    create(options) {
        if (!options || (!options.filepath && !options.data)) {
            throw Error("Please provide publish options in order to publish.");
        }
        options.method = 'provision';
        return new Promise((resolve, reject) => {
            this._publishRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: options.method,
                    })
                )
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
    }

    /**
     * @param {object} options
     * @param {string} options.filepath - path to the dataset (optional)
     * @param {string} options.data - stringified dataset (optional)
     * @param {string[]} options.keywords (optional)
     */
    update(ual, options) {
        if (!options || (!options.filepath && !options.data)) {
            throw Error("Please provide publish options in order to publish.");
        }
        options.ual = ual;
        options.method = 'update';
        return new Promise((resolve, reject) => {
            this._publishRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: options.method,
                    })
                )
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
    }

    async get(ual, commitHash) {
        //TODO add cache

        let result;
        if (commitHash)
            result = await this.resolve({ids: [commitHash]});
        else
            result = await this.resolve({ids: [ual]});
        if (result.status === this.STATUSES.completed) {
            const data = result.data[0].result;

            return this._assetsProxyPath.createPath(
                Object.assign(Object.create(null), undefined, undefined),
                Object.assign(Object.create(null), undefined, data),
                ual
            );
        }

        return undefined;
    }

    async getStateCommitHashes(ual) {
        //TODO add cache

        let result = await this.resolve({ids: [ual]});
        if (result.status === this.STATUSES.completed) {
            return result.data[0].result.assertions;
        }
        return undefined;
    }


    transfer(options) {
        //TODO
    }

    approve(options) {
        //TODO
    }


}

module.exports = AssetsClient;
