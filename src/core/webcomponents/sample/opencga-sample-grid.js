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
import GridCommons from "../variant/grid-commons.js";
import CatalogGridFormatter from "../commons/catalog-grid-formatter.js";
import CatalogUtils from "../commons/catalog-utils.js";
import "../commons/opencb-grid-toolbar.js";


export default class OpencgaSampleGrid extends LitElement {

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
            query: {
                type: Object
            },
            samples: {
                type: Array
            },
            active: {
                type: Boolean
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this.catalogUiUtils = new CatalogUtils();
        this.gridId = this._prefix + "SampleBrowserGrid";
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
        this.gridCommons = new GridCommons(this.gridId, this, this._config);
    }

    firstUpdated() {
        this.table = $("#" + this.gridId);
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") ||
            changedProperties.has("query") ||
            changedProperties.has("active")) {
            this.propertyObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    propertyObserver() {
        // With each property change we must updated config and create the columns again. No extra checks are needed.
        //this._config = Object.assign(this.getDefaultConfig(), this.config);
        //this._columns = this._initTableColumns();

        this.catalogGridFormatter = new CatalogGridFormatter(this.opencgaSession);

        // Config for the grid toolbar
        this.toolbarConfig = {
            columns: this._getDefaultColumns()
        };

        this.renderTable();
    }

    renderTable() {
        // If this.samples is provided as property we render the array directly
        if (this.samples && this.samples.length > 0) {
            this.renderLocalTable();
        } else {
            this.renderRemoteTable();
        }
        this.requestUpdate();
    }

    renderRemoteTable() {
        if (this.opencgaSession.opencgaClient && this.opencgaSession.study) {
            const filters = {...this.query};
            //TODO fix and replicate this in all browsers (the current filter is not "filters", it is actually built in the ajax() function in bootstrapTable)
            if (UtilsNew.isNotUndefinedOrNull(this.lastFilters) &&
                JSON.stringify(this.lastFilters) === JSON.stringify(filters)) {
                // Abort destroying and creating again the grid. The filters have not changed
                return;
            }

            this.table = $("#" + this.gridId);
            this.table.bootstrapTable("destroy");
            this.table.bootstrapTable({
                columns: this._getDefaultColumns(),
                method: "get",
                sidePagination: "server",
                uniqueId: "id",
                // Table properties
                pagination: this._config.pagination,
                pageSize: this._config.pageSize,
                pageList: this._config.pageList,
                paginationVAlign: "both",
                formatShowingRows: this.gridCommons.formatShowingRows,
                showExport: this._config.showExport,
                detailView: this._config.detailView,
                detailFormatter: this._config.detailFormatter,
                gridContext: this,
                formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
                ajax: params => {
                    const _filters = {
                        study: this.opencgaSession.study.fqn,
                        limit: params.data.limit,
                        skip: params.data.offset || 0,
                        count: !this.table.bootstrapTable("getOptions").pageNumber || this.table.bootstrapTable("getOptions").pageNumber === 1,
                        exclude: "qualityControl,annotationSets",
                        ...filters
                    };
                    // Store the current filters
                    this.lastFilters = {..._filters};
                    this.opencgaSession.opencgaClient.samples().search(_filters)
                        .then(sampleResponse => {
                            // Fetch clinical analysis to display the Case ID
                            let individualIds = sampleResponse.responses[0].results.map(sample => sample.individualId).join(",");
                            if (individualIds) {
                                this.opencgaSession.opencgaClient.clinical().search(
                                    {
                                        member: individualIds,
                                        study: this.opencgaSession.study.fqn,
                                        exclude: "proband.samples,family,interpretation,files"
                                    })
                                    .then(caseResponse => {
                                        // We store the Case ID in the individual attribute
                                        // Note clinical search results are not sorted
                                        // FIXME at the moment we only search by proband
                                        let map = {};
                                        for (let clinicalAnalysis of caseResponse.responses[0].results) {
                                            if (!map[clinicalAnalysis.proband.id]) {
                                                map[clinicalAnalysis.proband.id] = [];
                                            }
                                            map[clinicalAnalysis.proband.id].push(clinicalAnalysis);
                                        }
                                        for (let sample of sampleResponse.responses[0].results) {
                                            sample.attributes.OPENCGA_CLINICAL_ANALYSIS = map[sample.individualId];
                                        }
                                        params.success(sampleResponse);
                                    })
                                    .catch(e => {
                                        console.error(e);
                                        params.error(e);
                                    });
                            }
                        })
                        .catch(e => {
                            console.error(e);
                            params.error(e);
                        });
                },
                responseHandler: response => {
                    const result = this.gridCommons.responseHandler(response, $(this.table).bootstrapTable("getOptions"));
                    return result.response;
                },
                onClickRow: (row, selectedElement, field) => this.gridCommons.onClickRow(row.id, row, selectedElement),
                onDblClickRow: (row, element, field) => {
                    // We detail view is active we expand the row automatically.
                    // FIXME: Note that we use a CSS class way of knowing if the row is expand or collapse, this is not ideal but works.
                    if (this._config.detailView) {
                        if (element[0].innerHTML.includes("icon-plus")) {
                            this.table.bootstrapTable("expandRow", element[0].dataset.index);
                        } else {
                            this.table.bootstrapTable("collapseRow", element[0].dataset.index);
                        }
                    }
                },
                onCheck: (row, $element) => {
                    this.gridCommons.onCheck(row.id, row);
                },
                onCheckAll: rows => {
                    this.gridCommons.onCheckAll(rows);
                },
                onUncheck: (row, $element) => {
                    this.gridCommons.onUncheck(row.id, row);
                },
                onUncheckAll: rows => {
                    this.gridCommons.onUncheckAll(rows);
                },
                onLoadSuccess: data => {
                    this.gridCommons.onLoadSuccess(data, 1);
                },
                onLoadError: (e, restResponse) => this.gridCommons.onLoadError(e, restResponse),
                onPostBody: (data) => {
                    // Add tooltips?
                }
            });
        }
    }

    renderLocalTable() {
        // this.from = 1;
        // this.to = Math.min(this.samples.length, this._config.pageSize);
        // this.numTotalResultsText = this.samples.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            columns: this._getDefaultColumns(),
            data: this.samples,
            sidePagination: "local",

            // Set table properties, these are read from config property
            uniqueId: "id",
            pagination: this._config.pagination,
            pageSize: this._config.pageSize,
            pageList: this._config.pageList,
            showExport: this._config.showExport,
            detailView: this._config.detailView,
            detailFormatter: this.detailFormatter,
            formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",

            onClickRow: (row, selectedElement, field) => this.gridCommons.onClickRow(row.id, row, selectedElement),
            // onPageChange: (page, size) => {
            //     const result = this.gridCommons.onPageChange(page, size);
            //     this.from = result.from || this.from;
            //     this.to = result.to || this.to;
            // },
            onPostBody: (data) => {
                // We call onLoadSuccess to select first row
                this.gridCommons.onLoadSuccess({rows: data, total: data.length}, 1);
            }
        });
    }

    onColumnChange(e) {
        this.gridCommons.onColumnChange(e);
    }

    onActionClick(e, _, row) {
        const {action} = e.target.dataset;

        if (action === "download") {
            UtilsNew.downloadData([JSON.stringify(row, null, "\t")], row.id + ".json");
        }

        if (action === "qualityControl") {
            alert("Not implemented yet");
            // UtilsNew.downloadData([JSON.stringify(row, null, "\t")], row.id + ".json");
        }
    }

    _getDefaultColumns() {
        let _columns = [
            {
                title: "Sample ID",
                field: "id"
            },
            {
                title: "Individual ID",
                formatter: (value, row) => row?.individualId ?? "-"
            },
            {
                title: "Files (VCF, BAM)",
                field: "fileIds",
                formatter: fileIds => this.catalogGridFormatter.fileFormatter(fileIds, ["vcf", "vcf.gz", "bam"])
            },
            {
                title: "Case ID",
                field: "attributes.OPENCGA_CLINICAL_ANALYSIS",
                formatter: (value, row) => this.catalogGridFormatter.caseFormatter(value, row, row.individualId, this.opencgaSession),
            },
            {
                title: "Collection Method",
                field: "collection.method"
            },
            {
                title: "Preparation Method",
                field: "processing.preparationMethod"
            },
            {
                title: "Cell Line",
                formatter: (value, row) => row.somatic ? "Somatic" : "Germline"
            },
            {
                title: "Creation Date",
                field: "creationDate",
                formatter: this.catalogGridFormatter.dateFormatter
            },
        ];

        if (this._config.showSelectCheckbox) {
            _columns.push({
                field: "state",
                checkbox: true,
                // formatter: this.stateFormatter,
                class: "cursor-pointer",
                eligible: false
            });
        }

        if (this.opencgaSession && this._config.showActions) {
            _columns.push({
                title: "Actions",
                formatter: (value, row) => `
                    <div class="dropdown">
                        <button class="btn btn-default btn-small ripple dropdown-toggle one-line" type="button" data-toggle="dropdown">Select action
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-right">
                            <li>
                                <a data-action="download" href="javascript: void 0" class="btn force-text-left">
                                    <i class="fas fa-download icon-padding" aria-hidden="true"></i> Download
                                </a>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a data-action="variantStats" class="btn force-text-left" 
                                        href="#sampleVariantStatsBrowser/${this.opencgaSession.project.id}/${this.opencgaSession.study.id}/${row.id}">
                                    <i class="fas fa-user icon-padding" aria-hidden="true"></i> Variant Stats Browser 
                                </a>
                            </li>
                            <li>
                                <a data-action="cancerVariantStats" class="btn force-text-left ${row.somatic ? "" : "disabled"}" 
                                        href="#sampleCancerVariantStatsBrowser/${this.opencgaSession.project.id}/${this.opencgaSession.study.id}/${row.id}">
                                    <i class="fas fa-user icon-padding" aria-hidden="true"></i> Cancer Variant Plots 
                                </a>
                            </li>
                            <li>
                                <a data-action="qualityControl" class="btn force-text-left ${row.qualityControl?.metrics && row.qualityControl.metrics.length === 0 ? "" : "disabled"}" 
                                        title="${row.qualityControl?.metrics && row.qualityControl.metrics.length === 0 ? "Launch a job to calculate Quality Control stats" : "Quality Control stats already calculated"}">
                                    <i class="fas fa-rocket icon-padding" aria-hidden="true"></i> Calculate Quality Control 
                                </a>
                            </li>
                            <li>
                                <a data-action="interpreter" class="btn force-text-left ${row.attributes.OPENCGA_CLINICAL_ANALYSIS ? "" : "disabled"}" 
                                        href="#interpreter/${this.opencgaSession.project.id}/${this.opencgaSession.study.id}/${row.attributes.OPENCGA_CLINICAL_ANALYSIS?.id}">
                                    <i class="fas fa-user-md icon-padding" aria-hidden="true"></i> Case Interpreter 
                                </a>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a data-action="edit" href="javascript: void 0" class="btn force-text-left disabled">
                                    <i class="fas fa-edit icon-padding" aria-hidden="true"></i> Edit
                                </a>
                            </li>
                            <li>
                                <a data-action="delete" href="javascript: void 0" class="btn force-text-left disabled">
                                    <i class="fas fa-trash icon-padding" aria-hidden="true"></i> Delete
                                </a>
                            </li>
                        </ul>
                    </div>`,
                // valign: "middle",
                events: {
                    "click a": this.onActionClick.bind(this)
                },
                visible: !this._config.columns?.hidden?.includes("actions")
            });
        }

        return _columns;
    }

    onDownload(e) {
        const params = {
            ...this.query,
            limit: 1000,
            skip: 0,
            count: false,
            exclude: "qualityControl,annotationSets",
        };

        this.opencgaSession.opencgaClient.samples().search(params)
            .then(response => {
                const results = response.responses[0].results;
                if (results) {
                    // Check if user clicked in Tab or JSON format
                    if (e.detail.option.toUpperCase() === "TAB") {
                        let fields = ["id", "individualId", "fileIds", "collection.method", "processing.preparationMethod", "somatic", "creationDate"];
                        let data = UtilsNew.toTableString(results, fields);
                        UtilsNew.downloadData(data, "samples_" + this.opencgaSession.study.id + ".txt", "text/plain");
                    } else {
                        let json = results.map(res => JSON.stringify(res, null, "\t"));
                        UtilsNew.downloadData(json, this.opencgaSession.study.id + ".json", "application/json");
                    }
                } else {
                    console.error("Error in result format");
                }
            })
            .catch(e => {
                console.error(e);
            });
    }

    getDefaultConfig() {
        return {
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50],
            showExport: false,
            detailView: false,
            detailFormatter: null, // function with the detail formatter
            multiSelection: false,
            showSelectCheckbox: true,
            showToolbar: true,
            showActions: true,
        };
    }

    render() {
        return html`
            ${this._config.showToolbar
                ? html`
                    <opencb-grid-toolbar    .config="${this.toolbarConfig}"
                                            @columnChange="${this.onColumnChange}"
                                            @download="${this.onDownload}">
                    </opencb-grid-toolbar>`
                : null
            }
    
            <div id="${this._prefix}GridTableDiv">
                <table id="${this._prefix}SampleBrowserGrid"></table>
            </div>
        `;
    }

}

customElements.define("opencga-sample-grid", OpencgaSampleGrid);
