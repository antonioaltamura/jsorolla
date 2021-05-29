/**
 * Copyright 2015-2021 OpenCB
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

import {html, LitElement} from "/web_modules/lit-element.js";
import DetailTabs from "../commons/view/detail-tabs.js";
import "../cohort/opencga-cohort-view.js";
import "../cohort/cohort-create.js";
import "../cohort/cohort-update.js";
import "./../../utilsNew.js";

export default class StudyAdminCohort extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            studyId: {
                type: String
            },
            study: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.editCohort = false;
        this.cohortId = "";
        this.cohort = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        super.update(changedProperties);
    }

    editForm(e) {
        this.editCohort = !this.editCohort;
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    clearForm(e) {
        this.editCohort = false;
        this.fetchCohortId("");
    }

    changeCohortId(e) {
        this.fetchCohortId(e.detail.value);
    }

    fetchCohortId(cohortId) {
        if (this.opencgaSession) {
            if (cohortId) {
                const query = {
                    study: this.opencgaSession.study.fqn
                };
                this.opencgaSession.opencgaClient.cohorts().info(cohortId, query)
                    .then(response => {
                        this.cohort = response.responses[0].results[0];
                        console.log("Cohort id: ", this.cohort);
                    })
                    .catch(reason => {
                        this.cohort = {};
                        console.error(reason);
                    })
                    .finally(() => {
                        this._config = {...this.getDefaultConfig(), ...this.config};
                        this.requestUpdate();
                    });
            } else {
                this.cohort = {};
                this._config = {...this.getDefaultConfig(), ...this.config};
                this.requestUpdate();
            }
        }
    }

    onCohortSearch(e) {
        if (e.detail.status.error) {
            // inform
        } else {
            this.cohort = e.detail.value;
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }


    getDefaultConfig() {
        return {
            items: [
                {
                    id: "view-cohort",
                    name: "View Cohort",
                    active: true,
                    render: (study, active, opencgaSession) => {
                        return html`
                            <div class="row">
                                <div class="col-md-6" style="margin: 20px 10px">
                                    <div style="float: right">
                                        <span style="padding-right:5px">
                                            <i class="fas fa-times fa-lg" @click="${e => this.clearForm(e)}" ></i>
                                        </span>
                                        <span style="padding-left:5px">
                                            <i class="fa fa-edit fa-lg" @click="${e => this.editForm(e)}"></i>
                                        </span>
                                    </div>
                                    ${this.editCohort? html`
                                        <cohort-update
                                            .cohort="${this.cohort}"
                                            .opencgaSession="${opencgaSession}"
                                            @updateCohortId="${e => this.changeCohortId(e)}">
                                        </cohort-update>
                                    ` : html`
                                        <opencga-cohort-view
                                            .cohort="${this.cohort}"
                                            .opencgaSession="${opencgaSession}"
                                            @cohortSearch="${e => this.onCohortSearch(e)}">
                                        </opencga-cohort-view>`}
                                </div>
                            </div>`;
                    }
                },
                {
                    id: "create-cohort",
                    name: "Create Cohort",
                    render: (study, active, opencgaSession) => {
                        return html`
                            <div class="row">
                                <div class="col-md-6" style="margin: 20px 10px">
                                    <cohort-create
                                        .opencgaSession="${opencgaSession}">
                                    </cohort-create>
                                </div>
                            </div>`;
                    }
                }
            ]
        };
    }

    render() {
        return html`
            <div style="margin: 25px 40px">
                <detail-tabs
                        .config="${this._config}"
                        .mode="${DetailTabs.PILLS_MODE}"
                        .opencgaSession="${this.opencgaSession}">
                </detail-tabs>
            </div>`;
    }

}

customElements.define("study-admin-cohort", StudyAdminCohort);
