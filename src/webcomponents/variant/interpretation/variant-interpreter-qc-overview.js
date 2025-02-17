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
import UtilsNew from "../../../core/utilsNew.js";
import "./variant-interpreter-qc-summary.js";
import "./variant-interpreter-qc-variant-stats.js";
import "./variant-interpreter-qc-inferred-sex.js";
import "./variant-interpreter-qc-relatedness.js";
import "./variant-interpreter-qc-mendelian-errors.js";
import "./variant-interpreter-qc-signature.js";
import "./variant-interpreter-qc-gene-coverage-stats.js";
import "../../sample/sample-variant-stats-view.js";
import "../../file/qc/file-qc-ascat-metrics.js";
import "../../alignment/qc/samtools-stats-view.js";
import "../../alignment/qc/samtools-flagstats-view.js";

class VariantInterpreterQcOverview extends LitElement {

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
            clinicalAnalysisId: {
                type: String
            },
            clinicalAnalysis: {
                type: Object
            },
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalAnalysisObserver();
        }

        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }

        if (changedProperties.has("settings")) {
            this._config = {...this.getDefaultConfig(), ...this.settings};
            if (this.settings.tabs) {
                this._config = UtilsNew.mergeDataFormConfig(this._config, this.settings.tabs);
            }
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

    clinicalAnalysisObserver() {
        if (this.opencgaSession && this.clinicalAnalysis?.proband?.samples?.length > 0) {
            // Fetch sample of interest, in cancer this is the somatic one
            if (this.clinicalAnalysis.type?.toUpperCase() !== "CANCER") {
                this.sample = this.clinicalAnalysis.proband.samples[0];
            } else {
                this.sample = this.clinicalAnalysis.proband.samples.find(sample => sample.somatic);
            }

            const bamFileIds = [];
            for (const sample of this.clinicalAnalysis.proband.samples) {
                const bamFile = sample.fileIds.find(fileId => fileId.endsWith(".bam"));
                if (bamFile) {
                    bamFileIds.push(bamFile);
                }
            }
            if (bamFileIds.length > 0) {
                this.opencgaSession.opencgaClient.files().info(bamFileIds.join(","), {study: this.opencgaSession.study.fqn})
                    .then(response => {
                        this.bamFiles = response.responses[0].results;
                        this.alignmentStats = [];
                        for (const file of response.responses[0].results) {
                            const annotSet = file.annotationSets.find(annotSet => annotSet.id === "opencga_alignment_stats");
                            if (annotSet?.annotations) {
                                this.alignmentStats.push(annotSet.annotations);
                            }
                        }
                    })
                    .catch(response => {
                        console.error("An error occurred fetching clinicalAnalysis: ", response);
                    });
            }
        }
    }

    getDefaultConfig() {
        if (!this.clinicalAnalysis) {
            return;
        }

        if (this.clinicalAnalysis.type.toUpperCase() !== "CANCER") {
            return {
                title: "Quality Control Overview",
                sections: [
                    {
                        elements: [
                            {
                                id: "Summary",
                                title: "Summary"
                            },
                            {
                                id: "VariantStats",
                                title: "Variant Stats"
                            },
                            {
                                id: "InferredSex",
                                title: "Sex Inference"
                            },
                            {
                                id: "MendelianErrors",
                                title: "Mendelian Errors"
                            },
                            {
                                id: "Relatedness",
                                title: "Relatedness"
                            },
                            {
                                id: "SamtoolsPlots",
                                title: "Samtools Plots"
                            },
                            {
                                id: "Alignment",
                                title: "Samtools Stats",
                            },
                            {
                                id: "AlignmentStats",
                                title: "Samtools Flagstats",
                            },
                            /* {
                                id: "GeneCoverageStats",
                                title: "Gene Coverage Stats",
                            }*/
                        ]
                    }
                ]
            };
        } else {
            return {
                title: "Quality Control Overview",
                sections: [
                    {
                        elements: [
                            {
                                id: "Summary",
                                title: "Summary"
                            },
                            {
                                id: "VariantStats",
                                title: "Variant Stats"
                            },
                            {
                                id: "AscatMetrics",
                                title: "Ascat Metrics",
                            },
                            {
                                id: "SamtoolsPlots",
                                title: "Samtools Plots"
                            },
                            {
                                id: "Alignment",
                                title: "Samtools Stats",
                            },
                            {
                                id: "AlignmentStats",
                                title: "Samtools Flagstats",
                            },
                            {
                                id: "GenomicContext",
                                title: "Genomic Context (Signature)"
                            },
                            // {
                            //     id: "GeneCoverageStats",
                            //     title: "Gene Coverage Stats",
                            // }
                        ]
                    }
                ]
            };
        }
    }

    onSideNavClick(e) {
        e.preventDefault();
        // Remove button focus highlight
        e.currentTarget.blur();
        const tabId = e.currentTarget.dataset.id;
        $(".interpreter-side-nav > button", this).removeClass("active");
        $(`.interpreter-side-nav > button[data-id=${tabId}]`, this).addClass("active");
        $(".interpreter-content-tab > div[role=tabpanel]", this).hide();
        $("#" + this._prefix + tabId, this).show();
        // for (const tab in this.activeTab) this.activeTab[tab] = false;
        // this.activeTab[tabId] = true;
        this.requestUpdate();
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

        return html`
            <div class="row variant-interpreter-overview" style="padding: 10px 15px">
                <div class="col-md-2 list-group interpreter-side-nav side-tabs side-nav">
                    ${this._config.sections[0].elements.filter(field => !field.disabled).map((field, i) => {
                        return html`
                            <button type="button"
                                    class="list-group-item ${i === 0 ? "active" : ""}"
                                    data-id="${field.id}"
                                    @click="${this.onSideNavClick}">${field.title}
                            </button>
                        `;
                    })}
                </div>

                <div class="col-md-10">
                    <div class="content-tab-wrapper interpreter-content-tab" style="margin: 0px 10px">
                        <div id="${this._prefix}Summary" role="tabpanel" class="tab-pane content-tab active">
                            <h3>Summary</h3>
                            <variant-interpreter-qc-summary
                                .opencgaSession=${this.opencgaSession}
                                .clinicalAnalysis=${this.clinicalAnalysis}>
                            </variant-interpreter-qc-summary>
                        </div>

                        <div id="${this._prefix}VariantStats" role="tabpanel" class="tab-pane content-tab">
                            <h3>Sample Variant Stats</h3>
                            <sample-variant-stats-view
                                .sampleId="${this.sample?.id}"
                                .opencgaSession="${this.opencgaSession}">
                            </sample-variant-stats-view>
                        </div>

                        <div id="${this._prefix}InferredSex" role="tabpanel" class="tab-pane content-tab">
                            <h3>Inferred Sex</h3>
                            <variant-interpreter-qc-inferred-sex
                                .opencgaSession=${this.opencgaSession}
                                .clinicalAnalysis="${this.clinicalAnalysis}">
                            </variant-interpreter-qc-inferred-sex>
                        </div>

                        <div id="${this._prefix}MendelianErrors" role="tabpanel" class="tab-pane content-tab">
                            <h3>Mendelian Errors</h3>
                            <variant-interpreter-qc-mendelian-errors
                                .opencgaSession=${this.opencgaSession}
                                .clinicalAnalysis="${this.clinicalAnalysis}">
                            </variant-interpreter-qc-mendelian-errors>
                        </div>

                        <div id="${this._prefix}Relatedness" role="tabpanel" class="tab-pane content-tab">
                            <h3>Relatedness</h3>
                            <variant-interpreter-qc-relatedness
                                .opencgaSession=${this.opencgaSession}
                                .clinicalAnalysis="${this.clinicalAnalysis}">
                            </variant-interpreter-qc-relatedness>
                        </div>

                        <div id="${this._prefix}SamtoolsPlots" role="tabpanel" class="tab-pane content-tab">
                            <h3>Samtools Plots</h3>
                            <div style="padding: 15px">
                                <!-- Display Samtools plots for each BAM file -->
                                ${this.bamFiles?.filter(file => file.qualityControl?.alignment?.samtoolsStats?.files?.length > 0).map(bamFile => html`
                                    <div>
                                        <h4>${bamFile.name} <span class="badge">${bamFile.qualityControl.alignment.samtoolsStats.files.length}</span></h4>
                                    </div>
                                    <file-preview
                                        .fileIds="${bamFile.qualityControl.alignment.samtoolsStats.files}"
                                        .active="${true}"
                                        .opencgaSession=${this.opencgaSession}>
                                    </file-preview>
                                `)
                                }
                            </div>
                        </div>

                        <div id="${this._prefix}Alignment" role="tabpanel" class="tab-pane content-tab">
                            <h3>Samtools Stats</h3>
                            <div style="padding: 15px">
                                <samtools-stats-view
                                    .files="${this.bamFiles}">
                                </samtools-stats-view>
                            </div>
                        </div>

                        <div id="${this._prefix}AlignmentStats" role="tabpanel" class="tab-pane content-tab">
                            <h3>Samtools Flagstats</h3>
                            <div style="padding: 15px">
                                <samtools-flagstats-view
                                    .files="${this.bamFiles}">
                                </samtools-flagstats-view>
                            </div>
                        </div>

                        <div id="${this._prefix}AscatMetrics" role="tabpanel" class="tab-pane content-tab">
                            <file-qc-ascat-metrics
                                .opencgaSession=${this.opencgaSession}
                                .sampleId="${this.sample?.id}">
                            </file-qc-ascat-metrics>
                        </div>

                        <div id="${this._prefix}GenomicContext" role="tabpanel" class="tab-pane content-tab">
                            <h3>Genomic Context (Signature)</h3>
                            <variant-interpreter-qc-signature     .opencgaSession=${this.opencgaSession}
                                                                  .clinicalAnalysis="${this.clinicalAnalysis}">
                            </variant-interpreter-qc-signature>
                        </div>

                            <!--
                            <div id="${this._prefix}GeneCoverageStats" role="tabpanel" class="tab-pane content-tab">
                                <h3>Gene Coverage Stats</h3>
                                <variant-interpreter-qc-gene-coverage-stats  .opencgaSession=${this.opencgaSession}
                                                                             .clinicalAnalysis="${this.clinicalAnalysis}">
                                </variant-interpreter-qc-gene-coverage-stats>
                            </div>
                        -->
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("variant-interpreter-qc-overview", VariantInterpreterQcOverview);
