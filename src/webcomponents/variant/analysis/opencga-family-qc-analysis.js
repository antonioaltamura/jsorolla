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
import UtilsNew from "./../../../core/utilsNew.js";
import "../../commons/analysis/opencga-analysis-tool.js";


export default class OpencgaFamilyQcAnalysis extends LitElement {

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
        this._prefix = "oga-" + UtilsNew.randomString(6);

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
            id: "family-qc",
            title: "Family Quality Control",
            icon: "",
            requires: "2.0.0",
            description: "Run quality control (QC) for a given family. It computes the relatedness scores among the family members",
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
                                id: "family",
                                title: "Select family",
                                type: "FAMILY_FILTER",
                                addButton: true,
                                showList: true,
                                fileUpload: true
                            }
                        ]
                    },
                    {
                        title: "Configuration Parameters",
                        collapsed: false,
                        parameters: [
                            {
                                id: "relatednessMethod",
                                title: "Relatedness method",
                                type: "text"
                            },
                            {
                                id: "relatednessMaf",
                                title: "Relatedness Maf",
                                type: "text"
                            }
                        ]
                    }
                ],
                job: {
                    title: "Job Info",
                    id: "family-qc-$DATE",
                    tags: "",
                    description: "",
                    validation: function(params) {
                        alert("test:" + params);
                    },
                    button: "Run"
                }
            },
            execute: (opencgaSession, data, params) => {
                let body = {};
                data.family ? body.family = data.family.join(",") : null;
                data.relatednessMaf ? body.relatednessMaf = data.relatednessMaf[0] : null;
                opencgaSession.opencgaClient.variants().runFamilyQc(body, params);
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

customElements.define("opencga-family-qc-analysis", OpencgaFamilyQcAnalysis);
