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
import "./variant-interpreter-qc-overview.js";
import "./variant-interpreter-qc-gene-coverage.js";
import "../../commons/view/detail-tabs.js";
import "../../sample/sample-variant-stats-browser.js";
import "../../sample/sample-cancer-variant-stats-browser.js";


class VariantInterpreterQc extends LitElement {

    // Defaults tabs for the interpreter qc
    // Customisable via external settings in variant-interpreter.settings.js
    static DEFAULT_TABS = [
        {id: "overview"},
        {id: "sampleVariantStats"},
        {id: "cancerQCPlots"},
        {id: "somaticVariantStats"},
        {id: "germlineVariantStats"},
        {id: "geneCoverage"}
    ];

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            cellbaseClient: {
                type: Object
            },
            clinicalAnalysis: {
                type: Object
            },
            clinicalAnalysisId: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            settings: {
                type: Object
            },
        };
    }

    _init() {
        this._tabs = [];
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("settings")) {
            this.settingsObserver();
        }

        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalAnalysisObserver();
        }

        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        super.update(changedProperties);
    }

    settingsObserver() {
        this._tabs = (this.settings?.tabs || VariantInterpreterQc.DEFAULT_TABS).map(tab => tab.id);
        this._config = this.getDefaultConfig();
    }

    clinicalAnalysisObserver() {
        if (this.clinicalAnalysis && this.clinicalAnalysis.proband?.samples) {
            if (this.clinicalAnalysis.type.toUpperCase() === "CANCER") {
                this.somaticSample = this.clinicalAnalysis.proband.samples.find(elem => elem.somatic);
                // Germline sample is optional in cancer, it might not exist
                this.sample = this.clinicalAnalysis.proband.samples.find(elem => !elem.somatic);
            } else {
                // We only expect one sample in non cancer cases
                this.sample = this.clinicalAnalysis.proband.samples[0];
            }
        }
        this._config = this.getDefaultConfig();
        this.requestUpdate();
    }

    clinicalAnalysisIdObserver() {
        if (this.opencgaSession && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis = response.responses[0].results[0];
                    // this.clinicalAnalysisObserver();
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    render() {
        // Check Project exists
        if (!this.opencgaSession?.project) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        if (!this.clinicalAnalysis) {
            return html`
                <div>
                    <h3><i class="fas fa-lock"></i> No Case open</h3>
                </div>`;
        }

        if (!this.clinicalAnalysis.proband?.samples?.length) {
            return html`
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-3x fa-exclamation-circle align-middle"></i> No sample available for Proband
                </div>
            `;
        }

        if (this._tabs.length === 0) {
            return html`
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-3x fa-exclamation-circle align-middle"></i> No QC tab available. Check the tool configuration.
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
        const items = [];

        if (this.clinicalAnalysis && this._tabs.length > 0) {
            const type = this.clinicalAnalysis.type.toUpperCase();
            const probandId = this.clinicalAnalysis.proband.id;

            if (this._tabs.includes("overview")) {
                items.push({
                    id: "overview",
                    name: "Overview",
                    active: true,
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header title="Quality Control Overview - ${probandId}" class="bg-white"></tool-header>
                                <variant-interpreter-qc-overview
                                    .opencgaSession="${opencgaSession}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .active="${active}"
                                    .settings="${this.settings?.tabs?.find(tab => "overview" === tab.id)?.settings}">
                                </variant-interpreter-qc-overview>
                            </div>
                        `;
                    },
                });
            }

            if (this._tabs.includes("sampleVariantStats") && type === "SINGLE") {
                items.push({
                    id: "sample-variant-stats",
                    name: "Sample Variant Stats",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header title="Sample Variant Stats - ${probandId} (${this.sample?.id})" class="bg-white"></tool-header>
                                <sample-variant-stats-browser
                                    .opencgaSession="${opencgaSession}"
                                    .cellbaseClient="${this.cellbaseClient}"
                                    .sample="${this.sample}"
                                    .active="${active}"
                                    .config="${{showTitle: false}}">
                                </sample-variant-stats-browser>
                            </div>
                        `;
                    },
                });
            }

            if (this._tabs.includes("sampleVariantStats") && type === "FAMILY") {
                items.push({
                    id: "sample-variant-stats-family",
                    name: "Sample Variant Stats",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header title="Sample Variant Stats - ${probandId} (${this.sample?.id})" class="bg-white"></tool-header>
                                <sample-variant-stats-browser
                                    .opencgaSession="${opencgaSession}"
                                    .cellbaseClient="${this.cellbaseClient}"
                                    .sample="${this.sample}"
                                    .active="${active}"
                                    .config="${{showTitle: false}}">
                                </sample-variant-stats-browser>
                                <h3>Not implemented yet.</h3>
                            </div>
                        `;
                    },
                });
            }

            if (this._tabs.includes("cancerQCPlots") && type === "CANCER") {
                items.push({
                    id: "variant-qc-cancer",
                    name: "Cancer QC Plots",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header title="Cancer QC Plots - ${probandId} (${this.somaticSample?.id})" class="bg-white"></tool-header>
                                <sample-cancer-variant-stats-browser
                                    .opencgaSession="${opencgaSession}"
                                    .cellbaseClient="${this.cellbaseClient}"
                                    .sample="${this.somaticSample}"
                                    .active="${active}"
                                    .config="${{showTitle: false}}">
                                </sample-cancer-variant-stats-browser>
                            </div>
                        `;
                    },
                });
            }

            if (this._tabs.includes("somaticVariantStats") && type === "CANCER") {
                items.push({
                    id: "somatic-variant-stats",
                    name: "Somatic Variant Stats",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header title="Somatic Variant Stats - ${probandId} (${this.somaticSample?.id})" class="bg-white"></tool-header>
                                <sample-variant-stats-browser
                                    .opencgaSession="${opencgaSession}"
                                    .cellbaseClient="${this.cellbaseClient}"
                                    .sample="${this.somaticSample}"
                                    .active="${active}"
                                    .config="${{showTitle: false}}">
                                </sample-variant-stats-browser>
                            </div>
                        `;
                    },
                });

                if (this._tabs.includes("germlineVariantStats") && this.sample) {
                    items.push({
                        id: "germline-variant-stats",
                        name: "Germline Variant Stats",
                        render: (clinicalAnalysis, active, opencgaSession) => {
                            return html`
                                <div class="col-md-12">
                                    <tool-header title="Germline Variant Stats - ${probandId} (${this.sample?.id})" class="bg-white"></tool-header>
                                    <sample-variant-stats-browser
                                        .opencgaSession="${opencgaSession}"
                                        .cellbaseClient="${this.cellbaseClient}"
                                        .sample="${this.sample}"
                                        .active="${active}"
                                        .config="${{showTitle: false}}">
                                    </sample-variant-stats-browser>
                                </div>
                            `;
                        },
                    });
                }
            }

            if (this._tabs.includes("geneCoverage")) {
                items.push({
                    id: "gene-coverage",
                    name: "Gene Coverage Stats",
                    render: (clinicalAnalysis, active, opencgaSession) => {
                        return html`
                            <div class="col-md-12">
                                <tool-header title="Gene Coverage Stats - ${probandId}" class="bg-white"></tool-header>
                                <variant-interpreter-qc-gene-coverage
                                    .opencgaSession="${opencgaSession}"
                                    .cellbaseClient="${this.cellbaseClient}"
                                    .clinicalAnalysis="${clinicalAnalysis}"
                                    .active="${active}">
                                </variant-interpreter-qc-gene-coverage>
                            </div>
                        `;
                    },
                });
            }
        }

        return {
            display: {
                align: "center"
            },
            items: items,
        };
    }

}

customElements.define("variant-interpreter-qc", VariantInterpreterQc);
