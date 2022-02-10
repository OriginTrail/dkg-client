const EMPTY = Object.create(null);

class AssetsProxyPath {
    constructor() {
        let {
            handlers = EMPTY,
            resolvers = []
        } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        this._handlers = handlers;
        this._resolvers = resolvers;
    }

    /**
     * Creates a path Proxy with the given settings and internal data fields.
     */


    createPath() {
        let settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        let data = arguments.length > 1 ? arguments[1] : undefined;
        // The settings parameter is optional
        if (data === undefined) [data, settings] = [settings, {}]; // Create the path's internal data object and the proxy that wraps it

        const {
            apply,
            ...rawData
        } = data;
        let path = apply ? Object.assign(callPathFunction, rawData) : rawData;
        path = {data: path};
        const proxy = new Proxy(path, this);
        path.proxy = proxy;
        path.settings = settings;

        function callPathFunction() {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return apply(args, path, proxy);
        }


        if (!path.extendPath) {
            const pathProxy = this;

            path.extendPath = function extendPath(newData) {
                return pathProxy.createPath(settings, {
                    extendPath,
                    ...newData
                });
            };
        } // Return the proxied path


        return proxy;
    }

    /**
     * Handles access to a property
     */
    get(path, property) {
        function helper(path) {
            delete path.data.extendPath;
            if (path.data.property)
                return path.data.property;
            else
                return path.data;
        }

        if (property === 'valueOf') {
            return helper(path)
        }

        if (typeof path.data[property] === "function") {
            return function () {
                return helper(path)
            }
        }

        if (path.data[property]) {
            let newData;
            if (typeof path.data[property] === 'string' || path.data[property] instanceof String)
                newData = {property: path.data[property]}
            else
                newData =path.data[property];
            return path.extendPath(newData);
        }

        return undefined;
    }
}

module.exports = AssetsProxyPath;