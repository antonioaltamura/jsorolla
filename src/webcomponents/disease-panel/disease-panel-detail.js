/**
 * Copyright 2015-2022 OpenCB
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
import "../commons/view/detail-tabs.js";
import "./disease-panel-summary.js";
import {construction} from "../commons/under-construction.js";

export default class DiseasePanelDetail extends LitElement {

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
            diseasePanel: {
                type: Object
            },
            diseasePanelId: {
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

        if (changedProperties.has("diseasePanelId")) {
            this.diseasePanelIdObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    diseasePanelIdObserver() {
        if (this.opencgaSession && this.diseasePanelId) {
            this.opencgaSession.opencgaClient.panels().info(this.diseasePanelId, {
                study: this.opencgaSession.study.fqn,
            })
                .then(response => {
                    this.diseasePanel = response.getResult(0);
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    render() {
        return this.opencgaSession && this.diseasePanel ?
            html`
                <detail-tabs
                    .data="${this.diseasePanel}"
                    .config="${this._config}"
                    .opencgaSession="${this.opencgaSession}">
                </detail-tabs>
            ` : nothing;
    }

    getDefaultConfig() {
        return {
            title: "Disease Panel",
            showTitle: true,
            items: [
                {
                    id: "disease-panel-view",
                    name: "Overview",
                    active: true,
                    render: (diseasePanel, active, opencgaSession) => {
                        return html`
                            <disease-panel-summary
                                .diseasePanel="${diseasePanel}"
                                .opencgaSession="${opencgaSession}">
                            </disease-panel-summary>`;
                    }
                },
                {
                    id: "disease-panel-genes",
                    name: "Genes",
                    render: (diseasePanel, active, opencgaSession) => {
                        return html`
                            <gene-grid
                                .genePanels="${diseasePanel.genes}"
                                .opencgaSession=${opencgaSession}>
                            </gene-grid>`;
                    }
                },
                {
                    id: "disease-panel-regions",
                    name: "Regions",
                    render: (diseasePanel, active, opencgaSession) => construction
                },
                {
                    id: "disease-panel-variants",
                    name: "Variants",
                    render: (diseasePanel, active, opencgaSession) => construction
                },
                {
                    id: "json-view",
                    name: "JSON Data",
                    mode: "development",
                    render: (diseasePanel, active, opencgaSession) => {
                        return html`
                            <json-viewer
                                .data="${diseasePanel}"
                                .active="${active}">
                            </json-viewer>`;
                    }
                }
            ]
        };
    }

}

customElements.define("disease-panel-detail", DiseasePanelDetail);
