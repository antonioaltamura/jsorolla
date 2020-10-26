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


export default class OpencgaCohortView extends LitElement {

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
            cohortId: {
                type: String
            },
            cohort: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        // this.prefix = "osv" + UtilsNew.randomString(6);
        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }


    firstUpdated(_changedProperties) {
    }

    updated(changedProperties) {
        if (changedProperties.has("cohortId")) {
            this.cohortIdObserver();
        }
        if (changedProperties.has("cohort")) {
            this.cohortObserver();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }
    }

    configObserver() {
    }

    // TODO recheck
    cohortIdObserver() {
        console.warn("cohortIdObserver");
        if (this.file !== undefined && this.file !== "") {
            const params = {
                study: this.opencgaSession.study.fqn,
                includeIndividual: true
            };
            const _this = this;
            this.opencgaSession.opencgaClient.cohort().info(this.file, params)
                .then(function(response) {
                    if (response.response[0].id === undefined) {
                        response.response[0].id = response.response[0].name;
                    }
                    _this.cohort = response.response[0].result[0];
                    console.log("_this.cohort", _this.cohort);
                    _this.requestUpdate();
                })
                .catch(function(reason) {
                    console.error(reason);
                });
        }

    }

    cohortObserver() {
        console.log("cohortObserver");

    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            display: {
                collapsable: true,
                showTitle: false,
                labelWidth: 2,
                defaultValue: "-",
                labelAlign: "left"
            },
            sections: [
                {
                    title: "General",
                    collapsed: false,
                    elements: [
                        // available types: basic (optional/default), complex, list (horizontal and vertical), table, plot, custom
                        {
                            name: "Cohort Id",
                            field: "id"
                        },
                        {
                            name: "Creation date",
                            field: "creationDate",
                            type: "custom",
                            display: {
                                render: field => {
                                    return html`${UtilsNew.dateFormatter(field)}`;
                                }
                            }
                        }
                    ]
                }
            ]
        };
    }

    render() {
        return html`
            <data-form .data=${this.cohort} .config="${this.getDefaultConfig()}"></data-form>
        `;
    }

}

customElements.define("opencga-cohort-view", OpencgaCohortView);

