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

import {LitElement, html} from "/web_modules/lit-element.js";
import {classMap} from "/web_modules/lit-html/directives/class-map.js";
import UtilsNew from "../../../../utilsNew.js";
import AnalysisRegistry from "../analysis-registry.js";
import GridCommons from "../../grid-commons.js";
import knockoutDataGene from "../test/knockout.20201103172343.kFIvpr.gene.js";

export default class KnockoutGeneTable extends LitElement {

    constructor() {
        super();

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
            config: {
                type: Object
            },
            job: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "oga-" + UtilsNew.randomString(6);

        this._config = this.getDefaultConfig();

        this.data = knockoutDataGene;
        this.gridId = this._prefix + "KnockoutGrid";
        this.preprocess();
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.gridCommons = new GridCommons(this.gridId, this, this._config);

    }

    firstUpdated(_changedProperties) {
        this.renderTable();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.job = null;
        }

        /*if (changedProperties.has("job") && this.opencgaSession) {
            this.job = null;
            let query = {study: "demo@family:corpasome", job: "knockout.20201021003108.inXESR"};
            this.opencgaSession.opencgaClient.variants().queryKnockoutIndividual(query).then(restResponse => {
                console.log(restResponse.getResults())
                this.data = restResponse.getResults()

            })
        }*/


        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    preprocess() {

        console.log(knockoutDataGene)

        this.tableData = knockoutDataGene
    }

    renderTable() {
        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            data: this.tableData,
            columns: this._initTableColumns(),
            sidePagination: "local",
            // Set table properties, these are read from config property
            uniqueId: "variantId",
            //pagination: this._config.pagination,
            //pageSize: this._config.pageSize,
            //pageList: this._config.pageList,
            paginationVAlign: "both",
            //formatShowingRows: this.gridCommons.formatShowingRows,
            gridContext: this,
            formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
            onClickRow: (row, selectedElement, field) => this.gridCommons.onClickRow(row.id, row, selectedElement)
        });
    }

    _initTableColumns() {
        return [
            [
                {
                    title: "Gene",
                    field: "name",
                    rowspan: 2,
                    halign: "center",
                    formatter: this.geneIdFormatter
                },
                {
                    title: "Compound Hets",
                    colspan: 4
                },
                {
                    title: "Homs",
                    row: 2
                },
                {
                    title: "All",
                    row: 2
                }
            ],
            [
                {
                    title: "Tot",
                    formatter: this.compTotalFormatter.bind(this)
                },
                {
                    title: "Def."
                },
                {
                    title: "Probable"
                },
                {
                    title: "Possible"
                },
                {
                    title: "Total"
                },
                {
                    title: "Total",
                    formatter: (val, row, index) => this.tableData[index].individuals?.length
                }
            ]
        ];
    }

    compTotalFormatter(val, row, index) {
        const ind = this.tableData[index].individuals
        return "0"
    }

    geneIdFormatter(val, row) {
        return `${row.name} <br> <span class="text-muted">${row.chromosome}:${row.start}-${row.end} (${row.strand})</span>`
    }

    getDefaultConfig() {
        return AnalysisRegistry.get("knockout").config;
    }

    render() {
        return html`
            <div class="row">
                <table id="${this.gridId}"></table>
            </div>
            
        `;
    }

}

customElements.define("knockout-gene-table", KnockoutGeneTable);
