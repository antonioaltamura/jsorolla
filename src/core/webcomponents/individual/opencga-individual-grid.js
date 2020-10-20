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

import {html, LitElement} from "/web_modules/lit-element.js";
import UtilsNew from "../../utilsNew.js";
import {NotificationQueue} from "../Notification.js";
import GridCommons from "../variant/grid-commons.js";
import CatalogGridFormatter from "../commons/catalog-grid-formatter.js";
import CatalogUtils from "../commons/catalog-utils.js";
import "../commons/opencb-grid-toolbar.js";


export default class OpencgaIndividualGrid extends LitElement {

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
            individuals: {
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
        this._prefix = "VarIndividualGrid" + UtilsNew.randomString(6);

        this.catalogUiUtils = new CatalogUtils();
        this.gridId = this._prefix + "IndividualBrowserGrid";
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
        this.gridCommons = new GridCommons(this.gridId, this, this._config);
    }

    firstUpdated(_changedProperties) {
        this.table = $("#" + this.gridId);
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") ||
            changedProperties.has("query") ||
            changedProperties.has("config") ||
            changedProperties.has("active")) {
            this.propertyObserver();
            //this.renderTable();
        }
    }

    propertyObserver() {
        // With each property change we must updated config and create the columns again. No extra checks are needed.
        this._config = {...this.getDefaultConfig(), ...this.config};

        this.catalogGridFormatter = new CatalogGridFormatter(this.opencgaSession);

        // Config for the grid toolbar
        this.toolbarConfig = {
            columns: this._getDefaultColumns()
        };

        this.renderTable();
    }

    renderTable() {
        // If this.individuals is provided as property we render the array directly
        if (this.individuals && this.individuals.length > 0) {
            this.renderLocalTable();
        } else {
            this.renderRemoteTable();
        }
        this.requestUpdate();
    }

    renderRemoteTable() {
        if (this.opencgaSession.opencgaClient && this.opencgaSession.study && this.opencgaSession.study.fqn) {
            const filters = {...this.query};
            if (UtilsNew.isNotUndefinedOrNull(this.lastFilters) &&
                JSON.stringify(this.lastFilters) === JSON.stringify(filters)) {
                // Abort destroying and creating again the grid. The filters have not changed
                return;
            }
            // Store the current filters
            this.lastFilters = {...filters};

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
                        ...filters
                    };
                    // Store the current filters
                    this.lastFilters = {..._filters};
                    this.opencgaSession.opencgaClient.individuals().search(_filters)
                        .then(individualResponse => {
                            // Fetch Clinical Analysis ID per individual in 1 single query
                            let individualIds = individualResponse.responses[0].results.map(individual => individual.id).join(",");
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
                                    for (let individual of individualResponse.responses[0].results) {
                                        individual.attributes.OPENCGA_CLINICAL_ANALYSIS = map[individual.id];
                                    }
                                    params.success(individualResponse);
                                })
                                .catch(e => {
                                    console.error(e);
                                    params.error(e);
                                });
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
                    // Add tooltips
                }
            });
        }
    }

    renderLocalTable() {
        // this.from = 1;
        // this.to = Math.min(this.individuals.length, this._config.pageSize);
        // this.numTotalResultsText = this.individuals.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            columns: this._getDefaultColumns(),
            data: this.individuals,
            sidePagination: "local",

            // Set table properties, these are read from config property
            uniqueId: "id",
            pagination: this._config.pagination,
            pageSize: this._config.pageSize,
            pageList: this._config.pageList,
            showExport: this._config.showExport,
            detailView: this._config.detailView,
            detailFormatter: this.detailFormatter,

            gridContext: this,
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

    //TODO lit-html refactor
    detailFormatter(value, row) {
        let result = `<div class='row' style="padding: 5px 10px 20px 10px">
                                <div class='col-md-12'>
                                    <h5 style="font-weight: bold">Samples</h5>
                `;

        if (UtilsNew.isNotEmptyArray(row.samples)) {
            let tableCheckboxHeader = "";

            if (this.gridContext._config && this.gridContext._config.multiSelection) {
                tableCheckboxHeader = "<th>Select</th>";
            }

            result += `<div style="width: 90%;padding-left: 20px">
                                <table class="table table-hover table-no-bordered">
                                    <thead>
                                        <tr class="table-header">
                                            ${tableCheckboxHeader}
                                            <th>Sample ID</th>
                                            <th>Source</th>
                                            <th>Collection Method</th>
                                            <th>Preparation Method</th>
                                            <th>Somatic</th>
                                            <th>Creation Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

            for (const sample of row.samples) {
                let tableCheckboxRow = "";
                // If parent row is checked and there is only one samlpe then it must be selected
                if (this.gridContext._config.multiSelection) {
                    let checkedStr = "";
                    for (const individual of this.gridContext.individuals) {
                        if (individual.id === row.id && row.samples.length === 1) {
                            // TODO check sampkle has been checked before, we need to store them
                            checkedStr = "checked";
                            break;
                        }
                    }

                    tableCheckboxRow = `<td><input id='${this.gridContext.prefix}${sample.id}Checkbox' type='checkbox' ${checkedStr}></td>`;
                }

                const source = (UtilsNew.isNotEmpty(sample.source)) ? sample.source : "-";
                const collectionMethod = (sample.collection !== undefined) ? sample.collection.method : "-";
                const preparationMethod = (sample.processing !== undefined) ? sample.processing.preparationMethod : "-";
                const cellLine = (sample.somatic) ? "Somatic" : "Germline";
                const creationDate = moment(sample.creationDate, "YYYYMMDDHHmmss").format("D MMM YYYY");

                result += `<tr class="detail-view-row">
                                        ${tableCheckboxRow}
                                        <td>${sample.id}</td>
                                        <td>${source}</td>
                                        <td>${collectionMethod}</td>
                                        <td>${preparationMethod}</td>
                                        <td>${cellLine}</td>
                                        <td>${creationDate}</td>
                                        <td>${sample.status ? sample.status.name : ""}</td>
                                   </tr>`;
            }
            result += "</tbody></table></diV>";
        } else {
            result += "No samples found";
        }

        result += "</div></div>";
        return result;
    }

    sexFormatter(value, row) {
        let sexHtml = `<span>${row.sex}</span>`;
        if (UtilsNew.isNotEmpty(row.karyotypicSex)) {
            sexHtml += ` (${row.karyotypicSex})`;
        }
        return sexHtml;
    }

    fatherFormatter(value, row) {
        if (row.father && row.father.id) {
            return row.father.id;
        } else {
            return "-";
        }
    }

    motherFormatter(value, row) {
        if (row.mother && row.mother.id) {
            return row.mother.id;
        } else {
            return "-";
        }
    }

    samplesFormatter(value, row) {
        if (UtilsNew.isNotEmptyArray(row.samples)) {
            let samples = "<div>";
            for (const sample of row.samples) {
                samples += `<div>${sample.id}</div>`;
            }
            samples += "</div>";
            return samples;
        } else {
            return "-";
        }
    }

    customAnnotationFormatter(value, row) {
        // debugger
    }

    _getDefaultColumns() {
        // Check column visibility
        // const customAnnotationVisible = (UtilsNew.isNotUndefinedOrNull(this._config.customAnnotations) &&
        //     UtilsNew.isNotEmptyArray(this._config.customAnnotations.fields));

        let _columns = [
            {
                title: "Individual",
                field: "id",
                sortable: true,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Samples",
                field: "samples",
                formatter: this.samplesFormatter,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Father",
                field: "father.id",
                formatter: this.fatherFormatter,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Mother",
                field: "mother.id",
                formatter: this.motherFormatter,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Disorders",
                field: "disorders",
                formatter: disorders => {
                    let result = disorders?.map(disorder => this.catalogGridFormatter.disorderFormatter(disorder)).join("<br>");
                    return result ? result : "-";
                },
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Phenotypes",
                field: "phenotypes",
                formatter: this.catalogGridFormatter.phenotypesFormatter,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Case ID",
                field: "attributes.OPENCGA_CLINICAL_ANALYSIS",
                formatter: (value, row) => this.catalogGridFormatter.caseFormatter(value, row, row.id, this.opencgaSession),
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Sex",
                field: "sex",
                formatter: this.sexFormatter,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Life Status",
                field: "lifeStatus",
                halign: this._config.header.horizontalAlign
            },
            // {
            //     title: "Custom Annotations",
            //     field: "customAnnotation",
            //     formatter: this.customAnnotationFormatter,
            //     visible: customAnnotationVisible,
            //     halign: this._config.header.horizontalAlign
            // },
            {
                title: "Date of Birth",
                field: "dateOfBirth",
                sortable: true,
                formatter: this.catalogGridFormatter.dateFormatter,
                halign: this._config.header.horizontalAlign
            },
            {
                title: "Creation Date",
                field: "creationDate",
                sortable: true,
                formatter: this.catalogGridFormatter.dateFormatter,
                halign: this._config.header.horizontalAlign
            }
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

        return _columns;
    }

    async onDownload(e) {
        this.toolbarConfig = {...this.toolbarConfig, downloading: true};
        await this.requestUpdate();

        const query = {
            ...this.query,
            study: this.opencgaSession.study.fqn,
            limit: 1000,
            skip: 0,
            count: false
        };

        this.opencgaSession.opencgaClient.individuals().search(query)
            .then(response => {
                const results = response.responses[0].results;
                if (results) {
                    // Check if user clicked in Tab or JSON format
                    if (e.detail.option.toUpperCase() === "TAB") {
                        let fields = ["id", "samples.id", "father.id", "mother.id", "disorders.id", "phenotypes.id", "sex", "lifeStatus", "dateOfBirth", "creationDate"];
                        let data = UtilsNew.toTableString(results, fields);
                        UtilsNew.downloadData(data, "individuals_" + this.opencgaSession.study.id + ".txt", "text/plain");
                    } else {
                        let json = JSON.stringify(results, null, "\t");
                        UtilsNew.downloadData(json, this.opencgaSession.study.id + ".json", "application/json");
                    }
                } else {
                    console.error("Error in result format");
                }
            })
            .catch(e => {
                console.log(e);
                // in case it is a restResponse
                if (e?.getEvents?.("ERROR")?.length) {
                    const errors = e.getEvents("ERROR");
                    errors.forEach(error => {
                        new NotificationQueue().push(error.name, error.message, "ERROR");
                        console.log(error);
                    });
                } else if (e instanceof Error) {
                    new NotificationQueue().push(e.name, e.message, "ERROR");
                } else {
                    new NotificationQueue().push("Generic Error", JSON.stringify(e), "ERROR");
                }
            })
            .finally(() => {
                this.toolbarConfig = {...this.toolbarConfig, downloading: false};
                this.requestUpdate();
            });
    }

    getDefaultConfig() {
        return {
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50],
            showExport: false,
            detailView: true,
            detailFormatter: this.detailFormatter, // function with the detail formatter
            multiSelection: false,
            showSelectCheckbox: true,
            showToolbar: true,
            header: {
                horizontalAlign: "center",
                verticalAlign: "bottom"
            },
            disorderSources: ["ICD", "ICD10", "GelDisorder"],
            customAnnotations: {
                title: "Custom Annotation",
                fields: []
            }
        };
    }

    render() {
        return html`
            ${this._config.showToolbar
                ? html`
                    <opencb-grid-toolbar    .config="${this.toolbarConfig}"
                                            @download="${this.onDownload}"
                                            @columnChange="${this.onColumnChange}">
                    </opencb-grid-toolbar>`
                : null
            }
    
            <div id="${this._prefix}GridTableDiv">
                <table id="${this._prefix}IndividualBrowserGrid"></table>
            </div>
        `;
    }

}

customElements.define("opencga-individual-grid", OpencgaIndividualGrid);
