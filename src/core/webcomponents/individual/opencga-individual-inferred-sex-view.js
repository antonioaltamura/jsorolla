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
import UtilsNew from "../../utilsNew.js";
import "../commons/view/data-form.js";


export default class OpencgaIndividualInferredSexView extends LitElement {

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
            individualId: {
                type: String
            },
            individual: {
                type: Object
            },
            individuals: {
                type: Array
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("individuals")) {
        }

        if (changedProperties.has("individualId")) {
            this.individualIdObserver();
        }
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    onDownload(e) {
        let dataString = [];
        let mimeType = "";
        let extension = "";
        // Check if user clicked in Tab or JSON format
        if (e.currentTarget.dataset.downloadOption.toLowerCase() === "tab") {

            const data = this.individuals.map(individual => {
                let inferredSex = individual?.qualityControl?.inferredSexReports[0];
                return [
                    individual.id,
                    individual?.qualityControl?.sampleId ?? "N/A",
                    individual.karyotypicSex,
                    ...(inferredSex ?
                        [
                            inferredSex.values.ratioX.toFixed(4),
                            inferredSex.values.ratioY.toFixed(4),
                            inferredSex.inferredKaryotypicSex ?? "-",
                            inferredSex.method
                        ] : ["-", "-", "-", "-"])
                ].join("\t")
            });

            dataString = [
                ["Individual ID", "Sample ID", "Sex", "Reported Phenotypic Sex", "Reported Karyotypic Sex", "Ratio (avg. chrX/auto)", "Ratio (avg. chrY/auto)", "Inferred Karyotypic Sex", "Method"].join("\t"),
                data.join("\n")
            ];
            //console.log(dataString);
            mimeType = "text/plain";
            extension = ".txt";
        } else {
            /*for (const res of result) {
                dataString.push(JSON.stringify(res, null, "\t"));
            }
            mimeType = "application/json";
            extension = ".json";*/
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
    }

    individualIdObserver() {
        if (this.opencgaSession && this.individualId) {
            this.opencgaSession.opencgaClient.individuals().info(this.individualId, {study: this.opencgaSession.study.fqn})
                .then( response => {
                    this.individuals = response.responses[0].results;
                    this.requestUpdate();
                })
                .catch(function(reason) {
                    console.error(reason);
                });
        }
    }

    renderTable() {
        if (this.individuals && Array.isArray(this.individuals)) {
            // let _cellPadding = "padding: 0px 15px";
            return html`
                <table class="table table-hover table-no-bordered text-center">
                    <thead>
                        <tr>
                            <th>Individual ID</th>
                            <th>Sample ID</th>
                            <th>Reported Phenotypic Sex</th>
                            <th>Reported Karyotypic Sex</th>
                            <th>Ratio (avg. chrX/auto)</th>
                            <th>Ratio (avg. chrY/auto)</th>
                            <th>Inferred Karyotypic Sex</th>
                            <th>Method</th>
                            <!-- <th>Status</th> -->
                        </tr>
                    </thead>
                    <tbody>
                        ${this.individuals.map(individual => {
                            let inferredSex = individual?.qualityControl?.inferredSexReports[0];
                            return html`
                                <tr>
                                    <td>
                                        <label>${individual.id}</label>
                                    </td>
                                    <td>${individual?.qualityControl?.sample ?? "N/A"}</td>
                                    <td>${individual.sex}</td>       
                                    <td>
                                        <span style="color: ${!inferredSex || individual.karyotypicSex === inferredSex?.inferredKaryotypicSex ? "black" : "red"}">
                                            ${individual.karyotypicSex}
                                        </span>
                                    </td>
                                    ${inferredSex ? html`
                                        <td>${inferredSex.values.ratioX.toFixed(4)}</td>
                                        <td>${inferredSex.values.ratioY.toFixed(4)}</td>
                                        <td>
                                            <span style="color: ${individual.karyotypicSex === inferredSex.inferredKaryotypicSex ? "black" : "red"}">
                                                ${inferredSex.inferredKaryotypicSex || "-"}
                                            </span>
                                        </td>
                                        <td>${inferredSex.method}</td>
                                        <!--
                                            <td>
                                                <span>${individual.karyotypicSex === inferredSex.inferredKaryotypicSex
                                                    ? html`<i class='fa fa-check' style='color: green'></i>`
                                                    : html`<i class='fa fa-times' style='color: red'></i>`
                                                }
                                                </span>
                                            </td>
                                        -->
                                    ` : html`
                                        <td colspan="4"><div class="alert-warning text-center"><i class="fas fa-info-circle align-middle"></i> Inferred Sex data not available.</div></td>
                                    `}
                                </tr>
                            `})
                        }
                    </tbody>
                </table>`;
        }
    }

    getDefaultConfig() {
        return {
            download: ["Tab", "JSON"]
        }
    }

    render() {
        if (!this.individual && !this.individuals.length) {
            return html`<div class="alert alert-info"><i class="fas fa-3x fa-info-circle align-middle"></i> No QC data are available yet.</div>`;
        }

        return html`
            <div>
                <div class="btn-group pull-right">
                    <button type="button" class="btn btn-default ripple btn-sm dropdown-toggle" data-toggle="dropdown"
                            aria-haspopup="true" aria-expanded="false">
                        <i class="fa fa-download" aria-hidden="true" style="padding-right: 5px"></i> Download <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu btn-sm">
                        ${this._config?.download && this._config?.download?.length ? this._config.download.map(item => html`
                                <li><a href="javascript:;" data-download-option="${item}" @click="${this.onDownload}">${item}</a></li>
                        `) : null}
                    </ul>
                </div>
                
                <div style="margin: 20px 10px">
                    ${this.renderTable()}
                </div>
            </div>
        `;
    }

}

customElements.define("opencga-individual-inferred-sex-view", OpencgaIndividualInferredSexView);
