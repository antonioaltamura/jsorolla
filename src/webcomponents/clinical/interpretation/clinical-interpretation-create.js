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
import OpencgaCatalogUtils from "../../../core/clients/opencga/opencga-catalog-utils.js";
import "../filters/clinical-status-filter.js";
import "../../commons/forms/data-form.js";
import "../../commons/filters/disease-panel-filter.js";

import LitUtils from "../../commons/utils/lit-utils.js";
import NotificationUtils from "../../commons/utils/notification-utils.js";

export default class ClinicalInterpretationCreate extends LitElement {

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            clinicalAnalysis: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
            mode: {
                type: String
            },
            displayConfig: {
                type: Object
            },
        };
    }

    _init() {
        this.mode = "";
        this.interpretation = {};

        this.displayConfigDefault = {
            width: 10,
            buttonsAlign: "right",
            buttonClearText: "Clear",
            buttonOkText: "Create Interpretation",
            titleVisible: false,
            titleWidth: 4,
            defaultLayout: "horizontal"
        };
        this.config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this.config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("clinicalAnalysis")) {
            this.initClinicalInterpretation();
            this.config = this.getDefaultConfig();
        }
        if (changedProperties.has("opencgaSession")) {
            this.users = OpencgaCatalogUtils.getUsers(this.opencgaSession.study);
            this.initClinicalInterpretation();
        }
        if (changedProperties.has("displayConfig")) {
            this.displayConfig = {...this.displayConfigDefault, ...this.displayConfig};
            this.config = this.getDefaultConfig();
        }
        super.update(changedProperties);
    }

    initClinicalInterpretation() {
        this.interpretation = {
            clinicalAnalysisId: this.clinicalAnalysis.id,
            analyst: {
                id: this.opencgaSession?.user?.id
            },
            panels: this.clinicalAnalysis.panels?.length > 0 ? this.clinicalAnalysis?.panels.map(panel => {
                return {id: panel.id};
            }) : [],
            comments: [],
        };
    }

    onFieldChange(e, field) {
        const param = field || e.detail.param;
        switch (param) {
            case "analyst.id":
                this.interpretation.analyst = {
                    id: e.detail.value
                };
                break;
            case "status.id":
                this.interpretation.status = {
                    id: e.detail.value,
                };
                break;
            case "panels.id":
                const [field, prop] = param.split(".");
                if (e.detail.value) {
                    this.interpretation[field] = e.detail.value.split(",").map(value => ({[prop]: value}));
                } else {
                    delete this.interpretation[field];
                }
                break;
            // case "_comments":
            //     this.interpretation.comments = [
            //         {
            //             message: e.detail.value
            //         }
            //     ];
            //     break;
            default:
                this.interpretation[param] = e.detail.value;
                break;
        }

        this.interpretation = {...this.interpretation};
        this.requestUpdate();
    }

    onCommentChange(e) {
        this.interpretation.comments = e.detail.value;
    }

    notifyClinicalAnalysisWrite() {
        LitUtils.dispatchCustomEvent(this, "clinicalAnalysisUpdate", null, {
            id: this.interpretation.id,
            clinicalAnalysis: this.interpretation,
        });
    }

    onClear() {
        this.initClinicalInterpretation();
        this.requestUpdate();
    }

    onSubmit() {
        // remove private fields
        const data = {...this.interpretation};

        this.opencgaSession.opencgaClient.clinical().createInterpretation(this.clinicalAnalysis.id, data, {
            study: this.opencgaSession.study.fqn
        })
            .then(() => {
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                    title: "Clinical Interpretation created",
                    // message: `The clinical interpretation ${response.responses[0].results[0].id} has been created successfully`,
                    message: "The new clinical interpretation has been created successfully",
                });
                this.notifyClinicalAnalysisWrite();
                this.onClear();
            })
            .catch(response => {
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
            });
    }

    render() {
        return html`
            <data-form
                .data="${this.interpretation}"
                .config="${this.config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

    getDefaultConfig() {
        return {
            id: "clinical-interpretation",
            title: "Create Interpretation",
            icon: "fas fa-file-medical",
            type: this.mode,
            requires: "2.2.0",
            description: "Create a new interpretation for this case",
            display: this.displayConfig || this.displayConfigDefault,
            sections: [
                {
                    title: "General Information",
                    elements: [
                        {
                            title: "Case Id",
                            field: "id",
                            type: "input-text",
                            defaultValue: this.clinicalAnalysis?.id,
                            display: {
                                disabled: true,
                                helpMessage: "The interpretation Id is generated automatically",
                            },
                        },
                        {
                            title: "Assigned To",
                            field: "analyst.id",
                            type: "select",
                            defaultValue: this.opencgaSession?.user?.id,
                            allowedValues: () => this.users,
                            display: {},
                        },
                        {
                            title: "Status",
                            field: "status",
                            type: "custom",
                            display: {
                                render: status => html`
                                    <clinical-status-filter
                                        .status="${status?.id}"
                                        .statuses="${this.opencgaSession.study.internal?.configuration?.clinical?.interpretation?.status[this.clinicalAnalysis.type.toUpperCase()]}"
                                        .multiple=${false}
                                        @filterChange="${e => {
                                            e.detail.param = "status.id";
                                            this.onFieldChange(e);
                                        }}">
                                    </clinical-status-filter>
                                `,
                            }
                        },
                        {
                            title: "Disease Panels",
                            field: "panels",
                            type: "custom",
                            display: {
                                render: panels => {
                                    const panelLock = !!this.clinicalAnalysis?.panelLock;
                                    const panelList = panelLock ? this.clinicalAnalysis.panels : this.opencgaSession.study?.panels;
                                    return html`
                                        <disease-panel-filter
                                            .opencgaSession="${this.opencgaSession}"
                                            .diseasePanels="${panelList}"
                                            .panel="${panels?.map(p => p.id).join(",")}"
                                            .showExtendedFilters="${false}"
                                            .showSelectedPanels="${false}"
                                            .disabled="${panelLock}"
                                            @filterChange="${e => this.onFieldChange(e, "panels.id")}">
                                        </disease-panel-filter>
                                    `;
                                }
                            }
                        },
                        {
                            title: "Description",
                            field: "description",
                            type: "input-text",
                            defaultValue: "",
                            display: {
                                rows: 2,
                                placeholder: "Add a description to this case..."
                            }
                        },
                        {
                            title: "Comments",
                            field: "comments",
                            type: "custom",
                            display: {
                                render: comments => html`
                                    <clinical-analysis-comment-editor
                                        .comments="${comments}"
                                        @commentChange="${e => this.onCommentChange(e)}">
                                    </clinical-analysis-comment-editor>
                                `,
                            }
                        }
                        // {
                        //     title: "Comment",
                        //     field: "_comments",
                        //     type: "input-text",
                        //     defaultValue: "",
                        //     display: {
                        //         rows: 2,
                        //         placeholder: "Initial comment..."
                        //         // render: comments => html`
                        //         //     <clinical-analysis-comment-editor .comments="${comments}" .opencgaSession="${this.opencgaSession}"></clinical-analysis-comment-editor>`
                        //     }
                        // },
                    ]
                },
            ]
        };
    }

}

customElements.define("clinical-interpretation-create", ClinicalInterpretationCreate);
