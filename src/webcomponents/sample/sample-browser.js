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

import {LitElement, html} from "lit";
import UtilsNew from "../../core/utilsNew.js";
import "../commons/opencga-browser.js";

export default class SampleBrowser extends LitElement {

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
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this.config = this.getDefaultConfig();
    }

    // NOTE turn updated into update here reduces the number of remote requests from 2 to 1 as in the grid components propertyObserver()
    // is executed twice in case there is external settings
    update(changedProperties) {
        if (changedProperties.has("settings")) {
            this.settingsObserver();
        }
        super.update(changedProperties);
    }

    settingsObserver() {
        this.config = {...this.getDefaultConfig()};
        if (this.settings?.menu) {
            this.config.filter = UtilsNew.mergeFiltersAndDetails(this.config?.filter, this.settings);
        }
        if (this.settings?.table) {
            this.config.filter.result.grid = {...this.config.filter.result.grid, ...this.settings.table};
        }
        if (this.settings?.table?.toolbar) {
            this.config.filter.result.grid.toolbar = {...this.config.filter.result.grid.toolbar, ...this.settings.table.toolbar};
        }
    }

    render() {
        if (!this.opencgaSession) {
            return html`<div>Not valid session</div>`;
        }

        return html`
            <opencga-browser
                resource="SAMPLE"
                .opencgaSession="${this.opencgaSession}"
                .query="${this.query}"
                .config="${this.config}">
            </opencga-browser>
        `;
    }

    getDefaultConfig() {
        return {
            title: "Sample Browser",
            icon: "fab fa-searchengin",
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
                    icon: "fas fa-chart-bar"
                }/*
                {
                    id: "comparator-tab",
                    name: "Comparator"
                }*/
            ],
            filter: {
                searchButton: false,
                sections: [
                    {
                        title: "Section title",
                        collapsed: false,
                        filters: [
                            {
                                id: "id",
                                name: "Sample ID",
                                description: ""
                            },
                            {
                                id: "individualId",
                                name: "Individual ID",
                                placeholder: "LP-1234, LP-4567...",
                                description: ""
                            },
                            {
                                id: "fileIds",
                                name: "File Name",
                                placeholder: "file.vcf, ...",
                                description: ""
                            },
                            {
                                id: "phenotypes",
                                name: "Phenotypes",
                                placeholder: "Full-text search, e.g. melanoma",
                                description: ""
                            },
                            {
                                id: "somatic",
                                name: "Somatic",
                                description: ""
                            },
                            {
                                id: "date",
                                name: "Date",
                                description: ""
                            },
                            {
                                id: "annotations",
                                name: "Sample Annotations",
                                description: ""
                            }
                        ]
                    }
                ],
                examples: [
                    {
                        id: "Full",
                        active: false,
                        query: {
                            id: "HG",
                            individual: "LP",
                            source: "LP",
                            phenotypes: "melanoma",
                            somatic: "True",
                            creationDate: ">=20200216"
                        }
                    }
                ],
                result: {
                    grid: {
                        pageSize: 10,
                        pageList: [10, 25, 50],
                        multiSelection: false,
                        showSelectCheckbox: false
                    }
                },
                detail: {
                    title: "Sample",
                    showTitle: true,
                    items: [
                        {
                            id: "sample-view",
                            name: "Overview",
                            active: true,
                            render: (sample, active, opencgaSession) => {
                                return html`
                                    <sample-view .sample="${sample}" .active="${active}" .opencgaSession="${opencgaSession}"></sample-view>`;
                            }
                        },
                        {
                            id: "sample-variant-stats-view",
                            name: "Variant Stats",
                            render: (sample, active, opencgaSession) => {
                                return html`
                                    <sample-variant-stats-view .sampleId="${sample.id}" .active="${active}" .opencgaSession="${opencgaSession}"></sample-variant-stats-view>`;
                            }
                        },
                        {
                            id: "samtools-flags-stats-view",
                            name: "Samtools Flagstat",
                            render: (sample, active, opencgaSession) => {
                                return html`
                                    <samtools-flagstats-view .sample="${sample}" .opencgaSession="${opencgaSession}"></samtools-flagstats-view>`;
                            }
                        },
                        {
                            id: "individual-view",
                            name: "Individual",
                            render: (sample, active, opencgaSession) => {
                                return html`
                                    <individual-view .individualId="${sample?.individualId}" .opencgaSession="${opencgaSession}"></individual-view>`;
                            }
                        },
                        {
                            id: "file-view",
                            name: "Files",
                            render: (sample, active, opencgaSession) => {
                                return html`
                                    <opencga-file-grid
                                        .query="${{sampleIds: sample.id}}"
                                        .active="${active}"
                                        .config="${{downloadFile: this.config.downloadFile}}"
                                        .opencgaSession="${opencgaSession}">
                                    </opencga-file-grid>`;
                            }
                        },
                        {
                            id: "json-view",
                            name: "JSON Data",
                            mode: "development",
                            render: (sample, active, opencgaSession) => {
                                return html`
                                    <json-viewer .data="${sample}" .active="${active}"></json-viewer>`;
                            }
                        }
                    ]
                }
            },
            aggregation: {
                default: ["creationYear>>creationMonth", "status", "somatic"],
                result: {
                    numColumns: 2
                },
                sections: [
                    {
                        name: "Sample Attributes",
                        // collapsed: false,
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
                                allowedValues: [
                                    "1", "2", "3", "4", "5",
                                    "6", "7", "8", "9", "10",
                                    "11", "12", "13", "14", "15",
                                    "16", "17", "18", "19", "20",
                                    "21", "22", "23", "24", "25",
                                    "26", "27", "28", "29", "30", "31"],
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
                                allowedValues: ["READY", "DELETED"],
                                description: "Status"
                            },
                            {
                                id: "release",
                                name: "Release",
                                type: "string",
                                description: "Release"
                            },
                            {
                                id: "version",
                                name: "Version",
                                type: "string",
                                description: "Version"
                            },
                            {
                                id: "somatic",
                                name: "Somatic",
                                type: "category",
                                allowedValues: ["true", "false"],
                                description: "Somatic"
                            },
                            {
                                id: "product",
                                name: "Product",
                                type: "string",
                                description: "Product"
                            },
                            {
                                id: "preparationMethod",
                                name: "Preparation Method",
                                type: "string",
                                description: "Preparation method"
                            },
                            {
                                id: "extractionMethod",
                                name: "Extraction Method",
                                type: "string",
                                description: "Extraction method"
                            },
                            {
                                id: "labSampleId",
                                name: "Lab Sample Id",
                                type: "string",
                                description: "Lab sample Id"
                            },
                            {
                                id: "tissue",
                                name: "Tissue",
                                type: "string",
                                description: "Tissue"
                            },
                            {
                                id: "organ",
                                name: "Organ",
                                type: "string",
                                description: "Organ"
                            },
                            {
                                id: "method",
                                name: "Method",
                                type: "string",
                                description: "Method"
                            },
                            {
                                id: "phenotypes",
                                name: "Phenotypes",
                                type: "string",
                                description: "Phenotypes"
                            },
                            {
                                id: "annotations",
                                name: "Annotations",
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

}


customElements.define("sample-browser", SampleBrowser);
