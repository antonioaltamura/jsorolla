/* select
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
import UtilsNew from "./../../../core/utilsNew.js";
import "../../commons/analysis/opencga-analysis-tool.js";


export default class OpencgaRdTieringAnalysis extends LitElement {

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
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "ota-" + UtilsNew.randomString(6);

        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    updated(changedProperties) {
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    getDefaultConfig() {
        return {
            id: "rd-tiering",
            title: "RD Tiering",
            icon: "",
            requires: "2.0.0",
            description: "Tiering GEL-based",
            links: [
                {
                    title: "OpenCGA",
                    url: "http://docs.opencb.org/display/opencga/Genome-Wide+Association+Study",
                    icon: ""
                }
            ],
            form: {
                sections: [
                    {
                        title: "Input Parameters",
                        collapsed: false,
                        parameters: [
                            {
                                id: "clinicalAnalysis",
                                title: "Clinical Analysis",
                                type: "CLINICAL_ANALYSIS_FILTER",
                                showList: true
                            }
                        ]
                    },
                    {
                        title: "Configuration Parameters",
                        collapsed: false,
                        parameters: [
                            {
                                id: "panels",
                                title: "Select disease panels",
                                type: "DISEASE_PANEL_FILTER",
                                showList: true
                            },
                            {
                                id: "penetrance",
                                title: "Select penetrance",
                                type: "category",
                                defaultValue: "UNKNOWN",
                                allowedValues: ["COMPLETE", "INCOMPLETE", "UNKNOWN"],
                                multiple: false,
                            },
                            {
                                id: "secondary",
                                title: "Save as secondary",
                                type: "boolean",
                            },
                            {
                                id: "index",
                                title: "Index result",
                                type: "boolean",
                            }
                        ]
                    }
                ],
                job: {
                    title: "Job Info",
                    id: "rd-tiering-$DATE",
                    tags: "",
                    description: "",
                    validation: function(params) {
                        alert("test:" + params);
                    },
                    button: "Run"
                }
            },
            execute: (opencgaSession, data, params) => {
                opencgaSession.opencgaClient.clinical().runTiering(data, params);
            },
            result: {
            }
        };
    }

    render() {
        return html`
           <opencga-analysis-tool .opencgaSession="${this.opencgaSession}" .config="${this._config}" ></opencga-analysis-tool>
        `;
    }
}

customElements.define("opencga-rd-tiering-analysis", OpencgaRdTieringAnalysis);
