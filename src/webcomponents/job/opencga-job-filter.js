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
import "../opencga/catalog/variableSets/opencga-annotation-filter.js";
import "../commons/forms/date-filter.js";
import "../commons/forms/text-field-filter.js";
import "../commons/filters/jobs-id-autocomplete.js";
import "../commons/filters/analysis-tool-id-autocomplete.js";


export default class OpencgaJobFilter extends LitElement {

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
                type: Object,
            },
            query: {
                type: Object,
            },
            // todo check
            variableSets: {
                type: Array,
            },
            variables: {
                type: Array,
            },
            config: {
                type: Object,
            },
        };
    }

    _init() {
        // super.ready();
        this._prefix = "osf-" + UtilsNew.randomString(6) + "_";

        this.annotationFilterConfig = {
            class: "small",
            buttonClass: "btn-sm",
            inputClass: "input-sm",
        };

        this.query = {};
        this.preparedQuery = {};
        this.searchButton = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this.preparedQuery = {...this.query}; // propagates here the iva-app query object
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        UtilsNew.initTooltip(this);
    }

    updated(changedProperties) {
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
        if (changedProperties.has("variables")) {
            this.variablesChanged();
        }
    }

    onSearch() {
        this.notifySearch(this.preparedQuery);
    }

    queryObserver() {
        console.log("queryObserver()", this.query);
        this.preparedQuery = this.query || {};
        this.requestUpdate();
    }

    onFilterChange(key, value) {
        console.log("filterChange", {[key]: value});
        if (value && value !== "") {
            this.preparedQuery = {...this.preparedQuery, ...{[key]: value}};
        } else {
            console.log("deleting", key, "from preparedQuery");
            delete this.preparedQuery[key];
            this.preparedQuery = {...this.preparedQuery};
        }
        this.notifyQuery(this.preparedQuery);
        this.requestUpdate();
    }

    notifyQuery(query) {
        this.dispatchEvent(new CustomEvent("queryChange", {
            detail: {
                query: query,
            },
            bubbles: true,
            composed: true,
        }));
    }

    notifySearch(query) {
        this.dispatchEvent(new CustomEvent("querySearch", {
            detail: {
                query: query,
            },
            bubbles: true,
            composed: true,
        }));
    }

    _createSection(section) {
        const htmlFields = section.filters?.length ? section.filters.map(subsection => this._createSubSection(subsection)) : "";
        return this.config.sections.length > 1 ? html`
            <section-filter .config="${section}" .filters="${htmlFields}">` : htmlFields;
    }

    _createSubSection(subsection) {
        let content = "";
        switch (subsection.id) {
            case "id":
                content = html`
                    <jobs-id-autocomplete .config="${subsection}" .opencgaSession="${this.opencgaSession}" .value="${this.preparedQuery[subsection.id]}"
                                          @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></jobs-id-autocomplete>`;
                break;
            case "input":
                content = html`
                    <file-name-autocomplete .config="${subsection}" .opencgaSession="${this.opencgaSession}" .value="${this.preparedQuery[subsection.id]}"
                                            @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></file-name-autocomplete>`;
                break;
            case "tool":
                content = html`
                    <analysis-tool-id-autocomplete .config="${subsection}" .opencgaSession="${this.opencgaSession}" .value="${this.preparedQuery[subsection.id]}"
                                                   @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></analysis-tool-id-autocomplete>`;
                break;
            case "tags":
                content = html`
                    <text-field-filter placeholder="${subsection.placeholder}" .value="${this.preparedQuery[subsection.id]}" .separator="${",;"}"
                                       @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></text-field-filter>`;
                break;
            case "internal.status.name":
            case "visited":
            case "priority":
                content = html`
                    <select-field-filter multiple .value="${this.preparedQuery[subsection.id]}" .data="${subsection.allowedValues}"
                                         @filterChange="${e => this.onFilterChange(subsection.id, e.detail.value)}"></select-field-filter>`;
                break;
            case "creationDate":
                content = html`
                    <date-filter .creationDate="${this.preparedQuery.creationDate}" @filterChange="${e => this.onFilterChange("creationDate", e.detail.value)}"></date-filter>`;
                break;
            default:
                console.error("Filter component not found");
        }

        return html`
            <div class="form-group">
                <div class="browser-subsection" id="${subsection.id}">${subsection.name}
                    ${subsection.description ? html`
                        <div class="tooltip-div pull-right">
                            <a tooltip-title="${subsection.name}" tooltip-text="${subsection.description}"><i class="fa fa-info-circle" aria-hidden="true"></i></a>
                        </div>` : null}
                </div>
                <div id="${this._prefix}${subsection.id}" class="subsection-content" data-cy="${subsection.id}">
                    ${content}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <style>
                .label-opencga-file-filter {
                    padding-top: 10px;
                }

                .browser-ct-scroll {
                    /*max-height: 450px;*/
                    /*overflow-y: scroll;*/
                    overflow-x: scroll;
                }

                .browser-ct-tree-view,
                .browser-ct-tree-view * {
                    padding: 0;
                    margin: 0;
                    list-style: none;
                }

                .browser-ct-tree-view li ul {
                    margin: 0 0 0 22px;
                }

                .browser-ct-tree-view * {
                    vertical-align: middle;
                }

                .browser-ct-tree-view {
                    /*font-size: 14px;*/
                }

                .browser-ct-tree-view input[type="checkbox"] {
                    cursor: pointer;
                }

                .browser-ct-item {
                    white-space: nowrap;
                    display: inline
                }

                span.searchingSpan {
                    background-color: #286090;
                }

                .searchingButton {
                    color: #fff;
                }
            </style>

            ${this.config?.searchButton ? html`
                <div class="search-button-wrapper">
                    <button type="button" class="btn btn-primary ripple" @click="${this.onSearch}">
                        <i class="fa fa-search" aria-hidden="true"></i> Search
                    </button>
                </div>
            ` : null}

            <div class="panel-group" id="${this._prefix}Accordion" role="tablist" aria-multiselectable="true">
                ${this.config?.sections?.length ? this.config.sections.map(section => this._createSection(section)) : html`No filter has been configured.`}
            </div>
        `;
    }

}

customElements.define("opencga-job-filter", OpencgaJobFilter);
