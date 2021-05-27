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

import {html, LitElement} from "/web_modules/lit-element.js";
import UtilsNew from "./../../utilsNew.js";
import IndividualCreate from "../individual/individual-create.js";
import DetailTabs from "../commons/view/detail-tabs.js";
import {construction} from "../commons/under-construction.js";

export default class StudyAdminIndividual extends LitElement {

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
        this.editIndividual = false;
        this.individualId = "";
        this.individual = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        super.update(changedProperties);
    }

    editForm(e) {
        this.editIndividual = !this.editIndividual;
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    clearForm(e) {
        this.editForm = false;
        this.fetchIndividualId("");
    }

    changeIndividualId(e) {
        this.fetchIndividualId(e.detail.value);
    }

    fetchIndividualId(individualId) {
        if (this.opencgaSession) {
            if (individualId) {
                const query = {
                    study: this.opencgaSession.study.fqn
                };
                this.opencgaSession.opencgaClient.samples().info(individualId, query)
                    .then(response => {
                        this.individual = response.responses[0].results[0];
                    })
                    .catch(reason => {
                        this.individual = {};
                        console.error(reason);
                    })
                    .finally(() => {
                        this._config = {...this.getDefaultConfig(), ...this.config};
                        this.requestUpdate();
                    });
            } else {
                this.individual = {};
                this._config = {...this.getDefaultConfig(), ...this.config};
                this.requestUpdate();
            }
        }
    }

    onIndividualSearch(e) {
        if (e.detail.status.error) {
            // inform
        } else {
            this.individual = e.detail.value;
            this._config = {...this.getDefaultConfig(), ...this.config};
            this.requestUpdate();
        }
    }

    getDefaultConfig() {
        return {
            items: [
                {
                    id: "view-individual",
                    name: "Individual Info",
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
                                    ${this.editIndividual? html`
                                        <individual-update
                                            .individual="${this.individualId}"
                                            .opencgaSession="${opencgaSession}">
                                        </individual-update>
                                    ` : html`
                                        <opencga-individual-view
                                            .individual="${this.individual}"
                                            .opencgaSession="${opencgaSession}"
                                            @individualSearch="${e => this.onIndividualSearch(e)}">
                                        </opencga-individual-view>`}
                                </div>
                            </div>`;
                    }
                },
                {
                    id: "create-individual",
                    name: "Create Individual",
                    // icon: "fas fa-dna",
                    // active: false,
                    render: (study, active, opencgaSession) => {
                        return html`
                            <div class="row">
                                <div class="col-md-6" style="margin: 20px 10px">
                                    <individual-create
                                            .opencgaSession="${opencgaSession}">
                                    </individual-create>
                                </div>
                            </div>`;
                    }
                }
            ]
        };
    }

    //  TODO: Move for a new component as modal form
    actionModal(modalId, action, individual = {}, mode = "CREATE") {
        // action: show or hide
        // mode: CREATE or UPDATE
        this.mode = mode;
        if (individual && mode === "UPDATE") {
            this.individual = individual;
        } else {
            this.individual = {};
        }
        this.requestUpdate();
        $(`#${modalId}`).modal(action);
    }

    //  TODO: Move for a new component as modal form
    renderModal(modalId, name) {
        return html`
            <div id="${modalId}" class="modal fade" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">New ${name}</h4>
                        </div>
                        <div class="modal-body">
                            <individual-form
                                .opencgaSession="${this.opencgaSession}"
                                @hide="${() => this.actionModal(modalId, "hide")}">
                            </individual-form>
                        </div>
                    </div>
                </div>
            </div>`;
    }


    render() {
        return html`
            <div style="margin: 25px 40px">
                <detail-tabs
                    .config=${this._config}
                    .mode=${DetailTabs.PILLS_MODE}
                    .opencgaSession=${this.opencgaSession}>
                </detail-tabs>
            </div>

            <!-- TODO: Move for a new component as modal form -->
            <!-- <div class="pull-right" style="margin: 10px 0px">
                <div style="display:inline-block; margin: 0px 20px">
                    <button class="btn-custom btn btn-primary"
                        @click="\${() => this.actionModal('newIndividual', "show")}">New Individual
                    </button>
                </div>
            </div> -->
            <!-- \${this.renderModal('newIndividual', 'individual')} -->
        `;
    }

}

customElements.define("study-admin-individual", StudyAdminIndividual);
