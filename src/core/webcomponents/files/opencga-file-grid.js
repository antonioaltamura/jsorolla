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
import GridCommons from "../variant/grid-commons.js";
import UtilsNew from "../../utilsNew.js";
import PolymerUtils from "../PolymerUtils.js";
import "../commons/opencb-grid-toolbar.js";
import "../loading-spinner.js";


export default class OpencgaFileGrid extends LitElement {

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
            files: {
                type: Array
            },
            filters: {
                type: Object
            },
            // TODO replace with query
            search: {
                type: Object
            },
            eventNotifyName: {
                type: String
            },
            config: {
                type: Object
            },
            query: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "VarFileGrid" + UtilsNew.randomString(6) + "_";
        this._config = this.getDefaultConfig();
        this.eventNotifyName = "messageevent";
        this.gridId = this._prefix + "FileBrowserGrid";
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.gridCommons = new GridCommons(this.gridId, this, this._config);
    }

    firstUpdated(_changedProperties) {
        this._initTableColumns();
        this.dispatchEvent(new CustomEvent("clear", {detail: {}, bubbles: true, composed: true}));
        this.table = this.querySelector("#" + this.gridId);
        this.query = {};
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("query")) {
            this.renderTable();
        }
        if (changedProperties.has("filters")) {
            this.onFilterUpdate();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }

        if (changedProperties.has("filteredVariables")) {
            this.calculateFilters();
        }
    }

    configObserver() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);
    }

    renderTable() {
        this.files = [];

        this.from = 1;
        this.to = 10;

        if (UtilsNew.isNotUndefined(this.opencgaSession.opencgaClient) &&
            UtilsNew.isNotUndefined(this.opencgaSession.study) &&
            UtilsNew.isNotUndefined(this.opencgaSession.study.fqn)) {
            // Make a copy of the files (if they exist), we will use this private copy until it is assigned to this.files
            if (UtilsNew.isNotUndefined(this.files)) {
                this._files = this.files;
            } else {
                this._files = [];
            }

            const _table = $(this.table);

            const _this = this;
            $(this.table).bootstrapTable("destroy");
            $(this.table).bootstrapTable({
                // url: opencgaHostUrl,
                columns: _this._columns,
                method: "get",
                sidePagination: "server",
                uniqueId: "id",
                // Table properties
                pagination: _this._config.pagination,
                pageSize: _this._config.pageSize,
                pageList: _this._config.pageList,
                showExport: _this._config.showExport,
                detailView: _this._config.detailView,
                detailFormatter: _this._config.detailFormatter,
                formatLoadingMessage: () =>"<div><loading-spinner></loading-spinner></div>",
                ajax: params => {
                    const filters = {
                        study: this.opencgaSession.study.fqn,
                        type: "FILE",
                        order: params.data.order,
                        limit: params.data.limit,
                        skip: params.data.offset || 0,
                        count: !$(this.table).bootstrapTable("getOptions").pageNumber || $(this.table).bootstrapTable("getOptions").pageNumber === 1,
                        include: "name,path,uuid,samples,status,format,bioformat,size,creationDate,modificationDate,internal",
                        ...this.query
                    };
                    this.opencgaSession.opencgaClient.files().search(filters).then( res => params.success(res));
                },
                responseHandler: response => {
                    const result = this.gridCommons.responseHandler(response, $(this.table).bootstrapTable("getOptions"));
                    this.from = result.from || this.from;
                    this.to = result.to || this.to;
                    this.numTotalResultsText = result.numTotalResultsText || this.numTotalResultsText;
                    this.approximateCountResult = result.approximateCountResult;
                    this.requestUpdate();
                    return result.response;
                },
                onClickRow: (row, selectedElement, field) => this.gridCommons.onClickRow(row.id, row, selectedElement),
                /*
                                onClickRow: function(row, element, field) {
                                    if (_this._config.multiSelection) {
                                        $(element).toggleClass("success");
                                        const index = element[0].getAttribute("data-index");
                                        // Check and uncheck actions trigger events that are captured below
                                        if ("selected" === element[0].className) {
                                            $(PolymerUtils.getElementById(_this._prefix + "FileBrowserGrid")).bootstrapTable("uncheck", index);
                                        } else {
                                            $(PolymerUtils.getElementById(_this._prefix + "FileBrowserGrid")).bootstrapTable("check", index);
                                        }
                                    } else {
                                        $(".success").removeClass("success");
                                        $(element).addClass("success");
                                    }

                                    _this._onSelectFile(row);
                                },*/
                onCheck: function(row, elem) {
                    // check file is not already selected
                    for (const i in _this._files) {
                        if (_this._files[i].id === row.id) {
                            return;
                        }
                    }

                    // we add files to selected files
                    // _this.push("_files", row);
                    // _this.set("files", _this._files.slice());
                    _this._files.push(row);
                    _this.files = _this._files.slice();

                },
                onUncheck: function(row, elem) {
                    let fileToDeleteIdx = -1;
                    for (const i in _this.files) {
                        if (_this.files[i].id === row.id) {
                            fileToDeleteIdx = i;
                            break;
                        }
                    }

                    if (fileToDeleteIdx === -1) {
                        return;
                    }

                    // _this.splice("_files", fileToDeleteIdx, 1);
                    // _this.set("files", _this._files.slice());
                    _this._files.splice(fileToDeleteIdx, 1);
                    _this.files = _this._files.slice();
                },
                onCheckAll: function(rows) {
                    const newFiles = _this._files.slice();
                    // check file is not already selected
                    rows.forEach(file => {
                        const existsNewSelected = _this._files.some(fileSelected => {
                            return fileSelected.id === file.id;
                        });

                        if (!existsNewSelected) {
                            newFiles.push(file);
                        }
                    });

                    // we add files to selected files
                    _this._files = newFiles;
                    _this.files = newFiles.slice();

                },
                onUncheckAll: function(rows) {
                    // check file is not already selected
                    rows.forEach(file => {
                        _this._files = _this._files.filter(fileSelected => {
                            return fileSelected.id !== file.id;
                        });

                    });

                    // we add files to selected files
                    //                            _this.push("_files", row);
                    _this.files = _this._files.slice();

                },
                onLoadSuccess: data => this.gridCommons.onLoadSuccess(data, 1),
                onPageChange: (page, size) => this.gridCommons.onPageChange(page, size)
            });

            this.opencgaSession.opencgaClient.studies().info(this.opencgaSession.study.id)
                .then(function(response) {
                    _this.variableSets = response.response[0].result[0].variableSets;
                })
                .catch(function() {
                    console.log("Could not obtain the variable sets of the study " + _this.opencgaSession.study.id);
                });
        } else {
            // Delete table
            $(PolymerUtils.getElementById(this._prefix + "FileBrowserGrid")).bootstrapTable("destroy");
            this.numTotalResults = 0;
        }
    }

    /**
     * If filters have been removed, clean the values from the forms.
     */
    onFilterUpdate() {
        // this.updateForms(this.filters); //TODO recheck, this shouldn't be necessary anymore (and it seems not)
    }

    _onSelectFile(row) {
        if (typeof row !== "undefined") {
            this.dispatchEvent(new CustomEvent("selectfile", {detail: {id: row.id, file: row}}));
        }
    }

    updateForms(filters) {
        // This is just to avoid entering here when it has just been initialized
        if (UtilsNew.isUndefined(this._prefix)) {
            return;
        }

        const fileName = PolymerUtils.getValue(this._prefix + "NameTextarea");
        if (!filters.hasOwnProperty("name") && UtilsNew.isNotUndefined(fileName) && fileName.length > 0) {
            PolymerUtils.getElementById(this._prefix + "NameTextarea").value = "";
        }

        const individual = PolymerUtils.getValue(this._prefix + "IndividualTextarea");
        if (!filters.hasOwnProperty("individual.id") && UtilsNew.isNotUndefined(individual) && individual.length > 0) {

            PolymerUtils.setValue(this._prefix + "IndividualTextarea", "");
        }

        if (this.filteredVariables.variables.length > 0) {
            if (!filters.hasOwnProperty("annotation")) {
                // Remove the filter variableSetId as it won't make more sense.
                this.filteredVariables.variables = [];

            } else if (filters.annotation.length < this.filteredVariables.variables.length) {
                const tmpVariables = [];
                filters.annotation.forEach(function(variable) {
                    tmpVariables.push(variable);
                });

                this.filteredVariables.variables = tmpVariables;
            }
        }
    }

    /**
     * Read from the values in the forms, and sets the filters.
     */
    calculateFilters() {
        const filters = {};
        let fileName = "";
        let individual = "";

        if (PolymerUtils.getElementById(this._prefix + "NameTextarea") !== null) {
            fileName = PolymerUtils.getElementById(this._prefix + "NameTextarea").value;
        }
        if (PolymerUtils.getElementById(this._prefix + "IndividualTextarea") !== null) {
            individual = PolymerUtils.getElementById(this._prefix + "IndividualTextarea").value;
        }

        if (UtilsNew.isNotUndefined(fileName) && fileName.length > 0) {
            filters["name"] = "~" + fileName;
        }

        if (UtilsNew.isNotUndefined(individual) && individual.length > 0) {
            filters["individual.id"] = "~" + individual;
        }

        if (UtilsNew.isNotUndefined(this.filteredVariables.variables) && this.filteredVariables.variables.length > 0) {
            //                    filters["variableSetId"] = this.filteredVariables.variableSet;
            const annotations = [];
            this.filteredVariables.variables.forEach(function(variable) {
                annotations.push(variable);
            });
            filters["annotation"] = annotations;
        }
        this.filters = filters;
    }

    stateFormatter(value, row, index) {
        if (typeof this.field.context.files != "undefined") {
            for (const idx in this.field.context.files) {
                if (this.field.context.files[idx].name == row.name) {
                    break;
                }
            }
        }
    }

    individualFormatter(value, row) {
        if (UtilsNew.isNotUndefined(row.attributes) && UtilsNew.isNotUndefined(row.attributes.individual) &&
            UtilsNew.isNotUndefined(row.attributes.individual.id)) {
            return row.attributes.individual.id;
        } else {
            return "-";
        }
    }

    dateFormatter(value, row) {
        return moment(value, "YYYYMMDDHHmmss").format("D MMM YYYY");
    }

    diagnosisFormatter(value, row) {
        if (UtilsNew.isNotUndefined(row.attributes) && UtilsNew.isNotUndefined(row.attributes.individual) &&
            UtilsNew.isNotEmptyArray(row.attributes.individual.phenotypes)) {
            const diagnosisPhenotypes = row.attributes.individual.phenotypes.filter(disease => {
                return disease.source === "ICD10";
            }).map(icd10disease => {
                return icd10disease.name;
            });
            if (UtilsNew.isNotEmptyArray(diagnosisPhenotypes)) {
                return diagnosisPhenotypes.join(",");
            }
        }
        return "-";
    }

    hpoFormatter(value, row) {
        if (UtilsNew.isNotUndefined(row.attributes) && UtilsNew.isNotUndefined(row.attributes.individual) &&
            UtilsNew.isNotEmptyArray(row.attributes.individual.phenotypes)) {
            const hpoPhenotypes = row.attributes.individual.phenotypes.filter(disease => {
                return disease.source === "HPO";
            }).map(hpoDisease => {
                return hpoDisease.name;
            });
            if (UtilsNew.isNotEmptyArray(hpoPhenotypes)) {
                return hpoPhenotypes.join(",");
            }
        }
        return "-";
    }

    fatherFormatter(value, row) {
        if (UtilsNew.isNotUndefined(row.attributes) && UtilsNew.isNotUndefined(row.attributes.individual) &&
            UtilsNew.isNotUndefined(row.attributes.individual.father) &&
            UtilsNew.isNotUndefined(row.attributes.individual.father.id)) {
            return row.attributes.individual.father.id;
        } else {
            return "-";
        }
    }

    motherFormatter(value, row) {
        if (UtilsNew.isNotUndefined(row.attributes) && UtilsNew.isNotUndefined(row.attributes.individual) &&
            UtilsNew.isNotUndefined(row.attributes.individual.mother) &&
            UtilsNew.isNotUndefined(row.attributes.individual.mother.id)) {
            return row.attributes.individual.mother.id;
        } else {
            return "-";
        }
    }

    cellTypeFormatter(value, row) {
        return (row.somatic) ? "Somatic" : "Germline";
    }

    sizeFormatter(bytes) {
        const si = true; // international system of units
        let u, b=bytes, t= si ? 1000 : 1024;
        ["", si?"k":"K", ..."MGTPEZY"].find(x=> (u=x, b/=t, b**2<1));
        return `${u ? (t*b).toFixed(1) : bytes} ${u}${!si && u ? "i":""}B`;
    }

    _initTableColumns() {
        const columns = [];
        if (this._config.multiSelection) {
            columns.push({
                field: {source: "state", context: this},
                checkbox: true,
                formatter: this.stateFormatter
            });
        }

        this._columns = [
            columns.concat([
                // name,path,samples,status,format,bioformat,creationDate,modificationDate,uuid"
                {
                    title: "Uuid",
                    field: "uuid",
                    visible: false
                },
                {
                    title: "Name",
                    field: "name"
                },
                {
                    title: "Path",
                    field: "path"
                },
                {
                    title: "Format",
                    field: "format"
                },
                {
                    title: "Bioformat",
                    field: "bioformat"
                },
                {
                    title: "Size",
                    field: "size",
                    formatter: this.sizeFormatter
                },
                {
                    title: "Creation date",
                    field: "creationDate",
                    formatter: this.dateFormatter
                },
                {
                    title: "Modification date",
                    field: "modificationDate",
                    formatter: this.dateFormatter
                },
                {
                    title: "Status",
                    field: "internal.status.name"
                },
                {
                    title: "Index",
                    field: "internal.index.status.name"
                }
            ])
        ];

        return this._columns;
    }

    onDownload(e) {
        // let urlQueryParams = this._getUrlQueryParams();
        // let params = urlQueryParams.queryParams;
        console.log(this.opencgaSession);
        const params = {
            ...this.query,
            limit: 1000,
            sid: this.opencgaSession.opencgaClient._config.sessionId,
            skip: 0,
            count: false,
            study: this.opencgaSession.study.fqn,
            include: "name,path,format,bioformat,creationDate,modificationDate,status",
            type: "FILE"
        };
        this.opencgaSession.opencgaClient.files().search(params)
            .then(response => {
                const result = response.response[0].result;
                let dataString = [];
                let mimeType = "";
                let extension = "";
                if (result) {
                    // Check if user clicked in Tab or JSON format
                    if (e.detail.option.toLowerCase() === "tab") {
                        dataString = [
                            ["Name", "Path", "Format", "Bioformat", "Size", "Creation date", "Modification date", "Status"].join("\t"),
                            ...result.map( _ => [
                                _.id,
                                _.path,
                                _.format,
                                _.bioformat,
                                _.size,
                                _.creationDate,
                                _.modificationDate,
                                _.status.name
                            ].join("\t"))];
                        // console.log(dataString);
                        mimeType = "text/plain";
                        extension = ".txt";
                    } else {
                        for (const res of result) {
                            dataString.push(JSON.stringify(res, null, "\t"));
                        }
                        mimeType = "application/json";
                        extension = ".json";
                    }

                    // Build file and anchor link
                    const data = new Blob([dataString.join("\n")], {type: mimeType});
                    const file = window.URL.createObjectURL(data);
                    const a = document.createElement("a");
                    a.href = file;
                    a.download = this.opencgaSession.study.alias + extension;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(function() {
                        document.body.removeChild(a);
                    }, 0);
                } else {
                    console.error("Error in result format");
                }
            })
            .then(function() {
                // this.downloadRefreshIcon.css("display", "none");
                // this.downloadIcon.css("display", "inline-block");
            });
    }

    getDefaultConfig() {
        return {
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50],
            showExport: false,
            detailView: false,
            detailFormatter: undefined, // function with the detail formatter
            multiSelection: false
        };
    }


    render() {
        return html`
        <opencb-grid-toolbar .from="${this.from}"
                            .to="${this.to}"
                            .numTotalResultsText="${this.numTotalResultsText}"
                            @columnChange="${this.onColumnChange}"
                            @download="${this.onDownload}">
        </opencb-grid-toolbar>
        <div id="${this._prefix}GridTableDiv">
            <table id="${this._prefix}FileBrowserGrid">
            </table>
        </div>
        `;
    }

}

customElements.define("opencga-file-grid", OpencgaFileGrid);
