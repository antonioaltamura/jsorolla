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
import "./../commons/view/detail-tabs.js";
import "./sample-view.js";
import "./sample-variant-stats-view.js";
import "../alignment/qc/samtools-flagstats-view.js";

export default class SampleDetail extends LitElement {

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
            sample: {
                type: Object
            },
            sampleId: {
                type: String
            },
            config: {
                type: Object
            },
        };
    }

    _init() {
        this._config = this.getDefaultConfig();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.sample = null;
        }

        if (changedProperties.has("sampleId")) {
            this.sampleIdObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    sampleIdObserver() {
        if (this.opencgaSession && this.sampleId) {
            this.opencgaSession.opencgaClient.samples().info(this.sampleId, {
                study: this.opencgaSession.study.fqn,
                includeIndividual: true
            })
                .then(response => {
                    this.sample = response.getResult(0);
                })
                .catch(reason => {
                    console.error(reason);
                });

        }
    }

    render() {
        return this.opencgaSession && this.sample ?
            html`
                <detail-tabs
                    .data="${this.sample}"
                    .config="${this._config}"
                    .opencgaSession="${this.opencgaSession}">
                </detail-tabs>
            ` : null;
    }

    getDefaultConfig() {
        return {
            title: "Sample",
            showTitle: true,
            items: [
                {
                    id: "sample-view",
                    name: "Overview",
                    active: true,
                    render: (sample, active, opencgaSession) => {
                        return html`<sample-view .sample="${sample}" .opencgaSession="${opencgaSession}"></sample-view>`;
                    }
                },
                {
                    id: "sample-variant-stats-view",
                    name: "Variant Stats",
                    render: (sample, active, opencgaSession) => {
                        return html`<sample-variant-stats-view .sampleId="${sample.id}" .opencgaSession="${opencgaSession}"></sample-variant-stats-view>`;
                    }
                },
                {
                    id: "individual-view",
                    name: "Individual",
                    render: (sample, active, opencgaSession) => {
                        return html`<individual-view .individualId="${sample?.individualId}" .opencgaSession="${opencgaSession}"></individual-view>`;
                    }
                },
                {
                    id: "file-view",
                    name: "Files",
                    render: (sample, active, opencgaSession) => {
                        return html`<opencga-file-grid .opencgaSession="${opencgaSession}" .query="${{sampleIds: sample.id}}"></opencga-file-grid>`;
                    }
                }
            ]
        };
    }

}

customElements.define("sample-detail", SampleDetail);
