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
import LitUtils from "../commons/utils/lit-utils.js";
import UtilsNew from "../../core/utilsNew.js";
import "../commons/forms/select-field-filter.js";


export default class FamilyGenotypeFilter extends LitElement {

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
            clinicalAnalysis: {
                type: Object
            },
            genotype: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "ovfc" + UtilsNew.randomString(6);
        this.modeOfInheritance = "none";

        // TODO This is configurable via constants
        // if (application.appConfig === "opencb") {
        //     this.modeOfInheritanceList = [
        //         {id: "AUTOSOMAL_DOMINANT", name: "Autosomal Dominant"},
        //         {id: "AUTOSOMAL_RECESSIVE", name: "Autosomal Recessive"},
        //         {id: "X_LINKED_DOMINANT", name: "X-linked Dominant"},
        //         {id: "X_LINKED_RECESSIVE", name: "X-linked Recessive"},
        //         {id: "Y_LINKED", name: "Y-linked"}
        //     ];
        // } else {
        //     this.modeOfInheritanceList = [
        //         {id: "AUTOSOMAL_DOMINANT", name: "Autosomal Dominant"},
        //         {id: "AUTOSOMAL_RECESSIVE", name: "Autosomal Recessive"},
        //         {id: "Y_LINKED", name: "Y-linked"}
        //     ];
        // }

        this.modeOfInheritanceList = MODE_OF_INHERITANCE;

        this.modeSelectData = [
            {id: "CUSTOM", name: "Custom", selected: true},
            {separator: true},
            ...this.modeOfInheritanceList,
            {separator: true},
            {id: "COMPOUND_HETEROZYGOUS", name: "Compound Heterozygous"},
            {id: "DE_NOVO", name: "De Novo"},
            {id: "MENDELIAN_ERROR", name: "Mendelian Error"}
        ];

        this.depths = [
            {id: "5", name: "5x"}, // , selected: true
            {id: "10", name: "10x"},
            {id: "15", name: "15x"},
            {id: "20", name: "20x"},
            {id: "30", name: "30x"},
            {id: "40", name: "40x"},
            {id: "50", name: "50x"}
        ];

        this.showModeOfInheritance = true;
        this.mode = "CUSTOM";

        this.modes = ["COMPOUND_HETEROZYGOUS", "DE_NOVO", "MENDELIAN_ERROR"];
        this.state = {};
        // keeps track of the samples with no GT selected
        this.noGtSamples = [];
        // this.depthAll = true;
        this.errorState = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {
            ...this.getDefaultConfig(),
            ...this.config,
        };
    }

    updated(changedProperties) {

        if (changedProperties.has("genotype")) {
            this.genotypeObserver();
        }

        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalAnalysisObserver();
        }
        if (changedProperties.has("config")) {
            this._config = {
                ...this.getDefaultConfig(),
                ...this.config,
            };
        }
    }

    firstUpdated() {
        // Render the first time after preparing the DOM
        $("select.selectpicker", this).selectpicker("render");
    }

    // Builds the table data
    clinicalAnalysisObserver() {
        if (!this.clinicalAnalysis) {
            console.log("clinicalAnalysis is undefined or null: ", this.clinicalAnalysis);
            return;
        }

        this.tableData = [];
        // We read Individuals from Clinical Analysis
        const individuals = [];
        // first add the proband
        if (this.clinicalAnalysis?.proband?.samples?.length) {
            individuals.push(this.clinicalAnalysis.proband);
            this.showModeOfInheritance = false;
        } else {
            console.error("No proband sample available.");
        }
        // add the other members of the family
        if (this.clinicalAnalysis?.family?.members?.length) {
            // We must use only the Individuals with samples
            individuals.push(...this.clinicalAnalysis.family.members.filter(member => {
                return member.samples && member.samples.length > 0 && member.id !== this.clinicalAnalysis.proband.id;
            }));
            this.showModeOfInheritance = true;
        }

        // Prepare Table Data
        if (individuals && individuals.length > 0) {
            individuals.forEach(individual => {
                const sample = individual.samples[0];
                const row = {
                    id: sample.id,
                    individualId: individual.id,
                    proband: this.clinicalAnalysis.proband && individual.id === this.clinicalAnalysis.proband.id,
                    affected: individual?.disorders?.some(disorder => disorder.id === this.clinicalAnalysis?.disorder?.id),
                    sex: individual.sex,
                    karyotypicSex: individual.karyotypicSex,
                    role: this.clinicalAnalysis?.family?.roles[this.clinicalAnalysis.proband.id][individual.id] ?? (individual.id === this.clinicalAnalysis.proband.id ? "PROBAND" : "ERROR: Role not available")
                };
                this.tableData.push(row);
            });
        } else {
            // No individuals have been found
            this.tableData = [];
        }
        this.requestUpdate();
    }

    // Parses this.genotype and update state
    genotypeObserver() {
        this.state = {};
        if (this.genotype) {
            // TODO handle AND and OR. Comma is already used for GTs.
            // this.logicalOperator = this.genotype.split(",") > this.genotype.split(";") ? "," : ";";
            this.genotype.split(";").forEach(sample => {
                const [id, gt] = sample.split(":");
                this.state[id] = {
                    id: id,
                    genotypes: gt ? gt.split(",") : []
                };
            });

        }
        this.requestUpdate();
    }

    // Builds `sample` query param and emits `filterChange` event
    notifySampleFilterChange() {
        // Notify the sample change
        const _sample = [];
        // const _sampleData = [];
        if (this.state) {
            Object.keys(this.state).forEach(id => {
                const sample = this.state[id];
                if (sample.genotypes.length) {
                    _sample.push(id + ":" + sample.genotypes.join(","));
                }
                /* if (sample.dp) {
                    _sampleData.push(id + ":DP>=" + sample.dp);
                }*/
            });
        }
        LitUtils.dispatchCustomEvent(this, "filterChange", null, {
            value: {
                sample: _sample.length ? _sample.join(";") : null,
                // sampleData: _sampleData.length ? _sampleData.join() : null
                // includeSample: this.includeSample,
            },
            errorState: this.errorState,
        });
    }

    // Queries variant/family/genotypes to get the genotypes according to family pedigree
    // @param mode {String} Mode of inheritance
    onModeOfInheritance(mode) {
        this.modeOfInheritance = mode;

        this.opencgaSession.opencgaClient.variants().genotypesFamily(mode, {
            study: this.opencgaSession.study.fqn,
            family: this.clinicalAnalysis.family.id,
            disorder: this.clinicalAnalysis.disorder.id,
            completePenetrance: true
        }).then(response => {
            const genotypeResultMap = response.getResult(0);
            let countGenoypes = 0;
            if (genotypeResultMap) {
                const state = {};
                Object.keys(genotypeResultMap).forEach(individualId => {
                    this.tableData.forEach(sample => {
                        if (sample.individualId === individualId) {
                            state[sample.id] = {
                                id: sample.id,
                                genotypes: genotypeResultMap[individualId]
                            };
                            countGenoypes += genotypeResultMap[individualId].length;
                        }
                    });
                });
                this.errorState = countGenoypes <= 0 ? "The selected Mode of Inheritance is not compatible with the family pedigree" : false;
                // keeps the last legal state
                if (!this.errorState) {
                    this.state = {...state};
                }
                this.notifySampleFilterChange();
                this.requestUpdate();
            }

        }).catch(function (response) {
            console.error(response);
        });
    }

    // Update state on genotype change
    async onSampleTableChange(e) {
        e.preventDefault();
        const {gt, sampleId} = e.target.dataset;
        if (e.target.checked) {
            this.state[sampleId].genotypes.push(gt);
        } else {
            this.state[sampleId].genotypes.splice(this.state[sampleId].genotypes.indexOf(gt), 1);
        }
        const probandSampleId = this.clinicalAnalysis.proband.samples[0].id;
        // updated noGtSamples array according to the selected GTs
        if (probandSampleId !== sampleId) {
            if (!this.state[sampleId].genotypes.length) {
                this.noGtSamples.push(sampleId);
            } else {
                if (this.noGtSamples.includes(sampleId)) {
                    this.noGtSamples.splice(this.noGtSamples.indexOf(sampleId), 1);
                }
            }
        }

        // make sure the proband has at least 1 GT checked
        this.errorState = !this.state[probandSampleId].genotypes.length ? "At least one genotype have to be selected for the proband." : false;
        this.state = {...this.state};
        this.noGtSamples = [...this.noGtSamples];
        this.requestUpdate();
        await this.updateComplete;
        this.notifySampleFilterChange();
    }

    // Change the mode and handle the different cases
    setMode(e) {
        this.mode = e.detail.value.toUpperCase();
        this.errorState = false;
        if (this.mode === "CUSTOM") {
            this.tableData.forEach(sample => {
                this.state[sample.id] = {
                    id: sample.id,
                    genotypes: this.defaultGenotype(sample)
                };
            });
            this.notifySampleFilterChange();
        }

        // Mode of Inheritance
        if (this.modeOfInheritanceList.map(_ => _.id).includes(this.mode)) {
            this.onModeOfInheritance(this.mode);
        }

        if (~this.modes.indexOf(this.mode)) {
            const probandSampleId = this.clinicalAnalysis.proband.samples[0].id;
            this.state = {
                [probandSampleId]: {
                    id: probandSampleId,
                    genotypes: [this.mode]
                }
            };
            this.notifySampleFilterChange();
        }
        this.requestUpdate();
    }

    // Return the default genotype values according the role
    defaultGenotype(sample) {
        return sample.id === this.clinicalAnalysis.proband.samples[0].id ? ["0/1", "1/1"] : [...this._config.defaultGenotypes];
    }

    // Toggle depthAll flag
    changeDepthAll() {
        this.depthAll = !this.depthAll;
        this.requestUpdate();
    }

    // Update state on depth Change
    // @param e {Object} Event
    // @param sampleId {String} Sample Id
    async onSampleTableDepthChange(e, sampleId) {
        e.preventDefault();

        if (this.depthAll) {
            Object.keys(this.state).forEach(id => {
                this.state[id].dp = e.detail.value;
            });
        } else {
            this.state[sampleId].dp = e.detail.value;
        }
        this.state = {...this.state};
        this.notifySampleFilterChange();
        this.requestUpdate();
    }

    getSexIcon(sample) {
        const value = sample.sex?.id || sample.sex || null;
        return value ? this._config.sexIconMap[value] : "";
    }

    render() {
        return html`
            <style>
                #opencga-variant-filter-clinical {
                    /*font-size: 12px;*/
                }

                #segregation-select {
                    width: 200px;
                }

                #opencga-variant-filter-clinical .mode-button > div {
                    margin-right: 20px;
                    display: inline-block;
                    vertical-align: top;
                }

                #opencga-variant-filter-clinical .select-field-filter-wrapper {
                    display: inline-block;
                    width: 180px;
                }
            </style>

            <div id="opencga-variant-filter-clinical" class="row">
                <div class="form-check col-md-12">
                    <div style="padding: 5px 5px 10px 5px; font-size: 14px">
                        You can manually select sample genotypes or select a 
                        <span style="font-weight: bold;margin: 0px">Mode of Inheritance</span>
                        such as RECESSIVE OR COMPOUND HETEROZYGOUS.
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="form-check-label mode-button">
                        <select-field-filter
                            .data="${this.modeSelectData}"
                            value="${this.mode}"
                            @filterChange="${this.setMode}">
                        </select-field-filter>
                    </div>
                </div>
                <div class="col-md-12">
                    <div>
                        <h4 style="padding-top: 10px; margin-bottom: 0px">
                            Select Sample Genoypes
                        </h4>
                        <table id="${this._prefix}BasicTable" class="table table-hover table-no-bordered">
                            <thead>
                            <tr>
                                <th rowspan="2">Sample</th>
                                <th rowspan="2">Individual</th>
                                <th rowspan="2">Role</th>
                                <th rowspan="2">Sex (karyotype)</th>
                                <th rowspan="2">Affected (${this.clinicalAnalysis.disorder.id})</th>
                                <th rowspan="1" colspan="3" style="text-align: center">Genotypes</th>
                                <!--<th rowspan="2" style="width: 100px">Min. Depth
                                    <br>
                                    <label>
                                        <input
                                            type="checkbox"
                                            title="Apply to all samples"
                                            .checked="\${this.depthAll}"
                                            @change="\${this.changeDepthAll}"/> All
                                    </label>
                                </th>-->
                            </tr>
                            <tr>
                                <th scope="col">HOM_REF</th>
                                <th scope="col">HET</th>
                                <th scope="col">HOM_ALT</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${this.tableData && this.tableData.length ? this.tableData.map(sample => html`
                                <tr data-sample="${sample.id}">
                                    <td style="vertical-align: middle">
                                        <div>
                                            <span
                                                style="${(sample.affected ? "color: darkred;" : "font-weight: normal;")}${sample.proband ? "font-weight: bold" : ""}"
                                                data-toggle="tooltip"
                                                data-placement="bottom">
                                                ${sample.id}
                                            </span>
                                        </div>
                                    </td>
                                    <td style="padding-left: 0px">
                                        ${sample.individualId}
                                    </td>
                                    <td style="padding-left: 0px">
                                        <span style="color: ${sample.role.toUpperCase() === "PROBAND" ? "darkred" : "black"}">${sample.role}</span>
                                    </td>

                                    <td style="padding-left: 0px">
                                        <span>
                                            <i class="fas ${this.getSexIcon(sample)} icon-padding"></i>
                                            ${sample.sex?.id || sample.sex || "Not specified"} (${sample.karyotypicSex || "Not specified"})
                                        </span>
                                    </td>
                                    <td style="padding-left: 25px">
                                        ${sample.affected ? html`
                                            <span data-toggle="tooltip" data-placement="bottom" title="Affected">
                                                <i class='fa fa-check' style='color: green'></i>
                                            </span>
                                        ` : html`
                                            <span>
                                                <i class='fa fa-times' style='color: red'></i>
                                            </span>
                                        `}
                                    </td>
                                    ${~["PROBAND", "FATHER", "MOTHER"].indexOf(sample.role.toUpperCase()) && ~this.modes.indexOf(this.mode) ? html`
                                        <td colspan="3">
                                            <div class="alert-info text-center" style="padding: 4px 0 1px;"> ${this.mode}</div>
                                        </td>
                                    ` : html`
                                        <td style="padding-left: 20px">
                                            <input
                                                type="checkbox"
                                                class="sample-checkbox" data-gt="0/0" data-sample-id="${sample.id}"
                                                .checked="${this.state?.[sample.id]?.genotypes.includes("0/0")}"
                                                ?disabled="${this.mode !== "CUSTOM" || sample.role.toUpperCase() === "PROBAND"}"
                                                @change="${this.onSampleTableChange}">
                                        </td>
                                        <td style="padding-left: 20px">
                                            <input
                                                type="checkbox"
                                                class="sample-checkbox" data-gt="0/1" data-sample-id="${sample.id}"
                                                .checked="${this.state?.[sample.id]?.genotypes.includes("0/1")}"
                                                ?disabled="${this.mode !== "CUSTOM"}"
                                                @change="${this.onSampleTableChange}">
                                        </td>
                                        <td style="padding-left: 20px">
                                            <input
                                                type="checkbox"
                                                class="sample-checkbox" data-gt="1/1" data-sample-id="${sample.id}"
                                                .checked="${this.state?.[sample.id]?.genotypes.includes("1/1")}"
                                                ?disabled="${this.mode !== "CUSTOM"}"
                                                @change="${this.onSampleTableChange}">
                                        </td>`
                                    }
                                    <!--<td style="padding-left: 10px;">
                                        <select-field-filter
                                            .data="\${this.depths}"
                                            .value="\${this.state?.[sample.id]?.dp}"
                                            @filterChange="\${e => this.onSampleTableDepthChange(e, sample.id)}"
                                            placeholder="Depth"
                                            .disabled="\${"PROBAND" !== sample.role.toUpperCase() && this.depthAll}">
                                        </select-field-filter>
                                    </td>-->
                                </tr>
                            `) : null}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${this.noGtSamples.length ? html`
                    <div class="col-md-12" style="padding: 10px 20px">
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle align-middle icon-padding"></i> 
                            All genotypes for sample${this.noGtSamples.length > 1 ? "s" : ""} ${this.noGtSamples.join(", ")} will be included.
                        </div>
                    </div>
                ` : null}
                ${this.showModeOfInheritance && this.errorState ? html`
                    <div class="col-md-12" style="padding: 10px 20px">
                        <div class="alert alert-danger" role="alert">
                            <i class="fas fa-exclamation-triangle align-middle icon-padding"></i> 
                            ${this.errorState}
                        </div>
                    </div>
                ` : null}
            </div>
        `;
    }

    getDefaultConfig() {
        return {
            defaultGenotypes: ["0/0", "0/1", "1/1"],
            sexIconMap: {
                MALE: "fa-mars",
                FEMALE: "fa-venus",
                UNKNOWN: "fa-genderless"
            }
        };
    }

}

customElements.define("family-genotype-filter", FamilyGenotypeFilter);
