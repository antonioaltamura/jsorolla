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
/*

<link rel="import" href="opencga-individual-filter.html">
    <link rel="import" href="opencga-individual-grid.html">
    <link rel="import" href="../../opencga-active-filters.html">
    <link rel="import" href="../variableSets/opencga-annotation-comparator.html">
    <link rel="import" href="../../commons/opencga-facet-view.html">
*/


export default class OpencgaIndividualBrowser extends LitElement {

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
            opencgaClient: {
                type: Object
            },
            filters: {
                type: Object,
                notify: true
            },
            search: {
                type: Object,
                notify: true
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "osb-" + Utils.randomString(6);
        this.individuals = [];
        this._config = this.getDefaultConfig();
        this.filtersConfig = {
            complexFields: ["annotation"]
        };
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaClient")) {
            this.renderAnalysisTable();
        }
        if (changedProperties.has("filters")) {
            this.onFilterUpdate();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }
    }

    /*    static get observers() {
        return ['filterAvailableVariableSets(opencgaSession, config)', 'individualObserver(individuals.*)'];
    }*/

    firstUpdated(_changedProperties) {
        this.activeMenu = {
            table: true,
            comparator: false
        };

        this.detailActiveTabs = {
            info: true,
            familyGrid: false
        };
    }

    configObserver() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);
    }

    individualObserver() {
        this.dispatchEvent(new CustomEvent("individualchange", {
            detail: {
                individuals: this.individuals
            },
            bubbles: true, composed: true
        }));
    }

    onClear() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);
        this.query = {};
        // this.query = {studies: this.opencgaSession.project.alias + ":" + this.opencgaSession.study.alias};
        this.search = {};
    }

    onActiveFilterChange(e) {
        this.query = e.detail;
        this.search = e.detail;
    }

    onSelectIndividual(e) {
        this.individual = e.detail.individual;

        const sampleList = [];
        for (let i = 0; i < this.individual.samples.length; i++) {
            sampleList.push(this.individual.samples[i].id);
        }

        this.sampleSearch = {
            id: sampleList.join(",")
        };

        this.dispatchEvent(new CustomEvent("selectindividual", {
            detail: {
                individual: this.individual
            }
        }));
    }

    _changeBottomTab(e) {
        const _activeTabs = {
            info: e.currentTarget.dataset.id === "info",
            familyGrid: e.currentTarget.dataset.id === "familyGrid"
        };

        //this.set("detailActiveTabs", _activeTabs);
        this.detailActiveTabs =_activeTabs;
    }

    _changeView(e) {
        e.preventDefault(); // prevents the hash change to "#" and allows to manipulate the hash fragment as needed

        const activeMenu = {
            table: e.currentTarget.dataset.id === "table",
            comparator: e.currentTarget.dataset.id === "comparator"
        };
        //this.set("activeMenu", activeMenu);
        this.activeMenu = activeMenu;

        $(".individual-browser-view-content").hide(); // hides all content divs
        if (typeof e.target !== "undefined" && typeof e.target.dataset.view !== "undefined") {
            PolymerUtils.show(this._prefix + e.target.dataset.view);
        }

        // Show the active button
        $(".individual-browser-view-buttons").removeClass("active");
        $(e.target).addClass("active");

        if (e.target.dataset.view === "AggregationStats") {
            this.executeFacet();
        }
    }

    filterAvailableVariableSets(opencgaSession, config) {
        if (this._config.variableSetIds.length === 0 && UtilsNew.isNotUndefinedOrNull(opencgaSession.study)) {
            this.variableSets = opencgaSession.study.variableSets;
        } else {
            const variableSets = [];
            if (UtilsNew.isNotUndefinedOrNull(opencgaSession.study) && UtilsNew.isNotEmptyArray(opencgaSession.study.variableSets)) {
                for (let i = 0; i < opencgaSession.study.variableSets.length; i++) {
                    if (this._config.variableSetIds.indexOf(opencgaSession.study.variableSets[i].id) !== -1) {
                        variableSets.push(opencgaSession.study.variableSets[i]);
                    }
                }
            }
            this.variableSets = variableSets;
        }
    }

    executeFacet() {

    }

    getDefaultConfig() {
        return {
            title: "Individual Browser",
            showTitle: true,
            showAggregationStats: true,
            showComparator: true,
            filter: {

            },
            grid: {
                pageSize: 10,
                pageList: [10, 25, 50],
                detailView: true,
                multiSelection: false
            },
            gridComparator: {
                pageSize: 5,
                pageList: [5, 10],
                detailView: true,
                multiSelection: true
            },
            individualDetail: {
                showTitle: false
            },
            variableSetIds: []
        };
    }

    render() {
        return html`
<template>
        <style include="jso-styles">
            .icon-padding {
                padding-left: 4px;
                padding-right: 5px;
            }

            .detail-tab-title {
                font-size: 115%;
                font-weight: bold;
            }
        </style>

        ${this._config.showTitle ? html`
            <div class="panel" style="margin-bottom: 15px">
                <h3 style="margin: 10px 10px 10px 15px">
                    <i class="fa fa-users" aria-hidden="true"></i> &nbsp;${this._config.title}
                </h3>
            </div>
        ` : null }
        
        <div class="row" style="padding: 0px 10px">
            <div class="col-md-2">
                <opencga-individual-filter  .opencgaSession="${this.opencgaSession}"
                                            .config="$this._config.filter}"
                                            .individuals="${this.individuals}"
                                            .opencgaClient="${this.opencgaSession.opencgaClient}"
                                            .query="${this.query}"
                                            .search="${this.search}">
                </opencga-individual-filter>
            </div>

            <div class="col-md-10">
                <opencga-active-filters .opencgaClient="${this.opencgaClient}"
                                        .query="${this.query}"
                                        .defaultStudy="${this.opencgaSession.study.alias}"
                                        .config="${this.filtersConfig}"
                                        .alias="${this.activeFilterAlias}"
                                        .refresh="${this.search}"
                                        @clear="${this.onClear}"
                                        @filterchange="${this.onActiveFilterChange}">
                </opencga-active-filters>

                <!-- Individual View Buttons -->
                <div class="col-md-12" style="padding: 5px 0px 5px 0px">
                    <div class="btn-toolbar" role="toolbar" aria-label="..." style="padding: 10px 0px;margin-left: 0px">
                        <div class="btn-group" role="group" style="margin-left: 0px">
                            <button type="button" class="btn btn-success individual-browser-view-buttons active" data-view="TableResult" @click="${this._changeView}" data-id="table">
                                <i class="fa fa-table icon-padding" aria-hidden="true" data-view="TableResult" @click="${this._changeView}" data-id="table"></i> Table Result
                            </button>
                            <button type="button" class="btn btn-success individual-browser-view-buttons" data-view="AggregationStats" @click="${this._changeView}" .disabled="${!this._config.showAggregationStats}">
                                <i class="fa fa-line-chart icon-padding" aria-hidden="true" data-view="AggregationStats" @click="_changeView"></i> Aggregation Stats
                            </button>
                            <button type="button" class="btn btn-success individual-browser-view-buttons" data-view="IndividualComparator" @click="${this._changeView}" data-id="comparator" .disabled="${!this._config.showComparator}">
                                <i class="fa fa-users icon-padding" aria-hidden="true" data-view="IndividualComparator" @click="${this._changeView}" data-id="comparator"></i> Individual Comparator
                            </button>
                        </div>
                    </div>
                </div>


                <!-- Individual View Content -->
                <div>
                    <div id="${this._prefix}TableResult" class="individual-browser-view-content">
                        <opencga-individual-grid .opencgaClient="${this.opencgaSession.opencgaClient}"
                                                 .opencgaSession="${this.opencgaSession}"
                                                 .config="${this._config.grid}"
                                                 .eventNotifyName="${this.eventNotifyName}"
                                                 .individuals="${this.individuals}"
                                                 .search="${this.search}"
                                                 .active="${this.activeMenu.table}"
                                                 style="font-size: 12px"
                                                 @selectindividual="${this.onSelectIndividual}">
                        </opencga-individual-grid>

                        <!--<div style="padding-top: 5px">-->
                            <!--<ul id="${this._prefix}ViewTabs" class="nav nav-tabs" role="tablist">-->
                                <!--<li role="presentation" class="active">-->
                                    <!--<a href="#${this._prefix}IndividualViewer" role="tab" data-toggle="tab" class="detail-tab-title"-->
                                       <!--data-id="info" on-click="_changeBottomTab">-->
                                        <!--Individual Info-->
                                    <!--</a>-->
                                <!--</li>-->

                                <!--<li role="presentation">-->
                                    <!--<a href="#${this._prefix}FamilyViewer" role="tab" data-toggle="tab" class="detail-tab-title"-->
                                       <!--data-id="familyGrid" on-click="_changeBottomTab">-->
                                        <!--Family-->
                                    <!--</a>-->
                                <!--</li>-->
                            <!--</ul>-->

                            <!--<div class="tab-content" style="height: 680px">-->
                                <!--<div role="tabpanel" class="tab-pane active" id="${this._prefix}CohortViewer">-->
                                    <!--Work in progress:  {{individual.id}}-->
                                <!--</div>-->
                                <!--<div role="tabpanel" class="tab-pane" id="${this._prefix}FamilyViewer">-->
                                    <!--Work in progress:  {{individual.id}}-->
                                    <!--&lt;!&ndash;<opencga-sample-grid opencga-client="{{opencgaSession.opencgaClient}}"&ndash;&gt;-->
                                                         <!--&lt;!&ndash;opencga-session="{{opencgaSession}}" search="{{sampleSearch}}"&ndash;&gt;-->
                                                         <!--&lt;!&ndash;style="font-size: 12px" active="{{detailActiveTabs.sampleGrid}}">&ndash;&gt;-->
                                    <!--&lt;!&ndash;</opencga-sample-grid>&ndash;&gt;-->
                                <!--</div>-->

                            <!--</div>-->
                        <!--</div>-->
                    </div>

                    <div id="${this._prefix}AggregationStats" class="individual-browser-view-content" style="display: none">
                        <opencga-facet-view .opencgaSession="${this.opencgaSession}"
                                            entity="INDIVIDUAL"
                                            variableSets="${this.variableSets}">
                        </opencga-facet-view>
                    </div>

                    <div id="${this._prefix}IndividualComparator" class="individual-browser-view-content" style="display: none">
                        <opencga-individual-grid .opencgaClient="${this.opencgaSession.opencgaClient}"
                                                 .opencgaSession="${this.opencgaSession}"
                                                 .config="${this._config.gridComparator}"
                                                 .eventNotifyName="${this.eventNotifyName}"
                                                 .individuals="${this.individuals}"
                                                 .search="${this.search}" style="font-size: 12px"
                                                 .active="${this.activeMenu.comparator}">
                        </opencga-individual-grid>

                        <div style="padding-top: 5px">
                            <h3> Annotation comparator</h3>
                            <opencga-annotation-viewer .opencgaClient="${this.opencgaSession.opencgaClient}"
                                                       .opencgaSession="${this.opencgaSession}"
                                                       .config="${this._config}"
                                                       .entryIds="${this.individuals}"
                                                       entity="INDIVIDUAL">
                            </opencga-annotation-viewer>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </template>
        `;
    }

}

customElements.define("opencga-individual-browser", OpencgaIndividualBrowser);
