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

import {LitElement, html} from "lit";
import {classMap} from "lit/directives/class-map.js";
import OpencgaCatalogUtils from "../../../core/clients/opencga/opencga-catalog-utils.js";
import UtilsNew from "../../../core/utilsNew.js";
import "../../clinical/clinical-analysis-editor.js";
import "../../clinical/obsolete/opencga-clinical-analysis-writer.js";
import "../../clinical/clinical-analysis-interpretation-editor.js";
import "../../commons/filters/clinical-analysis-id-autocomplete.js";
import "../../commons/forms/data-form.js";
import "../../clinical/clinical-analysis-audit-browser.js";
import "../../clinical/clinical-analysis-consent-editor.js";
import "../../individual/individual-view.js";

class VariantInterpreterLanding extends LitElement {

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
            // clinicalAnalysisId: {
            //     type: String
            // },
            clinicalAnalysis: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this.clinicalAnalysisEditorConfig = {
            display: {
                showTitle: false,
                buttons: {
                    show: true
                }
            }
        };

        this.activeTab = "Select";
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("clinicalAnalysis")) {
            this.propertyObserver();
        }
        super.update(changedProperties);
    }

    propertyObserver() {
        this.editMode = OpencgaCatalogUtils.checkPermissions(this.opencgaSession.study, this.opencgaSession.user.id, "WRITE_CLINICAL_ANALYSIS");
        if (this.clinicalAnalysis) {
            if (this.activeTab === "Select") {
                this.activeTab = this.editMode ? "General" : "Overview";
            }
        } else {
            this.activeTab = "Select";
            this.getLastClinicalAnalysis();
        }
        // this.onCloseClinicalAnalysis();
    }

    // non-bootstrap tabs
    _changeTab(e) {
        e.preventDefault();
        // Only allow tab change if we have a clinical analysis
        if (this.clinicalAnalysis) {
            this.activeTab = e.currentTarget.dataset.id;
            this.requestUpdate();
        }
    }

    onCloseClinicalAnalysis() {
        // this.clinicalAnalysis = null;
        this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
            detail: {
                id: null,
                clinicalAnalysis: null
            },
            bubbles: true,
            composed: true
        }));
    }

    onClinicalAnalysisUpdate(e) {
        this.dispatchEvent(new CustomEvent("clinicalAnalysisUpdate", {
            detail: {
                clinicalAnalysis: e.detail.clinicalAnalysis
            },
            bubbles: true,
            composed: true
        }));
    }

    onClinicalAnalysisIdChange(key, value) {
        this.clinicalAnalysisId = value;
        this.probandId = null;
        this.onClinicalAnalysisChange();
    }

    onProbandIdChange(key, value) {
        // this.probandId = value;
        this.clinicalAnalysisId = value;
        this.onClinicalAnalysisChange();
    }

    onClinicalAnalysisChange() {
        if (this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                    this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
                        detail: {
                            id: this.clinicalAnalysis ? this.clinicalAnalysis.id : null,
                            clinicalAnalysis: this.clinicalAnalysis
                        },
                        bubbles: true,
                        composed: true
                    }));
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        } else if (this.probandId) {
            this.opencgaSession.opencgaClient.clinical().search({proband: this.probandId, study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                    this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
                        detail: {
                            id: this.clinicalAnalysis ? this.clinicalAnalysis.id : null,
                            clinicalAnalysis: this.clinicalAnalysis
                        },
                        bubbles: true,
                        composed: true
                    }));
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    onClinicalAnalysisCreate(e) {
        // Fetch object from server since the server automatically adds some information
        this.opencgaSession.opencgaClient.clinical().info(e.detail.id, {study: this.opencgaSession.study.fqn})
            .then(response => {
                this.clinicalAnalysis = response.responses[0].results[0];
                this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
                    detail: {
                        id: this.clinicalAnalysis ? this.clinicalAnalysis.id : null,
                        clinicalAnalysis: this.clinicalAnalysis
                    },
                    bubbles: true,
                    composed: true
                }));
            })
            .catch(response => {
                console.error("An error occurred fetching clinicalAnalysis: ", response);
            });
    }

    getLastClinicalAnalysis() {
        // Fetch object from server since the server automatically adds some information
        this.opencgaSession.opencgaClient.clinical().search({study: this.opencgaSession.study.fqn, limit: 10, include: "id"})
            .then(response => {
                this.lastClinicalAnalysis = response.responses[0].results.map(value => value.id);
                this.lastClinicalAnalysis = [...this.lastClinicalAnalysis];
                // console.log("this.lastClinicalAnalysis", this.lastClinicalAnalysis)
                // debugger
                this.requestUpdate();
            })
            .catch(response => {
                console.error("An error occurred fetching clinicalAnalysis: ", response);
                this.lastClinicalAnalysis = [];
            });
    }

    onSearchFieldChange(e) {
        switch (e.detail.param) {
            case "id":
                this.clinicalAnalysisId = e.detail.value;
                this.probandId = null;
                break;
            case "proband.id":
                this.probandId = e.detail.value;
                this.clinicalAnalysisId = null;
                break;
        }
        this.onClinicalAnalysisChange();
    }

    getSearchConfig() {
        return {
            id: "clinical-analysis",
            title: "",
            icon: "",
            type: "form",
            description: "Sample Variant Stats description",
            buttons: {
                show: true,
                clearText: "Clear",
                submitText: "Open",
                classes: "col-md-4 col-md-offset-4"
            },
            display: {
                showTitle: true,
                infoIcon: "",
                labelAlign: "left",
                defaultLayout: "vertical",
                classes: "col-md-4 col-md-offset-4"
            },
            sections: [
                {
                    title: "Open Case",
                    display: {},
                    elements: [
                        {
                            name: "Clinical Analysis ID",
                            field: "id",
                            type: "custom",
                            display: {
                                render: () => {
                                    const config = {
                                        select2Config: {
                                            multiple: false
                                        }
                                    };
                                    return html`
                                        <clinical-analysis-id-autocomplete
                                            .config=${config}
                                            .opencgaSession="${this.opencgaSession}"
                                            @filterChange="${e => this.onClinicalAnalysisIdChange("clinicalAnalysisId", e.detail.value)}">
                                        </clinical-analysis-id-autocomplete>`;
                                },
                                placeholder: "eg. AN-3",
                                errorMessage: ""
                            }
                        },
                        {
                            name: "Individual ID",
                            field: "proband.id",
                            type: "custom",
                            display: {
                                render: () => {
                                    const config = {
                                        select2Config: {
                                            multiple: false
                                        },
                                        limit: 10,
                                        source: async (params, success, failure) => {
                                            const _params = params;
                                            _params.data.page = params.data.page || 1;
                                            const proband = _params?.data?.term ? {proband: "~^" + _params?.data?.term?.toUpperCase()} : "";
                                            const filters = {
                                                study: this.opencgaSession.study.fqn,
                                                limit: config.limit,
                                                count: false,
                                                skip: (_params.data.page - 1) * config.limit,
                                                include: "id,proband",
                                                ...proband
                                            };
                                            try {
                                                const restResponse = await this.opencgaSession.opencgaClient.clinical().search(filters);
                                                success(restResponse);
                                            } catch (e) {
                                                failure(e);
                                            }
                                        },
                                    };
                                    return html`
                                        <clinical-analysis-id-autocomplete
                                            .config=${config}
                                            .opencgaSession="${this.opencgaSession}"
                                            @filterChange="${e => this.onProbandIdChange("individualId", e.detail.value)}">
                                        </clinical-analysis-id-autocomplete>`;
                                }
                            }
                        },
                        {
                            name: "Recent Analysis created",
                            field: "id",
                            type: "select",
                            // defaultValue: this.lastClinicalAnalysis ? this.lastClinicalAnalysis[0] : null,
                            allowedValues: data => {
                                return this.lastClinicalAnalysis;
                            },
                            display: {}
                        }
                    ]
                }
            ]
        };
    }

    getDefaultConfig() {
        return {
            clinicalAnalysisSelector: true
        };
    }

    render() {
        // Check Project exists
        if (!this.opencgaSession.project) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        if (this.config?.loading) {
            return html`<loading-spinner></loading-spinner>`;
        }

        return html`
            <div id="variant-interpreter-landing">
                <div>
                    <ul class="nav nav-tabs nav-center tablist" role="tablist" aria-label="toolbar">
                        ${OpencgaCatalogUtils.checkPermissions(this.opencgaSession.study, this.opencgaSession.user.id, "WRITE_CLINICAL_ANALYSIS") ? html`
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "General" || this.activeTab === ""})}">
                                <a href="javascript: void 0" role="tab" data-id="General"
                                    @click="${e => this.editMode && this._changeTab(e)}" class="tab-title ${classMap({disabled: !this.editMode})}">General</a>
                            </li>
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "Clinical"})}">
                                <a href="javascript: void 0" role="tab" data-id="Clinical"
                                    @click="${e => this.editMode && this._changeTab(e)}" class="tab-title ${classMap({disabled: !this.editMode})}">Clinical</a>
                            </li>
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "Interpretations"})}">
                                <a href="javascript: void 0" role="tab" data-id="Interpretations"
                                    @click="${e => this.editMode && this._changeTab(e)}" class="tab-title ${classMap({disabled: !this.editMode})}">Interpretation Manager</a>
                            </li>
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "Consent"})}">
                                <a href="javascript: void 0" role="tab" data-id="Consent"
                                    @click="${e => this.editMode && this._changeTab(e)}" class="tab-title ${classMap({disabled: !this.editMode})}">Consent</a>
                            </li>
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "Audit"})}">
                                <a href="javascript: void 0" role="tab" data-id="Audit"
                                    @click="${e => this.editMode && this._changeTab(e)}" class="tab-title ${classMap({disabled: !this.editMode})}">Audit</a>
                            </li>
                            ` : null
                        }
                        ${this.clinicalAnalysis ? html`
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "Overview"})}">
                                <a href="javascript: void 0" role="tab" data-id="Overview"
                                    @click="${this._changeTab}" class="tab-title">Case Overview</a>
                            </li>
                        ` : html`
                            <li role="presentation" class="content-pills ${classMap({active: this.activeTab === "Select"})}">
                                <a href="javascript: void 0" role="tab" data-id="Overview" @click="${this._changeTab}" class="tab-title">Select Case</a>
                            </li>`
                        }
                    </ul>
                </div>

                <div class="content-tab-wrapper">
                    ${this.activeTab === "General" ? html`
                        <div id="${this._prefix}General" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            <tool-header title="General Settings - ${this.clinicalAnalysis?.id ?? ""}" class="bg-white"></tool-header>
                            <div style="padding: 0px 20px">
                                <clinical-analysis-editor   .opencgaSession=${this.opencgaSession}
                                                            .clinicalAnalysis="${this.clinicalAnalysis}">
                                </clinical-analysis-editor>
                            </div>
                        </div>
                    ` : null}
                    ${this.activeTab === "Overview" ? html`
                        <div id="${this._prefix}Overview" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            ${this.clinicalAnalysis ? html`
                                <tool-header title="Case Summary - ${this.clinicalAnalysis?.id}" class="bg-white"></tool-header>
                                <div style="padding: 0px 20px">
                                    <opencga-clinical-analysis-view .opencgaSession="${this.opencgaSession}"
                                                                    .clinicalAnalysis="${this.clinicalAnalysis}">
                                    </opencga-clinical-analysis-view>
                                </div>
                            ` : null}
                        </div>
                    ` : null}
                    ${this.activeTab === "Clinical" ? html`
                        <div id="${this._prefix}Clinical" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            <tool-header title="Clinical" class="bg-white"></tool-header>
                            <div style="padding: 0px 20px">
                                <individual-view
                                    .individual="${this.clinicalAnalysis.proband}"
                                    .opencgaSession="${this.opencgaSession}">
                                </individual-view>
                            </div>
                        </div>
                    ` : null}
                    ${this.activeTab === "Interpretations" ? html`
                        <div id="${this._prefix}Interpretations" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            <tool-header title="Interpretation Manager" class="bg-white"></tool-header>
                            <div style="padding: 0px 20px">
                                <clinical-analysis-interpretation-editor    .opencgaSession="${this.opencgaSession}"
                                                                            .clinicalAnalysis="${this.clinicalAnalysis}"
                                                                            @clinicalAnalysisUpdate="${this.onClinicalAnalysisUpdate}">
                                </clinical-analysis-interpretation-editor>
                            </div>
                        </div>
                    ` : null}
                    ${this.activeTab === "Consent" ? html`
                        <div id="${this._prefix}Consent" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            <tool-header title="Consent - ${this.clinicalAnalysis?.proband.id}" class="bg-white"></tool-header>
                            <div style="padding: 0px 20px">
                                <clinical-analysis-consent-editor   .opencgaSession=${this.opencgaSession}
                                                                    .clinicalAnalysis="${this.clinicalAnalysis}">
                                </clinical-analysis-consent-editor>
                            </div>
                        </div>
                    ` : null}
                    ${this.activeTab === "Audit" ? html`
                        <div id="${this._prefix}Audit" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            <tool-header title="Audit Log" class="bg-white"></tool-header>
                            <div style="padding: 0px 10px">
                                <clinical-analysis-audit-browser
                                    .opencgaSession="${this.opencgaSession}"
                                    .clinicalAnalysis="${this.clinicalAnalysis}"
                                    .active="${this.activeTab === "Audit"}">
                                </clinical-analysis-audit-browser>
                            </div>
                        </div>
                    ` : null}
                    ${this.activeTab === "Select" ? html`
                        <div id="${this._prefix}Overview" role="tabpanel" class="active tab-pane content-tab col-md-10 col-md-offset-1">
                            <data-form  .data="${{}}"
                                        .config="${this.getSearchConfig()}"
                                        @fieldChange="${this.onSearchFieldChange}"
                                        @clear="${this.onClinicalAnalysisChange}"
                                        @submit="${this.onClinicalAnalysisChange}">
                            </data-form>
                        </div>
                    ` : null}
                </div>
            </div>
        `;
    }

}

customElements.define("variant-interpreter-landing", VariantInterpreterLanding);
