/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {RestClient} from "../rest-client.js";


export class CellBaseClient {

    constructor(config) {
        // if (typeof config === "undefined") {
        //     this._config = new CellBaseClientConfig();
        // } else {
        //     this._config = config;
        // }

        // this._config = config;
        this.setConfig(config);
        if (this._config.cache.active) {
            this.indexedDBCache = new IndexedDBCache(this._config.cache.database);
            this._initCache();
        }
        this.check();
    }

    getDefaultConfig() {
        return {
            hosts: ["https://ws.opencb.org/cellbase-4.8.2"],
            version: "v4",
            species: "hsapiens",
            query: {
                batchSize: "",
                limit: 10
            },
            cache: {
                active: false,
                // TODO FIXME database: `${this.species}_${this.version}_cellbase_cache`,
                subcategories: ["genomic_chromosome", "genomic_region", "genomic_variant", "feature_gene", "feature_variation",
                    "feature_clinical", "feature_id", "feature_protein", "feature_transcript"]
            }
        };
    }

    check() {
        const globalEvent = new CustomEvent("signingInError", {
            detail: {
                value: "Cellbase host not available."
            }
        });
        this.getMeta("about")
            .then(response => {
                if (response?.response?.[0]?.result[0]["Program: "] !== "CellBase (OpenCB)") {
                    globalThis.dispatchEvent(globalEvent);
                }
            })
            .catch(e => {
                console.error(e);
                globalThis.dispatchEvent(globalEvent);
            });
    }

    _initCache() {
        this.indexedDBCache.createObjectStores(this._config.cache.subcategories);
    }

    /**
     * This method has been implemented to be backward compatible with old cellbase-manager.js
     */
    getOldWay(args) {
        return this.get(args.category, args.subcategory, args.id, args.resource, args.params, args.options);
    }

    getMeta(param, options = {}) {
        const hosts = options.hosts || this._config.hosts;
        const version = options.version || this._config.version;
        const count = 0;
        // let response;
        let url = `${hosts[count]}/webservices/rest/${version}/` + "meta" + `/${param}`;

        // By default we assume https protocol instead of http
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
            url = `https://${url}`;
        }

        // options.error = function() {
        //     if (++count < hosts.length) {
        //         // we need a new URL
        //         url = "http://" + hosts[count] + "/webservices/rest/" + version + "/" + "meta" + "/" + param;
        //         response = RestClient.call(url, options);
        //     } else {
        //         userError(this);
        //     }
        // };
        // response = RestClient.call(url, options);
        return RestClient.call(url, options);
    }

    getFiles(folderId, resource, params, options = {}) {
        const hosts = options.hosts || this._config.hosts;
        const version = options.version || this._config.version;
        const species = options.species || this._config.species;
        const count = 0;

        let url = `http://${hosts[count]}/webservices/rest/${version}/${species}/` + "files";

        if (typeof folderId !== "undefined" && folderId !== null && folderId !== "") {
            url += `/${folderId}/${resource}`;
        } else {
            url += `/${resource}`;
        }

        // We add the query params formatted in URL
        const queryParamsUrl = this._createSuffixKey(params, false);
        if (typeof queryParamsUrl !== "undefined" && queryParamsUrl !== null && queryParamsUrl !== "") {
            url += `?${queryParamsUrl}`;
        }
        return RestClient.call(url, options);
    }

    getGeneClient(id, resource, params, options) {
        return this.get("feature", "gene", id, resource, params, options);
    }

    getTranscriptClient(id, resource, params, options) {
        return this.get("feature", "transcript", id, resource, params, options);
    }

    getProteinClient(id, resource, params, options) {
        return this.get("feature", "protein", id, resource, params, options);
    }

    getVariationClient(id, resource, params, options) {
        return this.get("feature", "variation", id, resource, params, options);
    }

    getRegulatoryClient(id, resource, params, options) {
        return this.get("feature", "regulatory", id, resource, params, options);
    }

    async get(category, subcategory, ids, resource, params, options = {}) {
        // we store the options from the parameter or from the default values in config
        let hosts = options.hosts || this._config.hosts;

        if (!hosts) {
            throw new Error("Cellbase host not defined");
        }
        if (typeof hosts === "string") {
            hosts = hosts.split(",");
        }
        const cache = options.cache || this._config.cache;

        let response;
        if (cache.active) {
            const os = `${category}_${subcategory}`;

            const nonCachedIds = [];

            const cacheKeys = [];
            const suffixKey = this._createSuffixKey(params, true);

            let idArray = [];
            if (ids !== undefined && ids !== null) {
                idArray = ids.split(",");
                for (let i = 0; i < idArray.length; i++) {
                    cacheKeys.push(`${idArray[i]}_${resource}${suffixKey}`);
                }
            } else {
                cacheKeys.push(resource + suffixKey);
            }

            console.time("Cache time:");
            const _this = this;
            response = new Promise(function (resolve, reject) {
                _this.indexedDBCache.getAll(os, cacheKeys, function (results) {
                    let uncachedQueries = false;
                    for (let i = 0; i < results.length; i++) {
                        if (results[i] === undefined) {
                            uncachedQueries = true;
                            if (idArray.length > 0) {
                                nonCachedIds.push(idArray[i]);
                            }
                        }
                    }

                    options.cacheFn = function (dataResponse) {
                        // we add the new fetched data to the cache
                        const suffixKey = _this._createSuffixKey(params, true);
                        // We make a copy of dataResponse
                        const query = {};
                        for (const i in dataResponse) {
                            query[i] = dataResponse[i];
                        }
                        // And remove the key response
                        delete query["response"];

                        if (idArray.length > 0) {
                            for (let i = 0; i < dataResponse.response.length; i++) {
                                const result = {
                                    query: query,
                                    data: dataResponse.response[i]
                                };
                                // result['data'] = dataResponse.response[i];
                                // // Update the data time to 0
                                result.data.dbTime = 0;
                                _this.indexedDBCache.add(os, `${idArray[i]}_${resource}${suffixKey}`, result);
                            }
                        } else {
                            for (let i = 0; i < dataResponse.response.length; i++) {
                                const result = {
                                    query: query,
                                    data: dataResponse.response[i]
                                };
                                // Update the data time to 0
                                result.data.dbTime = 0;
                                _this.indexedDBCache.add(os, resource + suffixKey, result);
                            }
                        }
                    };
                    if (uncachedQueries) {
                        // response = _this._callRestWebService(hosts, category, subcategory, nonCachedIds, resource, params, options);
                        resolve(_this._callRestWebService(hosts, category, subcategory, nonCachedIds, resource, params, options));
                    } else {
                        const queryResponse = results[0].query;
                        queryResponse["response"] = [];
                        for (let i = 0; i < results.length; i++) {
                            queryResponse.response.push(results[i].data);
                        }
                        resolve(queryResponse);
                        // If the call is OK then we execute the success function from the user
                        if (typeof options !== "undefined" && typeof options.success === "function") {
                            options.success(response);
                        }
                    }
                    console.timeEnd("Cache time:");
                });
            });
        } else {
            response = this._callRestWebService(hosts, category, subcategory, ids, resource, params, options);
        }

        return response;
    }

    _callRestWebService(hosts, category, subcategory, ids, resource, params, options) {
        const version = options.version || this._config.version;
        const species = options.species || this._config.species;

        const count = 0;
        const url = this._createRestUrl(hosts[count], version, species, category, subcategory, ids, resource, params);
        /*
        let response;
        const userError = options.error;
        const _this = this;
        // if the URL query fails we try with next host

         options.error = function () {
            if (++count < hosts.length) {
                // we need a new URL
                url = _this._createRestUrl(hosts[count], version, species, category, subcategory, ids, resource, params);
                response = RestClient.call(url, options);
            } else {
                userError(this);
            }
        };*/
        return RestClient.call(url, options);
    }


    _createRestUrl(host, version, species, category, subcategory, ids, resource, params) {
        let _host = host;
        // Remove trailing '/'
        if (_host.endsWith("/")) {
            _host = _host.slice(0, -1);
        }

        // By default we assume https protocol instead of http
        let url = _host + `/webservices/rest/${version}/${species}/`;
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
            url = `https://${_host}/webservices/rest/${version}/${species}/`;
        }

        // Some web services do not need IDs
        if (typeof ids !== "undefined" && ids !== null && ids.length > 0) {
            url += `${category}/${subcategory}/${ids}/${resource}`;
        } else {
            url += `${category}/${subcategory}/${resource}`;
        }

        // We add the query params formatted in URL
        const queryParamsUrl = this._createSuffixKey(params, false);
        if (typeof queryParamsUrl !== "undefined" && queryParamsUrl != null && queryParamsUrl !== "") {
            url += `?${queryParamsUrl}`;
        }
        return url;
    }

    _createSuffixKey(params, suffix) {
        // Do not remove the sort! we need to sort the array to ensure that the key of the cache will be correct
        const keyArray = _.keys(params).sort();
        const keyValueArray = [];
        for (const i in keyArray) {
            keyValueArray.push(`${keyArray[i]}=${encodeURIComponent(params[keyArray[i]])}`);
        }
        let suffixKey = keyValueArray.join("&");
        // suffixKey is preceded by '_' if suffix is true. Else it is treated as queryParam that needs to be sorted
        if (suffix && suffixKey !== "") {
            suffixKey = `_${suffixKey}`;
        }
        return suffixKey;
    }

    getConfig() {
        return this._config;
    }

    setConfig(config) {
        this._config = {...this.getDefaultConfig(), ...config};
        // this.clients = new Map();
    }

}
