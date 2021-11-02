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
import "./variant-interpreter-review-primary.js";
import "../../clinical/clinical-interpretation-editor.js";
import "../../commons/view/detail-tabs.js";


export default class VariantInterpreterReview extends LitElement {

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
                type: String
            },
            clinicalAnalysisId: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
        };
    }

    _init() {
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        super.update(changedProperties);
    }


    clinicalAnalysisIdObserver() {
        if (this.opencgaSession && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    render() {
        // Check if session has not been created or project does not exist
        if (!this.opencgaSession || !this.opencgaSession.project) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        return html`
            <detail-tabs
                .data="${this.clinicalAnalysis}"
                .config="${this._config}"
                .opencgaSession="${this.opencgaSession}">
            </detail-tabs>
        `;
    }


    getDefaultConfig() {
        return {
            // title: "Interpretation review",
            display: {
                align: "center",
            },
            items: [
                {
                    id: "general-info",
                    name: "General Info",
                    active: true,
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-10 col-md-offset-1">
                                <tool-header
                                    class="bg-white"
                                    title="Interpretation - ${clinicalAnalysis?.interpretation?.id}">
                                </tool-header>
                                <clinical-interpretation-editor
                                    .active="${active}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .opencgaSession="${opencgaSession}">
                                </clinical-interpretation-editor>
                            </div>
                        `;
                    }
                },
                {
                    id: "primary-findings",
                    name: "Primary Findings",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-10 col-md-offset-1">
                                <tool-header
                                    class="bg-white"
                                    title="Primary Findings - ${clinicalAnalysis?.interpretation?.id}">
                                </tool-header>
                                <variant-interpreter-review-primary
                                    .active="${active}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .opencgaSession="${opencgaSession}">
                                </variant-interpreter-review-primary>
                            </div>
                        `;
                    },
                },
            ],
        };
    }

}

customElements.define("variant-interpreter-review", VariantInterpreterReview);
