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
import UtilsNew from "../../core/utilsNew.js";
import OpencgaCatalogUtils from "../../core/clients/opencga/opencga-catalog-utils.js";
import "../commons/tool-header.js";
import "../study/study-form.js";
import "./project-form.js";

export default class ProjectsAdmin extends LitElement {

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
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.owners = OpencgaCatalogUtils.getProjectOwners(this.opencgaSession.projects);
        }
        super.update(changedProperties);
    }

    getDefaultConfig() {
        return {
            title: "Study Dashboard",
            icon: "img/tools/icons/variant_browser.svg",
            active: false
        };
    }

    actionModal(modalId, action, project = {}, mode = "CREATE") {
        // action: show or hide
        // mode: CREATE or UPDATE
        if (modalId === "Project") {
            this.mode = mode;
            if (project && mode === "UPDATE") {
                this.project = project;
            } else {
                this.project = {};
            }
        } else {
            // This for new Study
            this.project = project;
        }
        this.requestUpdate();
        $(`#new${modalId}`).modal(action);
    }

    renderVerticalDotAction(user, project) {
        const isAdmin = OpencgaCatalogUtils.checkUserAccountView(user, this.opencgaSession?.user?.id);
        return html`
            <div style="float: right; padding:10px">
                <div class="dropdown">
                    <a id="dLabel" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-ellipsis-v fa-lg" style="color:#fff"></i>
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="dLabel" role="menu">
                        <li class="${!isAdmin ? "disabled" : "item-pointer"}">
                            <a @click="${() => this.actionModal("Study", "show", project)}">
                                <i class="fas fa-file icon-padding"></i> New Study
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li class="${!isAdmin ? "disabled" : "item-pointer"}">
                            <a @click="${() => this.actionModal("Project", "show", project, "UPDATE")}">
                                <i class="fas fa-edit icon-padding"></i>Edit
                            </a>
                        </li>
                        <li class="${!isAdmin ? "disabled" : "item-pointer"}">
                            <a><i class="fas fa-copy icon-padding"></i> Duplicate</a>
                        </li>
                        <li class="${!isAdmin ? "disabled" : "item-pointer"}">
                            <a><i class="fas fa-trash icon-padding"></i> Delete</a>
                        </li>
                    </ul>
                </div>
            </div>`;
    }

    // Project and Studies Style (OLD)
    renderProjectAndStudies(project) {
        return html`
            <div class="col-md-4">
                <div class="panel panel-default shadow">
                    <div class="panel-body text-center">
                        <!-- Vertical dots   -->
                        <!-- {this.renderVerticalDotAction()} -->
                        <h4>${project.name}</h4>
                        <div>
                            ${project.description ? html`
                                <span>${project.description}</span>
                            ` : html`
                                <span style="font-style: italic">No description available</span>`
                            }
                        </div>
                        <div>
                            <span>${project.organism.scientificName} ${project.organism.assembly}</span>
                        </div>
                        <div>
                            <span>${project.fqn}</span>
                        </div>
                        <div>
                            <span>Created on ${UtilsNew.dateFormatter(project.creationDate)}</span>
                        </div>
                    </div>
                </div>

                <div class="row" style="padding: 5px 10px">
                    ${project.studies.map(study => html`
                        <div class="col-md-6">
                            <!-- TODO: Pass Info Study to the Study admin -->
                            <a href="#study-admin/${study.fqn}">
                                <div class="panel panel-default shadow-sm">
                                    <div class="panel-body text-center" style="color: black">
                                        <div>
                                            <h4>${study.name}</h4>
                                        </div>
                                        <div>
                                            <span class="help-text">${study.description || "No description available"}</span>
                                        </div>
                                        <div>
                                            <span>${study.fqn}</span>
                                        </div>
                                        <div>
                                            <span>Created on ${UtilsNew.dateFormatter(study.creationDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>`
                    )}
                </div>
            </div>
        `;
    }

    // Project and Studies Style Alternative
    renderProjectAndStudiesAlt(project, user) {
        return html`
            <style>
                .panel-body.project{
                    padding-top:0px;
                    padding-bottom:0px;
                }

                .border-dotted-right {
                    border:2px solid #000;
                    outline: 1px dashed #fff;
                    outline-offset: -1px;
                    background-color:var(--main-bg-color);
                    height:220px;
                    color:#fff;
                    padding: 0px;
                }
                /* This to has the same height all studies.. */
                .panel-body.studies {
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis; /*TODO: fix, this style not working*/
                }
            </style>

            <div class="row project">
                <div class="panel panel-default shadow">
                    <div class="panel-body project">
                        <div class="row">
                            <div class="col-md-2 border-dotted-right">
                                <!-- Vertical dots   -->
                                ${this.renderVerticalDotAction(user, project)}
                                <h3 style="margin:5px">Project</h3>
                                <div class="text-block text-center" style="padding-top: 5px;">
                                    <h4>${project.name}</h4>
                                    <div>
                                        ${project.description ? html`
                                            <span>${project.description}</span>
                                        ` : html`
                                            <span style="font-style: italic">No description available</span>`
                                        }
                                    </div>
                                    <div>
                                        <span>${project.organism.scientificName} ${project.organism.assembly}</span>
                                    </div>
                                    <div>
                                        <span>${project.fqn}</span>
                                    </div>
                                    <div>
                                        <span>Created on ${UtilsNew.dateFormatter(project.creationDate)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-10">
                                <h4 style="margin:10px;margin-bottom:15px">Studies</h4>
                                <!-- Show Study by project -->
                                ${project.studies.map(study => this.renderStudy(study))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    renderStudy(study) {
        return html`
            <div class="col-md-3">
                <!-- TODO: Pass Info Study to the Study admin -->
                <a href="#study-admin/${study.fqn}">
                    <div class="panel panel-default child shadow-sm">
                        <div class="panel-body studies" style="color: black">
                            ${this.opencgaSession.study.fqn === study.fqn ?
                html`<span class="label label-success pull-right">Current</span>` : ""}
                            <div class="text-block text-center"  style="padding-top:10px;">
                                <div>
                                    <h4>${study.name}</h4>
                                </div>
                                <div>
                                    <span class="help-text">${study.description || "No description available"}</span>
                                </div>
                                <div>
                                    <span>${study.fqn}</span>
                                </div>
                                <div>
                                    <span>Created on ${UtilsNew.dateFormatter(study.creationDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            </div>`;
    }


    renderModal(id, name, type) {
        const modalType = {
            "project": html`
                <project-form
                        .opencgaSession="${this.opencgaSession}"
                        .project=${this.project}
                        .mode=${this.mode}
                        @hide="${() => this.actionModal("Project", "hide")}">
                </project-form>`,

            "study": html`
                <study-form
                        .opencgaSession="${this.opencgaSession}"
                        .project=${this.project}
                        .mode=${this.mode}
                        @hide="${() => this.actionModal("Study", "hide")}">
                </study-form>`,
        };
        return html`
            <div id="${id}" class="modal fade" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">New ${name}</h4>
                        </div>
                        <div class="modal-body">
                            ${modalType[type]}
                        </div>
                    </div>
                </div>
            </div>`;
    }


    render() {
        // Check if there is any project available
        if (!this.opencgaSession?.study) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>`;
        }

        return html`
            <style>
                .panel.panel-default.child:hover {
                    background-color: #eee;
                }

                .panel-body.text-center .text-name {
                    font-size: 16px
                }

                .btn.outline {
                    border: 1px solid black;
                    background-color: white;
                    color: black;
                    padding: 14px 28px;
                    font-size: 16px;
                    cursor: pointer;
                }

                .btn.outline.child {
                    height:85px
                }

                .outline.primary {
                    border-color:#286090;
                    color: #286090;
                }

                .primary:hover {
                    background: #286090;
                    color: white;
                }

                .btn-custom {
                    margin-top:20px
                }

                @media (min-width:992px){
                    .row.auto-clear .col-md-4:nth-child(3n+1){clear:left;}
                }
                /* Move to global.css */
                /* This prevent to execute a onClick event. */
                .disabled:active{
                    pointer-events:none
                }

                .item-pointer > a{
                    cursor:pointer
                }
            </style>

            <div>
                <!-- Show Project by User-->
                ${this.owners.map(owner => {
            return html`
                        <div class="row" style="border-bottom: rgba(201, 76, 76, 0.7);}">
                            <div class="col-md-6">
                                <h2><i class="fas fa-user fa-sm" style="padding-right: 10px"></i>${owner}</h2>
                            </div>
                            <div class="col-md-6">
                                <div class="pull-right">
                                    <button class="btn-custom btn btn-primary"
                                        ?disabled=${!OpencgaCatalogUtils.checkUserAccountView(owner, this.opencgaSession?.user?.id)}
                                        @click="${() => this.actionModal("Project", "show")}">New Project
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="row auto-clear">
                            <!-- <div class="col-md-12">
                                <h3>Projects and Studies</h3>
                            </div> -->
                            <div class="clearfix"></div>
                            <!-- Show Project and Studies -->
                            <div class="col-md-12">
                                ${this.opencgaSession.projects.filter(proj => proj.fqn.startsWith(owner + "@")).map(project => this.renderProjectAndStudiesAlt(project, owner))}
                            </div>
                        </div>`;
        })}
            </div>

            <!-- TODO: These modals can be a single one, the component will be rendered according to whether you have selected: study or project inside div. modal-body -->
            <!-- Modal New Project , Modal New Study -->
            ${this.renderModal("newProject", "Project", "project")}
            ${this.renderModal("newStudy", "Study", "study")}
        `;
    }

}
customElements.define("projects-admin", ProjectsAdmin);
