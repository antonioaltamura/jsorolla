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
import "../commons/opencga-browser.js";

export default class OpencgaCohortBrowser extends LitElement {

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
            opencgaSession: {
                type: Object
            },
            query: {
                type: Object
            },
            facetQuery: {
                type: Object
            },
            selectedFacet: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "cb" + UtilsNew.randomString(6);

        // These are for making the queries to server
        this.facetFields = [];
        this.facetRanges = [];

        this.facetFieldsName = [];
        this.facetRangeFields = [];
        this.facets = new Set();
        this.facetFilters = [];

        this.facetActive = true;
        this.selectedFacet = {};
        this.selectedFacetFormatted = {};
        this.errorState = false;

        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    getDefaultConfig() {
        return {
            title: "Cohort Browser",
            icon: "fab fa-searchengin",
            searchButtonText: "Search",
            views: [
                {
                    id: "table-tab",
                    name: "Table result",
                    icon: "fa fa-table",
                    active: true
                },
                {
                    id: "facet-tab",
                    name: "Aggregation stats",
                    icon: "fas fa-chart-bar",
                },/*
                {
                    id: "comparator-tab",
                    name: "Comparator",
                    icon: "fas fa-clone",
                    disabled: true
                }*/
            ],
            filter: {
                sections: [
                    {
                        title: "Section title",
                        collapsed: false,
                        fields: [
                            {
                                id: "id",
                                name: "ID",
                                type: "string",
                                placeholder: "LP-1234,LP-2345...",
                                description: ""
                            },
                            {
                                id: "samples",
                                name: "Samples",
                                type: "string",
                                placeholder: "HG01879, HG01880, HG01881...",
                                description: ""
                            },
                            {
                                id: "type",
                                name: "Type",
                                multiple: true,
                                allowedValues: ["All", "CASE_CONTROL", "CASE_SET", "CONTROL_SET", "PAIRED", "PAIRED_TUMOR", "AGGREGATE", "TIME_SERIES", "FAMILY", "TRIO"],
                                description: ""
                            },
                            {
                                id: "date",
                                name: "Date",
                                description: ""
                            },
                            {
                                id: "annotations",
                                name: "Cohort annotations",
                                placeholder: "Full-text search, e.g. *melanoma*",
                                description: ""
                            }
                        ]
                    }
                ],
                examples: [
                    {
                        id: "Full",
                        query: {
                            annotation: "Pedigree:versionControl.GitVersionControl=git",
                            type: "TIME_SERIES,FAMILY",
                            id: "lp",
                            samples: "hg"
                        }
                    }
                ],
                grid: {},
                detail: {
                    title: "Cohort",
                    showTitle: true,
                    items: [
                        {
                            id: "cohort-view",
                            name: "Overview",
                            active: true,
                            render: (cohort, active, opencgaSession) => {
                                return html`<opencga-cohort-view .opencgaSession="${opencgaSession}" .cohort="${cohort}"></opencga-cohort-view>`;
                            }
                        },
                        {
                            id: "sample-view",
                            name: "Samples",
                            render: (cohort, active, opencgaSession) => {
                                return html`
                                    <opencga-sample-grid .opencgaSession="${opencgaSession}"
                                                         .query="${{id: cohort.samples.map(sample => sample.id).join(",")}}"
                                                         .config="${{showSelectCheckbox: false}}"
                                                         .active="${active}">
                                    </opencga-sample-grid>
                                `;
                            }
                        },
                        {
                            id: "json-view",
                            name: "JSON Data",
                            mode: "development",
                            render: (cohort, active, opencgaSession) => {
                                return html`<json-viewer .data="${cohort}"></json-viewer>`;
                            }
                        }
                    ]
                }
            },
            aggregation: {
                default: ["creationYear>>creationMonth", "status", "numSamples[0..10]:1"],
                result: {
                    numColumns: 2
                },
                sections: [
                    {
                        name: "Cohort Attributes",
                        fields: [
                            {
                                id: "studyId",
                                name: "Study id",
                                type: "string",
                                description: "Study [[user@]project:]study where study and project can be either the ID or UUID"
                            },
                            {
                                id: "creationYear",
                                name: "Creation Year",
                                type: "string",
                                description: "Creation year"
                            },
                            {
                                id: "creationMonth",
                                name: "Creation Month",
                                type: "category",
                                allowedValues: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
                                description: "Creation month (JANUARY, FEBRUARY...)"
                            },
                            {
                                id: "creationDay",
                                name: "Creation Day",
                                type: "category",
                                allowedValues: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"],
                                description: "Creation day"
                            },
                            {
                                id: "creationDayOfWeek",
                                name: "Creation Day Of Week",
                                type: "category",
                                allowedValues: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
                                description: "Creation day of week (MONDAY, TUESDAY...)"
                            },
                            {
                                id: "status",
                                name: "Status",
                                type: "category",
                                allowedValues: ["READY", "DELETED", "NONE", "CALCULATING", "INVALID"],
                                description: "Status"
                            },
                            {
                                id: "release",
                                name: "Release",
                                type: "string",
                                description: "Release"
                            },
                            {
                                id: "type",
                                name: "Type",
                                type: "category",
                                allowedValues: ["CASE_CONTROL", "CASE_SET", "CONTROL_SET", "PAIRED", "PAIRED_TUMOR", "AGGREGATE", "TIME_SERIES", "FAMILY", "TRIO", "COLLECTION"],
                                description: "Type"
                            },
                            {
                                id: "numSamples",
                                name: "Number Of Samples",
                                type: "number",
                                description: "Number of samples"
                            },
                            {
                                id: "annotations",
                                name: "Aannotations",
                                type: "string",
                                description: "Annotations, e.g: key1=value(,key2=value)"
                            }
                        ]
                    },
                    {
                        name: "Advanced",
                        fields: [
                            {
                                id: "field",
                                name: "Field",
                                type: "string",
                                description: "List of fields separated by semicolons, e.g.: studies;type. For nested fields use >>, e.g.: studies>>biotype;type;numSamples[0..10]:1"
                            }
                        ]
                    }
                ]
            }
        };
    }

    render() {
        return this._config ? html`
            <opencga-browser  resource="COHORT"
                            .opencgaSession="${this.opencgaSession}"
                            .query="${this.query}"
                            .config="${this._config}">
            </opencga-browser>` : null;
    }

}

customElements.define("opencga-cohort-browser", OpencgaCohortBrowser);
