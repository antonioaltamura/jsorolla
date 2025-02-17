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
import GridCommons from "../commons/grid-commons.js";
import CatalogGridFormatter from "../commons/catalog-grid-formatter.js";
import "../commons/opencb-grid-toolbar.js";
import "../loading-spinner.js";
import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";

export default class JobGrid extends LitElement {

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
            jobs: {
                type: Array
            },
            filters: {
                type: Object,
            },
            query: {
                type: Object
            },
            // TODO check do we really need it..
            eventNotifyName: {
                type: String
            },
            config: {
                type: Object
            },
            active: {
                type: Boolean
            },
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this.autoRefresh = false;
        this.eventNotifyName = "messageevent";
        this.gridId = this._prefix + "JobBrowserGrid";
        this.active = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.gridCommons = new GridCommons(this.gridId, this, this._config);
    }

    updated(changedProperties) {
        if ((changedProperties.has("opencgaSession") ||
                changedProperties.has("query") ||
                changedProperties.has("config") ||
                changedProperties.has("active")) &&
            this.active) {
            this.propertyObserver();
        }
    }

    propertyObserver() {
        // With each property change we must updated config and create the columns again. No extra checks are needed.
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.toolbarConfig = {
            ...this.config.toolbar,
            resource: "JOB",
            columns: this._initTableColumns().filter(col => col.field)
        };
        this.renderTable();
    }

    onColumnChange(e) {
        this.gridCommons.onColumnChange(e);
    }

    renderTable() {
        this.jobs = [];

        if (this.opencgaSession.opencgaClient && this.opencgaSession?.study?.fqn) {
            // Make a copy of the jobs (if they exist), we will use this private copy until it is assigned to this.jobs
            if (UtilsNew.isNotUndefined(this.jobs)) {
                this._jobs = this.jobs;
            } else {
                this._jobs = [];
            }

            this.table = $("#" + this.gridId);
            this.table.bootstrapTable("destroy");

            this.table.bootstrapTable({
                columns: this._initTableColumns(),
                method: "get",
                sidePagination: "server",
                uniqueId: "id",
                iconsPrefix: GridCommons.GRID_ICONS_PREFIX,
                icons: GridCommons.GRID_ICONS,
                // NOTE native Bootstrap table autorefresh doesn't clear interval correctly
                // showRefresh: true,
                // autoRefresh: true,
                // autoRefreshSilent: false,
                // autoRefreshStatus: true,
                // autoRefreshInterval: 5,

                // Table properties
                pagination: this._config.pagination,
                pageSize: this._config.pageSize,
                pageList: this._config.pageList,
                paginationVAlign: "both",
                formatShowingRows: (pageFrom, pageTo, totalRows) => {
                    return this.gridCommons.formatShowingRows(pageFrom, pageTo, totalRows) + this.autoRefreshMsg();
                },
                showExport: this._config.showExport,
                detailView: this._config.detailView,
                detailFormatter: this._config.detailFormatter.bind(this),
                sortName: "Creation",
                sortOrder: "asc",
                formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
                ajax: params => {
                    document.getElementById(this._prefix + "refreshIcon").style.visibility = "visible";
                    const filters = {
                        study: this.opencgaSession.study.fqn,
                        deleted: false,
                        count: !this.table.bootstrapTable("getOptions").pageNumber || this.table.bootstrapTable("getOptions").pageNumber === 1,
                        sort: "creationDate",
                        order: -1,
                        limit: params.data.limit || this.table.bootstrapTable("getOptions").pageSize,
                        skip: params.data.offset || 0,
                        include: "id,userId,tool,priority,tags,creationDate,visited,dependsOn,outDir,internal,execution,params,input,output",
                        ...this.query
                    };
                    this.opencgaSession.opencgaClient.jobs().search(filters)
                        .then(res => params.success(res))
                        .catch(e => {
                            console.error(e);
                            params.error(e);
                        });
                },
                responseHandler: response => {
                    const result = this.gridCommons.responseHandler(response, this.table.bootstrapTable("getOptions"));
                    return result.response;
                },
                onClickRow: (row, selectedElement, field) => this.gridCommons.onClickRow(row.id, row, selectedElement),
                onDblClickRow: (row, element, field) => {
                    // We detail view is active we expand the row automatically.
                    // FIXME: Note that we use a CSS class way of knowing if the row is expand or collapse, this is not ideal but works.
                    if (this._config.detailView) {
                        if (element[0].innerHTML.includes("fa-plus")) {
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
                    this.enableAutoRefresh();
                },
                onLoadError: (e, restResponse) => this.gridCommons.onLoadError(e, restResponse)
            });
        }
    }

    autoRefreshMsg() {
        const id = this._prefix + "refreshIcon";
        const refreshTime = (this._config?.toolbar?.autorefreshTiming ?? this._config.autorefreshTiming) / 1000;

        return `<i id="${id}" class="fas fa-sync-alt anim-rotate" title="Autorefresh every ${refreshTime}s" style="visibility:hidden;margin-left:8px;"></i>`;
    }

    enableAutoRefresh() {
        if (!this.autoRefresh) {
            this.autoRefresh = true;
            this.table.bootstrapTable("refresh", {silent: true});
            clearInterval(this.interval);

            this.interval = setInterval(() => {
                if (!this?.opencgaSession?.token || !$(`#${this.gridId}`).is(":visible")) {
                    this.autoRefresh = false;
                    clearInterval(this.interval);
                } else {
                    this.autoRefresh = true;
                    this.table.bootstrapTable("refresh", {silent: true});
                }
            }, this._config?.toolbar?.autorefreshTiming ?? this._config.autorefreshTiming);
        }
    }

    _initTableColumns() {
        let _columns = [
            {
                id: "id",
                title: "Job ID",
                field: "id"
            },
            {
                id: "toolId",
                title: "Analysis Tool ID",
                field: "tool.id"
            },
            {
                id: "status",
                title: "Status",
                field: "internal.status",
                formatter: status => UtilsNew.jobStatusFormatter(status)
            },
            {
                id: "priority",
                title: "Priority",
                field: "priority"
            },
            {
                id: "dependsOn",
                title: "Depends On",
                field: "dependsOn",
                formatter: dependsOn => dependsOn.length > 0 ? `
                    <div class="tooltip-div">
                        <a tooltip-title="Dependencies" tooltip-text="${dependsOn.map(job => `<p>${job.id}</p>`).join("<br>")}">
                            ${dependsOn.length} job${dependsOn.length > 1 ? "s" : ""}
                        </a>
                    </div>` : "-"
            },
            {
                id: "output",
                title: "Output Files",
                field: "output",
                formatter: outputFiles => {
                    if (outputFiles?.length > 0) {
                        const fileIds = outputFiles?.map(file => file);
                        return CatalogGridFormatter.fileFormatter(fileIds, null, "name");
                    } else {
                        return "-";
                    }
                }
            },
            {
                id: "execution",
                title: "Runtime",
                field: "execution",
                formatter: execution => {
                    if (execution?.start) {
                        const duration = moment.duration((execution.end ? execution.end : moment().valueOf()) - execution.start);
                        const f = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
                        return `<a tooltip-title="Runtime"  tooltip-text="${f}"> ${duration.humanize()} </a>`;
                    }
                }

            },
            {
                id: "execution",
                title: "Start/End Date",
                field: "execution",
                formatter: execution => execution?.start ?
                    moment(execution.start).format("D MMM YYYY, h:mm:ss a") + " / " + (execution?.end ? moment(execution.end).format("D MMM YYYY, h:mm:ss a") : "-") :
                    "-"
            },
            {
                id: "creationDate",
                title: "Creation Date",
                field: "creationDate",
                formatter: CatalogGridFormatter.dateFormatter,
            }
        ];

        _columns = UtilsNew.mergeTable(_columns, this._config.columns || this._config.hiddenColumns, !!this._config.hiddenColumns);
        return _columns;
    }

    detailFormatter(value, row) {
        let result = "<div class='row' style='padding-bottom: 20px'>";
        let detailHtml = "";

        if (row) {
            // Job Dependencies section
            detailHtml = "<div style='padding: 10px 0px 10px 25px'><h4>Job Dependencies</h4></div>";
            detailHtml += "<div style='padding: 5px 40px'>";
            if (row.dependsOn && row.dependsOn.length > 0) {
                detailHtml += ` <div class='row' style="padding: 5px 10px 20px 10px">
                                    <div class='col-md-12'>
                                        <div>
                                            <table class="table table-hover table-no-bordered">
                                                <thead>
                                                    <tr class="table-header">
                                                        <th>ID</th>
                                                        <th>Tool</th>
                                                        <th>Status</th>
                                                        <th>Priority</th>
                                                        <th>Creation Date</th>
                                                        <th>Visited</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${row.dependsOn.map(job => `
                                                        <tr class="detail-view-row">
                                                            <td>${job.id}</td>
                                                            <td>${job.tool.id}</td>
                                                            <td>${UtilsNew.jobStatusFormatter(job.internal.status)}</td>
                                                            <td>${job.priority}</td>
                                                            <td>${moment(job.creationDate, "YYYYMMDDHHmmss").format("D MMM YYYY, h:mm:ss a")}</td>
                                                            <td>${job.visited}</td>
                                                       </tr>
                                                    `).join("")}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>`;
            } else {
                detailHtml += "No dependencies";
            }
            detailHtml += "</div>";

            // Input Files section
            detailHtml += "<div style='padding: 10px 0px 10px 25px'><h4>Input Files</h4></div>";
            detailHtml += "<div style='padding: 5px 50px'>";
            detailHtml += "To be implemented";
            detailHtml += "</div>";
        }

        result += detailHtml + "</div>";
        return result;
    }

    async onDownload(e) {
        this.toolbarConfig = {...this.toolbarConfig, downloading: true};
        this.requestUpdate();
        await this.updateComplete;
        const filters = {
            limit: 1000,
            skip: 0,
            count: false,
            study: this.opencgaSession.study.fqn,
            ...this.query
        };
        this.opencgaSession.opencgaClient.jobs().search(filters)
            .then(response => {
                const results = response.getResults();
                if (results) {
                    // Check if user clicked in Tab or JSON format
                    if (e.detail.option.toLowerCase() === "tab") {
                        const fields = ["id", "tool.id", "priority", "tags", "creationDate", "internal.status.name", "visited"];
                        const data = UtilsNew.toTableString(results, fields);
                        UtilsNew.downloadData(data, "job_" + this.opencgaSession.study.id + ".tsv", "text/plain");
                    } else {
                        UtilsNew.downloadData(JSON.stringify(results, null, "\t"), "job_" + this.opencgaSession.study.id + ".json", "application/json");
                    }
                } else {
                    console.error("Error in result format");
                }
            })
            .catch(response => {
                // console.log(response);
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
            })
            .finally(() => {
                this.toolbarConfig = {...this.toolbarConfig, downloading: false};
                this.requestUpdate();
            });
    }

    getRightToolbar() {
        return [
            {
                render: () => html`
                    <button type="button" class="btn btn-default btn-sm" @click="${() => this.table.bootstrapTable("refresh")}">
                        <i class="fas fa-sync-alt icon-padding"></i> Refresh
                    </button>
                `,
            }
        ];
    }

    render() {
        return html`
            ${this._config.showToolbar ? html`
                <opencb-grid-toolbar
                    .config="${this.toolbarConfig}"
                    .query="${this.query}"
                    .opencgaSession="${this.opencgaSession}"
                    .rightToolbar="${this.getRightToolbar()}"
                    @columnChange="${this.onColumnChange}"
                    @download="${this.onDownload}"
                    @export="${this.onDownload}">
                </opencb-grid-toolbar>
            ` : null}
            <div>
                <table id="${this.gridId}"></table>
            </div>
        `;
    }

    getDefaultConfig() {
        return {
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50],
            showExport: false,
            detailView: true,
            detailFormatter: this.detailFormatter,
            showSelectCheckbox: false,
            multiSelection: false,
            nucleotideGenotype: true,
            alleleStringLengthMax: 15,
            showToolbar: true,
            header: {
                horizontalAlign: "center",
                verticalAlign: "bottom"
            },
            autorefreshTiming: 60000,
        };
    }

}

customElements.define("job-grid", JobGrid);
