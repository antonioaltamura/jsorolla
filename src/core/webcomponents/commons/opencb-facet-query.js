/**
 * Copyright 2015-2019 OpenCB
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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../utilsNew.js";
import PolymerUtils from "../PolymerUtils.js";
import "./opencb-facet-results.js";
import "../loading-spinner.js";


//TODO delete opencga-variant-facet-query and use this for variant too
//TODO this components needs cleaning from the old code
//TODO avg(popFreq__1kG_phase3__AFR)[0..1]:0.1>>avg(popFreq__GNOMAD_GENOMES__EAS[0..1]):0.1

class OpencbFacetQuery extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            resource: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            query: {
                type: Object
            },
            cellbaseClient: {
                type: Object
            },
            populationFrequencies: {
                type: Object
            },
            config: {
                type: Object
            },
            active: {
                type: Boolean
            }
        };
    }

    _init() {
        this._prefix = "facet" + UtilsNew.randomString(6);

        // this.checkProjects = true;

        // These are for making the queries to server
        this.facetFields = [];
        this.facetRanges = [];

        this.facetFieldsName = [];
        this.facetRangeFields = [];

        this.results = [];
        this._showInitMessage = true;

        this.facetFilters = [];

        this.facetActive = true;
        this.facetResults = [];
    }

    connectedCallback() {
        super.connectedCallback();
        if(this.config.summary && this.config.summary.fields){
            this.facetFilters = this.config.summary.fields;
        } else {
            throw new Error("DefaultStats fields has not been configured");
        }

    }

    firstUpdated(_changedProperties) {
        $(".bootstrap-select", this).selectpicker();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("query")) {
            this.propertyObserver();
        }
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }
        if (changedProperties.has("active")) {
            this.fetchDefaultData();
        }
    }

    propertyObserver(opencgaSession, query) {
        // this.clear();
        //PolymerUtils.show(this._prefix + "Warning");
    }

    queryObserver() {
        console.log("queryObserver  in facet!")
        //executedQuery in opencga-variant-browser has changed so, if requested,  we have to repeat the facet query
        this.facetResults = [];
        this.fetchDefaultData();
    }

    configObserver() {

    }

    fetchDefaultData() {
        //this.facetResults is reset in queryObserver
        if(this.active && this.config && !this.facetResults.length) {
            //this.addDefaultStats();
            this.fetchData();
        }
    }

    fetchData() {
        if (UtilsNew.isUndefinedOrNull(this.opencgaSession.opencgaClient)) {
            console.log("opencgaClient is null or undefined");
            return;
        }

        PolymerUtils.hide(this._prefix + "Warning");

        this.clearPlots();
        this.loading = true;
        //this.querySelector("#loading").style.display = "block";

        // Join 'query' from left menu and facet filters
        let queryParams = {...this.query,
            study: this.opencgaSession.study.fqn,
            sid: this.opencgaSession.opencgaClient._config.sessionId,
            fields: this.facetFilters.join(";"),
            timeout: 60000};

        console.warn("queryParams", queryParams);

        this.opencgaSession.opencgaClient[this.resource]().aggregationStats(queryParams)
            .then(queryResponse => {
                this.facetResults = queryResponse.response[0].result[0].results;
                this.loading = false;
                //this.querySelector("#loading").style.display = "none";
                this._showInitMessage = false;
            })
            .catch( e => {
                console.log(e);
                //this.querySelector("#loading").style.display = "none";
                this.loading = false;
                this.errorState = "Error from server: " + e.error;
                this._showInitMessage = false;
            })
            .finally(() => this.requestUpdate());

    }

    clearPlots() {
        if (UtilsNew.isNotUndefined(this.results) && this.results.length > 0) {
            for (let result of this.results) {
                PolymerUtils.removeElement(this._prefix + result.name + "Plot");
            }
        }
        this.results = [];
    }

    clear() {
        this.clearPlots();
        this.chromosome = "";

        this.facets = new Set();
        this.facetFilters = [];

        PolymerUtils.hide(this._prefix + "Warning");

        this.facetFields = [];
        this.facetRanges = [];
        this.facetFieldsName = [];
        this.facetRangeFields = [];
        this._showInitMessage = true;
        this.requestUpdate();
    }

    facetSearch() {
        //query.study = this.opencgaSession.study.fqn;
        this.dispatchEvent(new CustomEvent("facetSearch", {
            detail: this.query,
            bubbles: true,
            composed: true
        }));
    }

    getDefaultConfig__Variant() {
        return {
            // title: "Aggregation Stats",
            active: false,
            populationFrequencies: true,
            defaultStats: {
                visible: true,
                fields: ["chromosome", "biotypes", "type"]
            },
            fields: {
                terms: [
                    {
                        name: "Chromosome", value: "chromosome"
                    },
                    {
                        name: "Studies", value: "studies"
                    },
                    {
                        name: "Variant Type", value: "type"
                    },
                    {
                        name: "Genes", value: "genes"
                    },
                    {
                        name: "Biotypes", value: "biotypes"
                    },
                    {
                        name: "Consequence Type", value: "soAcc"
                    }
                ],
                ranges: [
                    {
                        name: "PhastCons", value: "phastCons", default: "[0..1]:0.1"
                    },
                    {
                        name: "PhyloP", value: "phylop", default: ""
                    },
                    {
                        name: "Gerp", value: "gerp", default: "[-12.3..6.17]:2"
                    },
                    {
                        name: "CADD Raw", value: "caddRaw"
                    },
                    {
                        name: "CADD Scaled", value: "caddScaled"
                    },
                    {
                        name: "Sift", value: "sift", default: "[0..1]:0.1"
                    },
                    {
                        name: "Polyphen", value: "polyphen", default: "[0..1]:0.1"
                    }
                ]
            }
        };
    }

    render() {
        return html`
        <style include="jso-styles">
            option:disabled {
                font-size: 0.85em;
                font-weight: bold;
            }

            .active-filter-button:hover {
                text-decoration: line-through;
            }
            .deletable:hover {
                text-decoration: line-through;
            }
            #loading {
                text-align: center;
                margin-top: 40px;
            }
        </style>

        <div class="row">
            <!-- RESULTS - Facet Plots -->
            ${this.active ? html` 
            <div class="col-md-12">
                <div>
                    <button type="button" class="btn btn-primary ripple pull-right" @click="${this.facetSearch}">Run Advanced facet query</button>
                </div>
                <div >
                    <h2>Results</h2>
                    <opencb-facet-results .data="${this.facetResults}" .errorState="${this.errorState}" ?loading="${this.loading}"></opencb-facet-results>
                </div>
            </div>` : null}
        </div>
    `;
    }
}

customElements.define("opencb-facet-query", OpencbFacetQuery);
