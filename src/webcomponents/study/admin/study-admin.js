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
import UtilsNew from "../../../core/utilsNew.js";
import "./study-admin-users.js";
import "./study-admin-permissions.js";
import "./study-admin-variable.js";
import "./study-admin-audit.js";
import "./study-admin-sample.js";
import "./study-admin-individual.js";
import "./study-admin-family.js";
import "./study-admin-cohort.js";
import "./study-admin-configuration.js";


export default class StudyAdmin extends LitElement {

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
        this._prefix = UtilsNew.randomString(8);
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("studyId") || changedProperties.has("opencgaSession")) {
            this.studyIdObserver();
        }
        super.update(changedProperties);
    }

    studyIdObserver() {
        for (const project of this.opencgaSession?.projects) {
            for (const study of project.studies) {
                if (study.id === this.studyId || study.fqn === this.studyId) {
                    this.study = study;
                    break;
                }
            }
        }
    }

    getDefaultConfig() {
        return {
            title: "Study Admin",
            icon: "variant_browser.svg",
            active: false
        };
    }

    onSideNavClick(e) {
        e.preventDefault();
        const tabId = e.currentTarget.dataset.id;

        // Set Active button
        $(".admin-side-navbar > ul > li", this).removeClass("active");
        $(`.admin-side-navbar > ul > li > a[data-id=${tabId}]`, this)[0].parentElement.classList.add("active");

        // Display the right content
        $(".admin-content-tab > div[role=tabpanel]", this).hide();
        $("#" + this._prefix + tabId, this).show();

        this.requestUpdate();
    }

    render() {
        return html`
            <style>

                .navbar.navbar-inverse.main-navbar{
                    position:fixed;
                    top:0;
                    width:100%;
                    z-index: 1000;
                }

                div.page-title {
                    position:fixed;
                    top:50px;
                    width:100%;
                    z-index:10
                }

                .row.left {
                    margin-left: -30px;
                    margin-top: -10px
                }

                /*Remove rounded coners*/
                nav.sidebar.navbar {
                    border-radius: 0px;
                    top:125px;
                }

                nav.sidebar, .main {
                    -webkit-transition: margin 200ms ease-out;
                    -moz-transition: margin 200ms ease-out;
                    -o-transition: margin 200ms ease-out;
                    transition: margin 200ms ease-out;
                }

                /* Add gap to nav and right windows.*/
                .main {
                    padding: 10px 10px 0 10px;
                }

                /* .....NavBar: Icon only with coloring/layout.....*/
                /*small/medium side display*/
                @media (min-width: 768px) {
                    /*Allow main to be next to Nav*/
                    .main{
                        width: calc(100% - 40px); /*keeps 100% minus nav size*/
                        margin-left: 40px;
                        float: right;
                    }

                    /*lets nav bar to be showed on mouseover*/
                    nav.sidebar:hover + .main{
                        margin-left: 200px;
                    }

                    /*Center Study Name*/
                    nav.sidebar.navbar.sidebar>.container .navbar-brand, .navbar>.container-fluid .navbar-brand {
                        margin-left: 0px;
                    }

                    /*Center Study Name*/
                    nav.sidebar .navbar-brand, nav.sidebar .navbar-header{
                        text-align: center;
                        width: 100%;
                        margin-left: 0px;
                    }

                    /*Center Icons*/
                    nav.sidebar a{
                        padding-right: 13px;
                    }

                    /*adds border top to first nav box */
                    nav.sidebar .navbar-nav.left > li:first-child{
                        border-top: 1px #e5e5e5 solid;
                    }

                    /* adds border to bottom nav boxes */
                    nav.sidebar .navbar-nav.left > li{
                        border-bottom: 0px #e5e5e5 solid;
                    }

                    /* Colors/style dropdown box*/
                    nav.sidebar .navbar-nav.left .open .dropdown-menu {
                        position: static;
                        float: none;
                        width: auto;
                        margin-top: 0;
                        background-color: transparent;
                        border: 0;
                        -webkit-box-shadow: none;
                        box-shadow: none;
                    }

                    /*allows nav box to use 100% width*/
                    nav.sidebar .navbar-collapse, nav.sidebar .container-fluid{
                        padding: 0 0px 0 0px;
                    }

                    /*colors dropdown box text */
                    .navbar-inverse .navbar-nav.left .open .dropdown-menu>li>a {
                        color: #777;
                    }

                    /*gives sidebar width/height*/
                    nav.sidebar{
                        position: fixed;
                        height: 100%;
                        width: 250px;
                        margin-left: -200px;
                        float: left;
                        /* z-index: 8000; */
                        margin-bottom: 0px;
                        overflow-y:auto;
                        padding-bottom:10%
                    }

                    /*give sidebar 100% width;*/
                    nav.sidebar li {
                        width: 100%;
                    }

                    /* Move nav to full on mouse over*/
                    nav.sidebar:hover{
                        margin-left: 0px;
                    }
                    /*for hiden things when navbar hidden*/
                    .forAnimate{
                        opacity: 0;
                    }
                }

                /* .....NavBar: Fully showing nav bar..... */
                @media (min-width: 1330px) {

                    /*Allow main to be next to Nav*/
                    .main{
                        width: calc(100% - 200px); /*keeps 100% minus nav size*/
                        margin-left: 200px;
                    }

                    /*Show all nav*/
                    nav.sidebar{
                        margin-left: 0px;
                        float: left;
                    }
                    /*Show hidden items on nav*/
                    nav.sidebar .forAnimate{
                        opacity: 1;
                    }
                }

                nav.sidebar .navbar-nav.left .open .dropdown-menu>li>a:hover,
                nav.sidebar .navbar-nav.left .open .dropdown-menu>li>a:focus {
                    color: #CCC;
                    background-color: transparent;
                }

                nav:hover .forAnimate{
                    opacity: 1;
                }

                section{
                    padding-left: 15px;
                }

                .footer {
                    position: fixed;
                    bottom: 0px;
                    z-index: 10;
                }

            </style>

            <div class="row left">
                <div class="col-md-2">
                    <!-- Navigation -->
                    <nav class="navbar navbar-inverse sidebar" role="navigation">
                        <!-- Brand and toggle get grouped for better mobile display -->
                        <div class="navbar-header">
                            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-sidebar-navbar-collapse-1">
                                <span class="sr-only">Toggle navigation</span>
                                <span class="icon-bar"></span>
                                <span class="icon-bar"></span>
                                <span class="icon-bar"></span>
                            </button>
                            <a class="navbar-brand">${this.study?.name}</a>
                        </div>

                        <!-- Collect the nav links, form, and other content for toggling -->
                        <div class="collapse navbar-collapse navbar-ex1-collapse admin-side-navbar">
                            <ul class="nav navbar-nav left">
                                <li>
                                    <p class="navbar-text">Study Administration</p>
                                </li>
                                <li>
                                    <a data-id="Dashboard" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Dashboard
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-tachometer-alt"></i></span>
                                    </a>
                                </li>
                                <li class="active">
                                    <a data-id="UsersAndGroups" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Users and Groups
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-user-friends"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="Permissions" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Permissions
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-key"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="VaribleSets" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Variable Sets
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-book"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="Audit" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Audit
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-book"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="Configuration" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Configuration
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-cog"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <p class="navbar-text">Data Management</p>
                                </li>
                                <li>
                                    <a data-id="Sample" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Sample
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-vial"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="Individual" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Individual
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-user"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="Family" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Family
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-users"></i></span>
                                    </a>
                                </li>
                                <li>
                                    <a data-id="Cohort" style="margin: 0px 5px; cursor: pointer" @click="${this.onSideNavClick}">Cohort
                                        <span class="pull-right" style="font-size: 16px"><i class="fas fa-bezier-curve"></i></span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>

                <div class="col-md-10" style="top:150px;">
                    <!-- Content Module  -->
                    <div class="content-tab-wrapper admin-content-tab" style="margin: 0px 20px">
                        <div id="${this._prefix}Dashboard" role="tabpanel" class="tab-pane content-tab">
                            <div class="guard-page">
                                <i class="fas fa-pencil-ruler fa-5x"></i>
                                <h3>Component under construction</h3>
                                <h3>(Coming Soon)</h3>
                            </div>;
                        </div>

                        <div id="${this._prefix}UsersAndGroups" role="tabpanel" class="tab-pane content-tab active">
                            <h2><i class="fas fa-user-friends icon-padding" style="padding-right: 10px"></i>Users And Groups</h2>
                            <study-admin-users .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-users>
                        </div>

                        <div id="${this._prefix}Permissions" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-key icon-padding" style="padding-right: 10px"></i>Permissions</h2>
                            <study-admin-permissions .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-permissions>
                        </div>

                        <div id="${this._prefix}VaribleSets" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-code icon-padding" style="padding-right: 10px"></i>Variable Sets</h2>
                            <study-admin-variable .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-variable>
                        </div>

                        <div id="${this._prefix}Audit" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-book icon-padding" style="padding-right: 10px"></i>Audit</h2>
                            <study-admin-audit .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-audit>
                        </div>

                        <div id="${this._prefix}Configuration" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-cog icon-padding" style="padding-right: 10px"></i>Configuration (Coming Soon)</h2>
                            <study-admin-configuration .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-configuration>
                        </div>

                        <div id="${this._prefix}Sample" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-vial icon-padding" style="padding-right: 10px"></i>Sample</h2>
                            <study-admin-sample .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-sample>
                        </div>

                        <div id="${this._prefix}Individual" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-user icon-padding" style="padding-right: 10px"></i>Individual</h2>
                            <study-admin-individual .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-individual>
                        </div>

                        <div id="${this._prefix}Family" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-users icon-padding" style="padding-right: 10px"></i>Family</h2>
                            <study-admin-family .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-family>
                        </div>

                        <div id="${this._prefix}Cohort" role="tabpanel" class="tab-pane content-tab">
                            <h2><i class="fas fa-bezier-curve icon-padding" style="padding-right: 10px"></i>Cohort</h2>
                            <study-admin-cohort .opencgaSession="${this.opencgaSession}" .study="${this.study}"></study-admin-cohort>
                        </div>
                    </div>
                </div>
            </div>`;
    }

}

customElements.define("study-admin", StudyAdmin);
