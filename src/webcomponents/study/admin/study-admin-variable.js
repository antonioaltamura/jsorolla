/**
 * Copyright 2015-2021 OpenCB
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

import {LitElement, html, nothing} from "lit";
import OpencgaCatalogUtils from "../../../core/clients/opencga/opencga-catalog-utils.js";
import DetailTabs from "../../commons/view/detail-tabs.js";
import UtilsNew from "../../../core/utilsNew.js";
import "../permission/permission-browser-grid.js";
import "../variable/variable-set-create.js";
import "../variable/variable-set-view.js";

export default class StudyAdminVariable extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            studyId: {
                type: String
            },
            study: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.editVariableSet = false;
        this.variableSetId = "";
        this.variableSet = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};

    }

    update(changedProperties) {
        super.update(changedProperties);
    }

    editForm(e) {
        this.editVariableSet = !this.editVariableSet;
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    clearForm() {
        this.editVariableSet = false;
        this.variableSet = {};
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    changeVariableSetId(e) {
        this.fetchVariableSetId(e.detail.value);
    }

    fetchVariableSetId(variableSetId) {
        if (this.opencgaSession) {
            if (variableSetId) {
                this.opencgaSession.opencgaClient.studies().variableSet(this.opencgaSession.study.fqn, {id: variableSetId})
                    .then(response => {
                        this.variableSet = response.responses[0].results[0];
                    })
                    .catch(reason => {
                        this.variableSet = {};
                        console.error(reason);
                    })
                    .finally(() => {
                        this._config = {...this.getDefaultConfig(), ...this.config};
                        this.requestUpdate();
                    });
            }
        }
    }

    onVariableSearch(e) {
        if (e.detail.status?.error) {
            console.error(this, "Error Message:", e.detail.status.error);
        } else {
            this.variableSet = e.detail.value;
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    getDefaultConfig() {
        return {
            items: [
                {
                    id: "view-variable",
                    name: "View Variable",
                    icon: "fa fa-table icon-padding",
                    active: true,
                    render: (study, active, opencgaSession) => {
                        return html`
                            <div class="row">
                                <div class="col-md-6" style="margin: 20px 10px">
                                    <div style="float: right">
                                        ${UtilsNew.isNotEmpty(this.variableSet) ? html `
                                            <button class="btn btn-default ripple btn-sm" type="button" @click="${e => this.clearForm(e)}">
                                            <i class="fas fa-arrow-left icon-hover"></i>  Back
                                            </button>`: nothing}
                                    </div>
                                    <variable-set-view
                                        .variableSet="${this.variableSet}"
                                        .opencgaSession="${opencgaSession}"
                                        @variableSetSearch="${e => this.onVariableSearch(e)}">
                                    </variable-set-view>
                                </div>
                            </div>`;
                    }
                },
                {
                    id: "create-variable",
                    name: "Create Variable",
                    icon: "fas fa-clipboard-list",
                    active: false,
                    render: (study, active, opencgaSession) => {
                        return html`
                            <div class="row">
                                <div class="col-md-6" style="margin: 20px 10px">
                                    <variable-set-create
                                            .opencgaSession="${opencgaSession}">
                                    </variable-set-create>
                                </div>
                            </div>`;
                    }
                }
            ]
        };
    }

    render() {

        if (!OpencgaCatalogUtils.isAdmin(this.opencgaSession.study, this.opencgaSession.user.id)) {
            return html`
            <div class="guard-page">
                <i class="fas fa-lock fa-5x"></i>
                <h3>No permission to view this page</h3>
            </div>`;
        }

        return html`
            <div style="margin: 20px">
                <detail-tabs
                    .config="${this._config}"
                    .mode=${DetailTabs.PILLS_MODE}
                    .opencgaSession="${this.opencgaSession}">
                </detail-tabs>
            </div>
            `;
    }

}

customElements.define("study-admin-variable", StudyAdminVariable);
