const AbstractClient = require("./abstract-client");

class NativeClient extends AbstractClient {
    constructor(props) {
        super(props);
    }

    /**
     * @param {object} options
     * @param {string} options.filepath - path to the dataset (optional)
     * @param {string} options.data - stringified dataset (optional)
     * @param {string[]} options.keywords (optional)
     */
    publish(options) {
        if (!options || (!options.filepath && !options.data)) {
            throw Error("Please provide publish options in order to publish.");
        }
        options.method = 'publish';
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
}

module.exports = NativeClient;
