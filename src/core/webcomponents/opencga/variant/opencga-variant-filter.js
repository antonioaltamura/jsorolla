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
import "./../../commons/variant-modal-ontology.js";
import "./../../commons/filters/cadd-filter.js";
import "../../commons/filters/biotype-filter.js";
import "../../commons/filters/region-filter.js";
import "./../../commons/filters/clinvar-accessions-filter.js";
import "./../../commons/filters/cohort-filter.js";
import "./../../commons/filters/consequence-type-filter.js";
import "./../../commons/filters/conservation-filter.js";
import "./../../commons/filters/disease-filter.js";
import "./../../commons/filters/feature-filter.js";
import "./../../commons/filters/file-filter.js";
import "./../../commons/filters/file-pass-filter.js";
import "./../../commons/filters/file-qual-filter.js";
import "./../../commons/filters/fulltext-search-accessions-filter.js";
import "./../../commons/filters/go-accessions-filter.js";
import "./../../commons/filters/hpo-accessions-filter.js";
import "./../../commons/filters/population-frequency-filter.js";
import "./../../commons/filters/protein-substitution-score-filter.js";
import "./../../commons/filters/sample-filter.js";
import "./../../commons/filters/study-filter.js";
import "./../../commons/filters/variant-type-filter.js";

//TODO complete lit-html refactor
export default class OpencgaVariantFilter extends LitElement {

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
            query: {
                type: Object
            },
            clinicalAnalysis: {
                type: Object
            },
            cellbaseClient: {
                type: Object
            },
            populationFrequencies: {
                type: Object
            },
            consequenceTypes: {
                type: Object
            },
            config: {
                type: Object
            },
            searchButton: {
                type: Boolean
            }
            // samples: {
            //     type: Array
            // }
        }
    }


    _init() {
        this._prefix = `ovf${Utils.randomString(6)}_`;

        this._initialised = false;
        // this._reset = true;
        if (PANELS) {
            this.panelList = PANELS; //todo check if have to be managed by litelement
        }

        this.query = {}; // NOTE when no query param (or undefined) is passed to this component, this initialization is replaced with undefined value
        this.preparedQuery = {};

        this.modalHpoActive = false;
        this.modalGoActive = false;

        // this.samples = [];
        this.updateClinicalFilterQuery = true;
        this.searchButton = true
    }


    //it was connectedCallback() in polymer 2
    firstUpdated() {
        // Render filter menu and add event and tooltips
        //this now returns html
        //this._renderFilterMenu();

        this._addAllTooltips();

        this._initialised = true;

        this.opencgaSessionObserver();
        // this.queryObserver();
        //this.setQueryFilters();
        //this.clinicalObserver();

    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        if (changedProperties.has("query")) {
            this.queryObserver();
        }
        if (changedProperties.has("clinicalAnalysis")) {
            this.clinicalObserver();
        }
        // if (changedProperties.has("samples")) {
            //this.samplesObserver();
        // }
    }


    // static get observers() {
    //     return [
    //         "propertyObserver(opencgaSession, query)"
    //     ];
    // }
    //
    // propertyObserver(opencgaSession, query) {
    //     this.opencgaSessionObserver();
    //     this.queryObserver();
    // }

    //TODO refactor in map()
    opencgaSessionObserver() {
        if (this.opencgaSession.study) {
            // Update the study list of studies and the selected one
            if (this.opencgaSession.project.studies) {
                let _differentStudies = [];
                for (let i = 0; i < this.opencgaSession.project.studies.length; i++) {
                    if (this.opencgaSession.study.alias !== this.opencgaSession.project.studies[i].alias) {
                        _differentStudies.push(this.opencgaSession.project.studies[i]);
                    }
                }
                this.differentStudies = _differentStudies;
                // Insert study checkboxes HTML, this only happens if the Study subsection has been added

                /* NOTE listener moved in _getStudyHtml()

                PolymerUtils.innerHTML(this._prefix + "study", this._getStudyHtml(this._prefix));
                for (let study of this.differentStudies) {
                    let element = PolymerUtils.getElementById(this._prefix + study.alias + "Checkbox");
                    if (UtilsNew.isNotUndefinedOrNull(element)) {
                        element.addEventListener('change', this.updateQueryFilters.bind(this));
                    }
                }*/
            }

            //TODO should it be moved in cohort-filter?
            // Update cohorts from config, this updates the Cohort filter ALT
            if (typeof this.config !== "undefined" && typeof this.config.menu.sections !== "undefined") {
                this._cohorts = [];
                for (let section of this.config.menu.sections) {
                    for (let subsection of section.subsections) {
                        if (subsection.id === "cohort") {
                            let projectId = this.opencgaSession.project.id;
                            if (UtilsNew.isNotUndefinedOrNull(subsection.cohorts[projectId])) {
                                for (let study of Object.keys(subsection.cohorts[projectId])) {
                                    // Array.prototype.push.apply(this._cohorts, subsection.cohorts[projectId][study]);
                                    this._cohorts = subsection.cohorts[projectId];
                                }
                            }
                        }
                    }
                }
            }

            // this.query = {
            //     study: this.opencgaSession.project.alias + ":" + this.opencgaSession.study.alias
            // };
            // this.notifySearch(this.query);

            // Render filter menu and add event and tooltips
            if (this._initialised) {
                this._renderFilterMenu();
            }
        }
    }

    queryObserver() {
        //the following line FIX the "silent" persistence of active filters once 1 is deleted, due to an inconsistence between query and preparedQuery. Step to reproduce:
        // 0. comment the line `this.preparedQuery = this.query;`
        // 1. add some filters from variant=filter
        // 2. delete 1 filter from active-filter
        // 3. add another filter from variant-filter
        // 4. you will see again the deleted filter in active-filters
        this.preparedQuery = this.query || {}; // TODO quick fix in case the component gets an undefined value as prop

        if (this.updateClinicalFilterQuery) {
            this.clinicalFilterQuery = this.query;
        } else {
            this.skipClinicalFilterQueryUpdate = true;
        }
        if (this._reset) {
            //console.trace(this.query)
            this.setQueryFilters();
        } else {
            this._reset = true;
        }
        this.requestUpdate();
    }

    clinicalObserver(clinicalAnalysis) {
        if (UtilsNew.isNotUndefinedOrNull(clinicalAnalysis)) {
            // this.clinicalAnalysis = Object.assign({}, clinicalAnalysis);
        }
    }

    onSearch() {
        this.notifySearch(this.preparedQuery);
    }

    //TODO rename to filterChange
    notifyQuery(query) {
        this.dispatchEvent(new CustomEvent("queryChange", {
            detail: {
                query: query,
            },
            bubbles: true,
            composed: true
        }));
    }

    notifySearch(query) {
        this.dispatchEvent(new CustomEvent("querySearch", {
            detail: {
                query: query,
            },
            bubbles: true,
            composed: true
        }));
    }

    //moved on sample-filter
    /*onSampleFilterClick() {
        $("#" + this._prefix + "SampleFilterModal").modal("show");
    }*/

    //TODO moved in sample-filter still not completed
    /*onClinicalFilterChange(e) {
        // Process Sample filters
        let _genotypeFilters = [];
        let _sampleIds = [];
        let _dpFormatFilter = [];
        for (let sampleFilter of e.detail.sampleFilters) {
            // let color = (sampleFilter.affected) ? "red" : "black";
            let genotypes = (sampleFilter.genotypes.length > 0) ? sampleFilter.genotypes.join(",") : "none";
            let dp = (UtilsNew.isNotEmpty(sampleFilter.dp)) ? Number(sampleFilter.dp) : -1;

            if (genotypes !== "none") {
                if (e.detail.missing && !sampleFilter.proband) {
                    genotypes += ",./0,./1,./.";
                }
                _genotypeFilters.push(sampleFilter.id + ":" + genotypes);
            }
            if (dp !== -1) {
                _dpFormatFilter.push(sampleFilter.id + ":DP>=" + dp);
            }
            _sampleIds.push(sampleFilter.id)
        }

        // Process File filters
        // let _files = [];
        // let _qual = e.detail.qual;
        // let _filter = e.detail.filter;
        // for (let fileFilter of e.detail.fileFilters) {
        //     if (fileFilter.selected) {
        //         // _files.push(fileFilter.name);
        //         _files.push(fileFilter.id);
        //     }
        // }

        let needUpdateQuery = false;
        // Add sample filters to query
        let _query = {...this.query};
        if (_genotypeFilters !== undefined && _genotypeFilters.length > 0) {
            _query.genotype = _genotypeFilters.join(";");
            delete _query.sample;
            needUpdateQuery = true;
        } else {
            // debugger
            _query.sample = _sampleIds.join(",");
            delete _query.genotype;
        }
        if (_dpFormatFilter !== undefined && _dpFormatFilter.length > 0) {
            _query.format = _dpFormatFilter.join(";");
            needUpdateQuery = true;
        } else {
            if (UtilsNew.isNotUndefinedOrNull(_query.format)) {
                delete _query.format;
                needUpdateQuery = true;
            }
        }

        // Add file filters to query
        // if (_files.length > 0) {
        //     _query.file = _files.join(";");
        //     if (UtilsNew.isNotEmpty(_qual)) {
        //         _query.qual = ">=" + _qual;
        //     }
        //     if (UtilsNew.isNotEmpty(_filter)) {
        //         _query.filter = _filter;
        //     }
        //     needUpdateQuery = true;
        // } else {
        //     // If no files are selected we remove all files-related filters
        //     delete _query.file;
        //     delete _query.qual;
        //     delete _query.filter;
        // }

        //Only update query if really needed, this avoids unneeded web refresh
        if (needUpdateQuery) {
            this.updateClinicalFilterQuery = false;
            this.preparedQuery = _query;
            this.updateClinicalFilterQuery = true;
        }

        this.notifyQuery(this.preparedQuery);
    }*/

    /*
    //refactored and moved in go-accessions-filter and hpo-accessions-filter
    propagateOkHPO(e) {
        if (this.openHPO) {
            PolymerUtils.setValue(this._prefix + "HumanPhenotypeOntologyTextarea", e.detail.result.join(","));
            this.selectedTermsHPO = e.detail.originalResult;
        } else {
            PolymerUtils.setValue(this._prefix + "GeneOntologyTextarea", e.detail.result.join(","));
            this.selectedTermsGO = e.detail.originalResult;
        }
        $("#ontologyModal").modal("hide");

        this.updateQueryFilters();
    }
    */

    //refactored and moved in go-accessions-filter and hpo-accessions-filter
    /*onOntologyModalOpen(e) {
        console.log("onOntologyModalOpen variant-filter",e.detail);
        //modal window from variant-modal-ontology
        this.openHPO = e.detail.openHPO;
        this.ontologyTerm = e.detail.ontologyTerm;
        this.selectedTermsOntology = e.detail.selectedTermsOntology; //selectedTermsGO and selectedTermsHPO
        this.ontologyFilter = e.detail.ontologyFilter;
        console.log(this.openHPO, this.ontologyTerm);
        this.requestUpdate();
        $("#ontologyModal").modal("show");
    }*/

    //DONE moved in hpo-accession-filter
    /*openModalHpo() {
        this.openHPO = true;
        this.ontologyTerm = "HPO";
        this.selectedTermsOntology = this.selectedTermsHPO;
        this.ontologyFilter = "hp";
        this.openModalOntology();
    }*/

    //DONE moved to go-accessions-filter
    /*openModalGo() {
        this.openHPO = false;
        this.ontologyTerm = "GO";
        this.selectedTermsOntology = this.selectedTermsGO;
        this.ontologyFilter = "go";
        this.openModalOntology();
    }*/

    //DONE moved to population-frequency-filter
    /*handleCollapseAction(e) {
        let id = e.target.dataset.id;
        let elem = $("#" + id)[0];
        elem.hidden = !elem.hidden;
        if (elem.hidden) {
            e.target.className = "fa fa-plus";
        } else {
            e.target.className = "fa fa-minus";
        }
    }
    //DONE moved to population-frequency-filter
    keyUpAllPopFreq(e) {
        let studyId = e.target.getAttribute("data-study");
        let study = this.populationFrequencies.studies.find((study) => {
            return study.id === studyId;
        });

        study.populations.forEach((popFreq) => {
            PolymerUtils.setValue(this._prefix + studyId + popFreq.id, e.target.value);
        });

        this.updateQueryFilters();
    }*/

    //DONE moved to consequence-type-filter
    /*updateConsequenceTypeFilter(e) {
        // Select LoF term checkboxes
        let lofCheckBox = PolymerUtils.getElementById(this._prefix + "LossOfFunctionCheckBox");
        if (e.currentTarget.id === this._prefix + "LossOfFunctionCheckBox") {
            for (let ct of this.consequenceTypes.lof) {
                let checkbox = PolymerUtils.getElementById(this._prefix + ct + "Checkbox");
                if (UtilsNew.isNotUndefinedOrNull(checkbox)) {
                    checkbox.checked = e.currentTarget.checked;
                }
            }
        }

        // Select/Unselect the items from one category
        if (e.target.parentNode.parentNode.id !== "") {
            $("#" + e.target.parentNode.parentNode.id).children("ul").children("li").children("label").children("input").each(function () {
                $(this).prop("checked", e.target.checked);
            });
        }

        let soTerms = [];
        let selected = PolymerUtils.querySelectorAll("li input", this._prefix + "consequenceTypeFilter");
        selected.forEach((sel) => {
            if (sel.checked && typeof sel.dataset !== "undefined" && typeof sel.dataset.id !== "undefined") {
                soTerms.push(sel.dataset.id);
            } else {
                // If one term from LoF array is not selected we remove LoF check
                let dataId = sel.getAttribute("data-id");
                if (lofCheckBox.checked && UtilsNew.isNotUndefinedOrNull(dataId) && this.consequenceTypes.lof.includes(dataId)) {
                    lofCheckBox.checked = false;
                }
            }
        });

        this.ct = soTerms;
        this.updateQueryFilters();
    }*/

    //DONE moved in proteine-substitution-score-filter
    /*checkScore(e) {
        let inputElement = $("#" + this._prefix + e.target.name + "Input");
        let operatorElement = $("#" + this._prefix + e.target.name + "Operator");
        if (e.target.value === "score") {
            inputElement.prop("disabled", false);
            operatorElement.prop("disabled", false);
        } else {
            inputElement.val("");
            operatorElement.val("<");
            inputElement.prop("disabled", true);
            operatorElement.prop("disabled", true);
        }
        this.updateQueryFilters();
    }*/


    //DONE moved in sample-filter
    /*renderClinicalQuerySummary() {
        if (UtilsNew.isNotUndefinedOrNull(this.clinicalAnalysis)) {
            // Get Individuals (and samples) from Clinical Analysis
            let individuals = [];
            if (UtilsNew.isNotUndefinedOrNull(this.clinicalAnalysis.family) && UtilsNew.isNotEmptyArray(this.clinicalAnalysis.family.members)) {
                individuals = this.clinicalAnalysis.family.members;
            } else {
                if (UtilsNew.isNotUndefinedOrNull(this.clinicalAnalysis.proband)) {
                    individuals = this.clinicalAnalysis.proband;
                }
            }

            // First, render Genotype table
            let sampleGenotypeMap = {};
            if (UtilsNew.isNotUndefinedOrNull(this.query.genotype)) {
                for (let genotype of this.query.genotype.split(";")) {
                    let sampleGt = genotype.split(":");
                    sampleGenotypeMap[sampleGt[0]] = sampleGt[1].split(",");
                }
            } else {
                if (UtilsNew.isNotUndefinedOrNull(this.query.sample)) {
                    for (let sample of this.query.sample.split(",")) {
                        sampleGenotypeMap[sample] = ["0/1", "1/1"];
                    }
                }
            }

            // Render Genotype table
            let sampleTableTr = "";
            for (let individual of individuals) {
                if (UtilsNew.isNotEmptyArray(individual.samples)) {
                    let color = (UtilsNew.isNotUndefinedOrNull(this.clinicalAnalysis.proband)
                        && individual.id === this.clinicalAnalysis.proband.id)
                        ? "darkred"
                        : "black";
                    let genotype = (UtilsNew.isNotUndefinedOrNull(sampleGenotypeMap[individual.samples[0].id]))
                        ? sampleGenotypeMap[individual.samples[0].id]
                        : "any";

                    sampleTableTr += `
                            <tr data-sample="${individual.samples[0].id}">
                                <td>
                                    <span style="color: ${color}">${individual.samples[0].id}</span>
                                </td>
                                <td>
                                    ${genotype}
                                </td>
                            </tr>
                    `;
                }
            }

            // Set HTML into the table body
            let elementById = PolymerUtils.getElementById(this._prefix + "SampleFiltersSummaryTBody");
            if (UtilsNew.isNotUndefinedOrNull(elementById)) {
                //TODO avoid innerHTML
                elementById.innerHTML = sampleTableTr;
            }
        }
    }*/

    //binding::from this.query to the view
    //most of those blocks have been refactored and moved in firstUpdated() in each filter component
    setQueryFilters() {
        if (!this._initialised) {
            return;
        }

        // Clear filter menu before rendering
        this._clearHtmlDom();
        // Check 'query' is not null or empty there is nothing else to do
        if (UtilsNew.isUndefinedOrNull(this.preparedQuery) || Object.keys(this.preparedQuery).length === 0) {
            console.warn("this.preparedQuery is NULL:", this.preparedQuery)
            return;
        }

        // Render Clinical filters: sample and file
        //this.renderClinicalQuerySummary();


        // implemented in study-filter
        /*
        if (typeof this.query.studies !== "undefined") {
            if (this.querySelector("#" + this._prefix + "includeOtherStudy") !== null &&
                this.querySelector("#" + this._prefix + "DifferentStudies") !== null) {
                let studies = this.query.studies.split(new RegExp("[,;]"));

                if (studies.length > 1) {
                    let checkBoxes = PolymerUtils.querySelectorAll("input", "#" + this._prefix + "DifferentStudies");
                    console.log("checkBoxes",checkBoxes)
                    for (let i = 0; i < studies.length; i++) {
                        let study = studies[i].split(":")[1];
                        for (let j = 0; j < checkBoxes.length; j++) {
                            if (checkBoxes[j].value === study) {
                                debugger
                                checkBoxes[j].checked = true;
                            }
                        }
                    }
                }
            }
        }
         */


        // DONE moved in cohort-filter
        // Cohorts
        /*let cohortArray = [];
        if (typeof this.query.cohortStatsAlt !== "undefined") {
            cohortArray = this.query.cohortStatsAlt.split(new RegExp("[,;]"));
            for (let i = 0; i < cohortArray.length; i++) {
                let [study, cohortFreq] = cohortArray[i].split(":");
                let [cohort, freq] = cohortFreq.split(/[<=>]+/);
                let operator = cohortFreq.split(/[-A-Za-z0-9._:]+/)[1];
                PolymerUtils.setValue(this._prefix + study + cohort + "Cohort", freq);
                PolymerUtils.setValue(this._prefix + study + cohort + "CohortOperator", operator);
            }
        }*/

        // implemented in file-filter
        /*// Filter PASS
        if (UtilsNew.isNotEmpty(this.query.filter) && this.query.filter === "PASS") {
            PolymerUtils.getElementById(this._prefix + "FilePassCheckbox").checked = true;
        }
        // Filter QUAL
        if (UtilsNew.isNotEmpty(this.query.qual) && this.query.qual > 0) {
            PolymerUtils.getElementById(this._prefix + "FileQualCheckbox").checked = true;
            PolymerUtils.getElementById(this._prefix + "FileQualInput").disabled = false;
            PolymerUtils.getElementById(this._prefix + "FileQualInput").value = this.query.qual;
        }
         */

        /* implemented in cellbase-region-filter
        // Region
        if (UtilsNew.isNotEmpty(this.query.region)) {
            $("#" + this._prefix + "LocationTextarea").val(this.query.region);
        }
        */


        /* implemented in feature-filter
        // XRefs, Gene and Variant Ids
        if (typeof this.query.xref !== "undefined") {
            PolymerUtils.setValue(this._prefix + "FeatureTextarea", this.query["xref"]);
        } else if (typeof this.query.ids !== "undefined") {
            PolymerUtils.setValue(this._prefix + "FeatureTextarea", this.query.ids);
        }
        */

        // DONE moved in disease-filter
        // Disease panels
        /*if (UtilsNew.isNotUndefinedOrNull(this.query.panel)) {
            $("#" + this._prefix + "DiseasePanels").selectpicker("val", this.query.panel.split(","));
            this.showPanelGenes(this.query.panel.split(","));
        }
        */

        /* implemented in biotype-filter
        // Biotype
        if (UtilsNew.isNotUndefinedOrNull(this.query.biotype)) {
            $("#" + this._prefix + "GeneBiotypes").selectpicker("val", this.query.biotype.split(","));
        }
         */

        /* MOVED in feature-filter
        // Panel - annot-panel
        // TODO Genes must be displayed in Xref textarea
        if (typeof this.query["gene"] !== "undefined") {
            // PolymerUtils.setValue(this._prefix + "PanelAppsTextarea", this.query.gene);
            let geneTextarea = PolymerUtils.getElementById(this._prefix + "FeatureTextarea");
            if (UtilsNew.isNotUndefinedOrNull(geneTextarea)) {
                geneTextarea.value = this.query.gene;
            }
        }
         */

        //DONE moved in variant-type-filter
        /*// Type
        if (typeof this.query.type !== "undefined") {
            let types = this.query.type.split(",");
            let checkBoxes = PolymerUtils.querySelectorAll("input", this._prefix + "Type");
            for (let i = 0; i < types.length; i++) {
                for (let j = 0; j < checkBoxes.length; j++) {
                    if (checkBoxes[j].value === types[i]) {
                        checkBoxes[j].checked = true;
                    }
                }
            }
        }*/

        //DONE moved to population-frequency-filter TODO recheck
        /*
        // Population Frequencies
        let pfArray = [];
        if (typeof this.query["alternate_frequency"] !== "undefined") {
            pfArray = this.query["alternate_frequency"].split(new RegExp("[,;]"));
        }
        if (typeof this.populationFrequencies !== "undefined" && typeof this.populationFrequencies.studies !== "undefined" && this.populationFrequencies.studies.length > 0) {
            for (let i = 0; i < this.populationFrequencies.studies.length; i++) {
                let study = this.populationFrequencies.studies[i].id;
                for (let j = 0; j < this.populationFrequencies.studies[i].populations.length; j++) {
                    let population = this.populationFrequencies.studies[i].populations[j].id;
                    if (pfArray.length > 0) {
                        for (let k = 0; k < pfArray.length; k++) {
                            let pf = pfArray[k];
                            if (pf.startsWith(study + ":" + population)) {
                                PolymerUtils.setValue(this._prefix + study + population, pf.split(/[<=>]+/)[1]);
                                PolymerUtils.setValue(this._prefix + study + population + "Operator", pf.split(/[-A-Za-z0-9._:]+/)[1]);
                                break;
                            }
                        }
                    }
                }
            }
        }*/

        //DONE moved in proteine-substitution-score-filter TODO recheck
        /*
        // Protein Substitution scores
        if (UtilsNew.isNotUndefinedOrNull(this.query["protein_substitution"])) {
            let pss = this.query["protein_substitution"].split(new RegExp("[,;]"));
            if (pss.length > 0) {
                for (let i = 0; i < pss.length; i++) {
                    if (pss[i].startsWith("sift")) {
                        let value = pss[i].split("sift")[1];
                        if (value.startsWith("<") || value.startsWith(">")) {
                            PolymerUtils.setValue(this._prefix + "SiftInput", value.split(/[<=>]+/)[1]);
                            PolymerUtils.setValue(this._prefix + "SiftOperator", value.split(/[-0-9.]+/)[0]);
                        } else {
                            PolymerUtils.setValue(this._prefix + "SiftValues", value.split("==")[1]);
                        }
                        PolymerUtils.getElementById(this._prefix + "SiftInput").disabled = !(value.startsWith("<") || value.startsWith(">"));
                        PolymerUtils.getElementById(this._prefix + "SiftOperator").disabled = !(value.startsWith("<") || value.startsWith(">"));
                    } else if (pss[i].startsWith("polyphen")) {
                        let value = pss[i].split("polyphen")[1];
                        if (value.startsWith("<") || value.startsWith(">")) {
                            PolymerUtils.setValue(this._prefix + "PolyphenInput", value.split(/[<=>]+/)[1]);
                            PolymerUtils.setValue(this._prefix + "PolyphenOperator", value.split(/[-0-9.]+/)[0]);
                        } else {
                            PolymerUtils.setValue(this._prefix + "PolyphenValues", value.split("==")[1]);
                        }
                        PolymerUtils.getElementById(this._prefix + "PolyphenInput").disabled = !(value.startsWith("<") || value.startsWith(">"));
                        PolymerUtils.getElementById(this._prefix + "PolyphenOperator").disabled = !(value.startsWith("<") || value.startsWith(">"));
                    }
                }
            }
            if (pss.length === 2) {
                $("input:radio[name=pss]").attr("disabled", false);
                if (this.query["protein_substitution"].includes(";")) {
                    $("input:radio[name=pss][value=and]").prop("checked", true);
                }
            }
        }
         */

        //DONE moved to cadd-filter
        // Cadd scores
        /*if (typeof this.query["annot-functional-score"] !== "undefined") {
            let fields = this.query["annot-functional-score"].split(new RegExp("[,;]"));
            for (let i = 0; i < fields.length; i++) {
                let source = fields[i].split(/[<=>]+/)[0];
                switch (source) {
                case "cadd_raw":
                    PolymerUtils.setValue(this._prefix + "CaddRawInput", fields[i].split(/[<=>]+/)[1]);
                    PolymerUtils.setValue(this._prefix + "CaddRawOperator", fields[i].split(/[-A-Za-z0-9_]+/)[1]);
                    break;
                case "cadd_scaled":
                    PolymerUtils.setValue(this._prefix + "CaddScaledInput", fields[i].split(/[<=>]+/)[1]);
                    PolymerUtils.setValue(this._prefix + "CaddScaledOperator", fields[i].split(/[-A-Za-z0-9_]+/)[1]);
                    break;
                }
            }
        }*/

        //DONE moved in conservation-filter
        /*
        // Conservation
        if (typeof this.query.conservation !== "undefined") {
            let fields = this.query.conservation.split(new RegExp("[,;]"));
            for (let i = 0; i < fields.length; i++) {
                let source = fields[i].split(/[<=>]+/)[0];
                switch (source) {
                case "phylop":
                    PolymerUtils.setValue(this._prefix + "PhylopInput", fields[i].split(/[<=>]+/)[1]);
                    PolymerUtils.setValue(this._prefix + "PhylopOperator", fields[i].split(/[-A-Za-z0-9]+/)[1]);
                    break;
                case "phastCons":
                    PolymerUtils.setValue(this._prefix + "PhastconsInput", fields[i].split(/[<=>]+/)[1]);
                    PolymerUtils.setValue(this._prefix + "PhastconsOperator", fields[i].split(/[-A-Za-z0-9]+/)[1]);
                    break;
                case "gerp":
                    PolymerUtils.setValue(this._prefix + "GerpInput", fields[i].split(/[<=>]+/)[1]);
                    PolymerUtils.setValue(this._prefix + "GerpOperator", fields[i].split(/[-A-Za-z0-9]+/)[1]);
                    break;
                }
            }
        }
         */

        //DONE moved in consequence-type-filter
        // Consequence Type
        /*let ct = [];
        if (typeof this.query.ct !== "undefined") {
            let types = this.query.ct.split(",");
            for (let i = 0; i < types.length; i++) {
                let checkbox = PolymerUtils.getElementById(this._prefix + types[i] + "Checkbox");
                if (UtilsNew.isNotUndefinedOrNull(checkbox)) {
                    checkbox.checked = true;
                    ct.push(types[i]);
                }
            }
        }
        this.ct = ct;*/

        // Gene Ontology and Human Phenotype Ontology

        //DONE moved to go-accessions-filter
        /*
        if (typeof this.query["go"] !== "undefined") {
            PolymerUtils.setValue(this._prefix + "GeneOntologyTextarea", this.query["go"]);
        }*/
        //DONE moved to hpo-accessions-filter
        /*if (typeof this.query["annot-hpo"] !== "undefined") {
            PolymerUtils.setValue(this._prefix + "HumanPhenotypeOntologyTextarea", this.query["annot-hpo"]);
        }*/
        //DONE moved to clinvar-accessions-filter
       /* if (typeof this.query["clinvar"] !== "undefined") {
            PolymerUtils.setValue(this._prefix + "ClinVarTextarea", this.query["clinvar"]);
        }
        */
        //DONE moved to fulltext-searc-accessions-filter
       /*if (typeof this.query["traits"] !== "undefined") {
            PolymerUtils.setValue(this._prefix + "TraitsTextarea", this.query.traits);
        }*/
        // this.requestUpdate();
    }

    //DONE MOVED to disease-filter TODO recheck & refactor
    /*showPanelGenes(panels) {
        PolymerUtils.getElementById(this._prefix + "DiseasePanelsTextarea").value = "";
        if (UtilsNew.isNotEmptyArray(panels)) {
            let _this = this;
            this.opencgaSession.opencgaClient.panels()
                .info(panels.join(","), {
                    study: _this.opencgaSession.study.fqn,
                    include: "id,name,genes.id,genes.name,regions.id"
                }, {})
                .then(function (response) {
                    let text = "";
                    for (let panelResponse of response.response) {
                        let panel = panelResponse.result[0];
                        let geneNames = [];
                        for (let gene of panel.genes) {
                            geneNames.push(gene.name);
                        }
                        let regions = [];
                        for (let region of panel.regions) {
                            regions.push(region.id);
                        }
                        text += `${panel.name} (${geneNames.length} genes and ${regions.length} regions): ${geneNames.join(",")} \n`;
                        text += `${geneNames.join(",")} \n`;
                        text += `${regions.join(",")} \n\n`;
                    }
                    PolymerUtils.getElementById(_this._prefix + "DiseasePanelsTextarea").value = text;
                })
                .catch(function (response) {
                    console.error(response);
                });
        }
    }*/

    /***
     * Handles filterChange events from all the filter components (this is the new updateQueryFilters)
     * @param key {string} the name of the property in this.query
     * @param value {string} the new value of the property
     */
    onFilterChange(key, value) {
        console.log("filterChange", {[key]:value});
        if (value && value !== "") {
            this.preparedQuery = {...this.preparedQuery, ...{[key]: value}};
        } else {
            console.log("deleting", key, "from preparedQuery")
            delete this.preparedQuery[key];
            this.preparedQuery = {...this.preparedQuery};
        }
        this.notifyQuery(this.preparedQuery);
        this.requestUpdate()
    }

    onSampleFilterChange(sampleFields) {
        console.log("onSampleFilterChange in variant-filter", sampleFields)
        //TODO refactor with proper optional spreading
        this.preparedQuery = {...this.preparedQuery, ...sampleFields};
        if(!sampleFields.genotype) {
            delete this.preparedQuery.genotype
        }
        if(!sampleFields.sample) {
            delete this.preparedQuery.sample
        }
        if(!sampleFields.format) {
            delete this.preparedQuery.format
        }
        this.preparedQuery = {...this.preparedQuery};
        this.notifyQuery(this.preparedQuery);
        this.requestUpdate()

    }

    //binding::from the view to this.query
    //most of those blocks have been refactored & moved in filterChange() in each filter component
    updateQueryFilters() {

        if (!this._initialised) {
            return;
        }

        console.log("this.query", this.query);

        let _filters = {};

        if (UtilsNew.isNotUndefinedOrNull(this.query.genotype)) {
            _filters.genotype = this.query.genotype;
        }
        if (UtilsNew.isNotUndefinedOrNull(this.query.format)) {
            _filters.format = this.query.format;
        }
        // if (UtilsNew.isNotUndefinedOrNull(this.query.file)) {
        //     _filters.file = this.query.file;
        // }
        // if (UtilsNew.isNotUndefinedOrNull(this.query.qual)) {
        //     _filters.qual = this.query.qual;
        // }
        if (UtilsNew.isNotUndefinedOrNull(this.query.info)) {
            _filters.info = this.query.info;
        }

        // Add Cohort stats ALT filter: [{study.alias}]:{cohort}[<|>|<=|>=]{number}
        //DONE moved to cohort-filter
        /*let cohortFreq = [];
        if (UtilsNew.isNotEmpty(this._cohorts)) {
            for (let studyId in this._cohorts) {
                for (let cohort of this._cohorts[studyId]) {
                    let cohortInput = PolymerUtils.getElementById(this._prefix + studyId + cohort.id + "Cohort");
                    let operator = PolymerUtils.getElementById(this._prefix + studyId + cohort.id + "CohortOperator");
                    if (cohortInput !== null && UtilsNew.isNotEmpty(cohortInput.value)) {
                        operator = operator.value;
                        // FIXME to be removed!!
                        if (studyId === "BRIDGE") {
                            studyId = "bridge";
                        }
                        let pf = studyId + ":" + cohort.id + operator + cohortInput.value;
                        cohortFreq.push(pf);
                    }
                }
            }
        }
        if (cohortFreq.length > 0) {
            // _filters["cohortStatsMaf"] = cohortFreq.join(';');
            _filters.cohortStatsAlt = cohortFreq.join(";");
        }*/


       /*
       //DONE Move DOM elements checking in study-filter
       // Studies - This section is not renderer when only study exists
       let studies = [this.opencgaSession.study.fqn];

        // PolymerUtils.querySelectorAll doesn't work here...
        //let selectedStudies = PolymerUtils.querySelectorAll("input:checked", "#" + this._prefix + "DifferentStudies");

       let selectedStudies = this.querySelector("#"+this._prefix+"DifferentStudies").querySelector("input:checked");

        //console.log("selectedStudies", selectedStudies)

        if (UtilsNew.isNotUndefinedOrNull(selectedStudies)) {
            for (let i = 0; i < selectedStudies.length; i++) {
                if (studies.indexOf(this.opencgaSession.project.alias + ":" + selectedStudies[i].value) === -1) {
                    studies.push(this.opencgaSession.project.alias + ":" + selectedStudies[i].value);
                }
            }
            switch (PolymerUtils.getElementById(this._prefix + "includeOtherStudy").value) {
            case "in":
                _filters.studies = studies.join(";");
                break;
            case "atleast":
                _filters.studies = studies.join(",");
                break;
            case "not in":
                let notInStudies = [];
                let currentStudy = this.opencgaSession.project.alias + ":" + this.opencgaSession.study.alias;
                for (let j = 0; j < studies.length; j++) {
                    if (currentStudy === studies[j]) {
                        // Always add the study that we are browsing currently
                        notInStudies.push(studies[j]);
                    } else {
                        notInStudies.push("!" + studies[j]);
                    }
                }
                _filters.studies = notInStudies.join(";");
                break;
            }
        } else {
            // Set study when no studies have been displayed, probably because there is only one study.
            //TODO add this case this.opencgaSession.study.fqn
            _filters.study = this.opencgaSession.study.fqn;
        }

        */


       //DONE Move DOM elements checking in file-filter
        /*
        Filter PASS
        let filePassCheckbox = PolymerUtils.getElementById(this._prefix + "FilePassCheckbox");
        if (UtilsNew.isNotUndefinedOrNull(filePassCheckbox) && filePassCheckbox.checked) {
            _filters.filter = "PASS";
        }
        // Filter QUAL
        let fileQualCheckbox = PolymerUtils.getElementById(this._prefix + "FileQualCheckbox");
        if (UtilsNew.isNotUndefinedOrNull(filePassCheckbox)) {
            if (fileQualCheckbox.checked) {
                let fileQualInput = PolymerUtils.getElementById(this._prefix + "FileQualInput");
                if (UtilsNew.isNotUndefinedOrNull(fileQualInput) && UtilsNew.isNotEmpty(fileQualInput.value)) {
                    _filters.qual = ">=" + fileQualInput.value;
                }
            }
            PolymerUtils.getElementById(this._prefix + "FileQualInput").disabled = !fileQualCheckbox.checked;
        }
        */


        //DONE Move DOM elements checking in region-filter
        /*let locationTextArea = PolymerUtils.getElementById(this._prefix + "LocationTextarea");
        if (UtilsNew.isNotUndefinedOrNull(locationTextArea) && UtilsNew.isNotEmpty(locationTextArea.value)) {
            let _region = locationTextArea.value.trim();
            _region = _region.replace(/\r?\n/g, ",").replace(/\s/g, "");
            _filters.region = _region;
        }*/

        //DONE moved in feature-filter
        // Features: Gene, SNP ID
        /*let featureTextArea = PolymerUtils.getElementById(this._prefix + "FeatureTextarea");
        if (UtilsNew.isNotUndefinedOrNull(featureTextArea) && UtilsNew.isNotEmpty(featureTextArea.value)) {
            let features = featureTextArea.value.trim();
            features = features.replace(/\r?\n/g, ",").replace(/\s/g, "");
            let featureArray = [];
            for (let feature of features.split(",")) {
                if (feature.startsWith("rs") || feature.split(":").length > 2) {
                    featureArray.push(feature);
                } else {
                    // Genes must be uppercase
                    featureArray.push(feature.toUpperCase());
                }
            }
            _filters.xref = featureArray.join(",");
        }*/

        //DONE moved to disease-filter
        // Disease Panel - panel
        /*let panelsDropdown = PolymerUtils.getElementById(this._prefix + "DiseasePanels");
        if (UtilsNew.isNotUndefinedOrNull(panelsDropdown)) {
            let selectedPanels = PolymerUtils.querySelectorAll("option:checked", panelsDropdown);
            let panels = [];
            selectedPanels.forEach(option => panels.push(option.value));
            if (panels.length > 0) {
                _filters.panel = panels.join(",");
                this.showPanelGenes(panels);
            }
        }*/

        // Biotype
        //DONE moved in biotype-filter (actually no, I don't need the whole block)
        /*let biotypeDropdown = PolymerUtils.getElementById(this._prefix + "GeneBiotypes");
        if (UtilsNew.isNotUndefinedOrNull(biotypeDropdown) && UtilsNew.isNotEmpty(biotypeDropdown.value)) {
            let types = PolymerUtils.querySelectorAll("option:checked", biotypeDropdown);
            let biotypes = [];
            types.forEach(option => biotypes.push(option.value));
            _filters.biotype = biotypes.join(",");
        }*/

        //DONE moved to variant-type-filter
        // Type
        /*let typeCheckbox = PolymerUtils.getElementById(this._prefix + "Type");
        if (UtilsNew.isNotUndefinedOrNull(typeCheckbox)) {
            let types = PolymerUtils.querySelectorAll("input:checked", typeCheckbox);
            let typesAux = [];
            if (types.length > 0) {
                for (let i = 0; i < types.length; i++) {
                    typesAux.push(types[i].value);
                }
                _filters.type = typesAux.join(",");
            }
        }
        */

        //DONE moved in population-frequency-filter
        // Population Frequencies
        // Population minor allele frequency: {study}:{population}[<|>|<=|>=]{number}
        /*let popFreq = [];
        if (UtilsNew.isNotUndefinedOrNull(this.populationFrequencies) && UtilsNew.isNotEmptyArray(this.populationFrequencies.studies)) {
            for (let i = 0; i < this.populationFrequencies.studies.length; i++) {
                let study = this.populationFrequencies.studies[i].id;
                for (let j = 0; j < this.populationFrequencies.studies[i].populations.length; j++) {
                    let population = this.populationFrequencies.studies[i].populations[j].id;

                    let studyTextbox = PolymerUtils.getElementById(this._prefix + study + population);
                    if ((UtilsNew.isNotUndefinedOrNull(studyTextbox) && UtilsNew.isNotEmpty(studyTextbox.value))) {
                        let operator = PolymerUtils.getElementById(this._prefix + study + population + "Operator");
                        let pf = study + ":" + population + operator.value + studyTextbox.value;
                        popFreq.push(pf);
                    }
                }
            }
        }
        if (popFreq.length > 0) {
            _filters["populationFrequencyAlt"] = popFreq.join(";");
        }*/

        //DONE moved in protein-substitution-score-filter
        /*
        // Protein Substitution Scores -  Sift and Polyphen
        let pss = [];
        let numFilters = 0;
        let subsScores = ["Sift", "Polyphen"];
        subsScores.forEach((subsScore) => {
            let dropdownValues = PolymerUtils.getElementById(this._prefix + subsScore + "Values");
            let textboxInput = PolymerUtils.getElementById(this._prefix + subsScore + "Input");
            let operator = PolymerUtils.getElementById(this._prefix + subsScore + "Operator");
            if (dropdownValues !== null && dropdownValues.value === "score" && UtilsNew.isNotEmpty(textboxInput.value)) {
                pss.push(subsScore.toLowerCase() + operator.value + textboxInput.value);
                numFilters++;
            } else if (dropdownValues !== null && dropdownValues.value !== "score") {
                pss.push(subsScore.toLowerCase() + "==" + dropdownValues.value);
                numFilters++;
            }
        });

        // If both Sift and Polyphen are selected then we activate the AND/OR control
        if (numFilters === 2) {
            $("input:radio[name=pss]").attr("disabled", false);
        }
        if (pss.length > 0) {
            let filter = $("input:radio[name=pss]:checked").val();
            if (filter === "and") {
                _filters.protein_substitution = pss.join(";");
            } else {
                _filters.protein_substitution = pss.join(",");
            }
        }*/

        //DONE moved to cadd-filter
        // Cadd scores
        /*let cadd = [];
        let caddRawInput = PolymerUtils.getElementById(this._prefix + "CaddRawInput");
        let caddScaledInput = PolymerUtils.getElementById(this._prefix + "CaddScaledInput");
        if (UtilsNew.isNotUndefinedOrNull(caddRawInput) && UtilsNew.isNotUndefinedOrNull(caddScaledInput)) {
            if (UtilsNew.isNotEmpty(caddRawInput.value)) {
                cadd.push("cadd_raw" + PolymerUtils.getElementById(this._prefix + "CaddRawOperator").value + caddRawInput.value);
            }
            if (UtilsNew.isNotEmpty(caddScaledInput.value)) {
                cadd.push("cadd_scaled" + PolymerUtils.getElementById(this._prefix + "CaddScaledOperator").value + caddScaledInput.value);
            }
        }
        if (cadd.length > 0) {
            _filters["annot-functional-score"] = cadd.join(",");
        }

         */

        //DONE moved in conservation-filter
        /*// Conservation
        let arr = {"Phylop": "phylop", "Phastcons": "phastCons", "Gerp": "gerp"};
        let conserArr = [];
        for (let key of Object.keys(arr)) {
            let inputTextArea = PolymerUtils.getElementById(this._prefix + key + "Input");
            if (UtilsNew.isNotUndefinedOrNull(inputTextArea) && UtilsNew.isNotEmpty(inputTextArea.value)) {
                let operator = PolymerUtils.getElementById(this._prefix + key + "Operator");
                conserArr.push(arr[key] + operator.value + inputTextArea.value);
            }
        }
        // Disable OR/AND logical operator
        if (conserArr.length > 1) {
            $("input:radio[name=conservation]").attr("disabled", false);
        } else {
            $("input:radio[name=conservation]").attr("disabled", true);
        }
        if (conserArr.length > 0) {
            let filter = $("input:radio[name=conservation]:checked").val();
            if (filter === "and") {
                _filters.conservation = conserArr.join(";");
            } else {
                _filters.conservation = conserArr.join(",");
            }
        }*/

        //DONE moved in consequence-type-filter
        // Consequence Type
        /*
        if (UtilsNew.isNotEmptyArray(this.ct)) {
            _filters["ct"] = this.ct.join(",");
        }*/

        //DONE moved go-accessions-filter
        // Gene Ontology and Human Phenotype Ontology
        /*
        let inputTextArea = PolymerUtils.getElementById(this._prefix + "GeneOntologyTextarea");
        if (UtilsNew.isNotUndefinedOrNull(inputTextArea) && UtilsNew.isNotEmpty(inputTextArea.value)) {
            let _go = inputTextArea.value.trim();
            _go = _go.replace(/\r?\n/g, ",").replace(/\s/g, "");
            _filters.go = _go;
        }*/

        //DONE moved to hpo-accessions-filter
        /*let inputTextArea = PolymerUtils.getElementById(this._prefix + "HumanPhenotypeOntologyTextarea");
        if (UtilsNew.isNotUndefinedOrNull(inputTextArea) && UtilsNew.isNotEmpty(inputTextArea.value)) {
            let hpoValues = inputTextArea.value.split(",");

            if (UtilsNew.isNotEmptyArray(hpoValues)) {
                $("input:radio[name=hpoRadio]").attr("disabled", false);
                let filter = $("input:radio[name=hpoRadio]:checked").val();
                if (filter === "and") {
                    _filters["annot-hpo"] = hpoValues.join(";");
                } else {
                    _filters["annot-hpo"] = hpoValues.join(",");
                }
            }
            // _filters["annot-hpo"] = inputTextArea.value;
        }*/

        //DONE moved to clinvar-accessions-filter
/*        let inputTextArea = PolymerUtils.getElementById(this._prefix + "ClinVarTextarea");
        if (UtilsNew.isNotUndefinedOrNull(inputTextArea) && UtilsNew.isNotEmpty(inputTextArea.value)) {
            let _clinvar = inputTextArea.value.trim();
            _clinvar = _clinvar.replace(/\r?\n/g, ",").replace(/\s/g, "");
            _filters.clinvar = _clinvar;
        }*/

        //DONE fulltext-search-accessions-filter
        /*let inputTextArea = PolymerUtils.getElementById(this._prefix + "TraitsTextarea");
        if (UtilsNew.isNotUndefinedOrNull(inputTextArea) && UtilsNew.isNotEmpty(inputTextArea.value)) {
            _filters["traits"] = inputTextArea.value;
        }*/

        // To prevent to call setQueryFilters we set this to false
        // this._reset = false;
        // this.query = _filters;
        // this._reset = true;
        //
        // this.notifyQuery(this.query)

        // this.requestUpdate()
    }

    //DONE implemented in feature-filter
    /*
    callAutocomplete(e) {
        // Only gene symbols are going to be searched and not Ensembl IDs
        let featureId = PolymerUtils.getElementById(this._prefix + "FeatureIdText").value;
        if (UtilsNew.isNotUndefinedOrNull(featureId) && featureId.length >= 3 && !featureId.startsWith("ENS")) {
            let _this = this;
            _this.cellbaseClient.get("feature", "id", featureId.toUpperCase(), "starts_with", {}, {})
                .then(function (response) {
                    let options = "";
                    for (let id of response.response[0].result) {
                        options += `<option value="${id.name}">`;
                    }
                    PolymerUtils.innerHTML(_this._prefix + "FeatureDatalist", options);
                });
        }
    }

    //DONE implemented in feature-filter
    addFeatureId(e) {
        let allIds = [];
        let featureTextArea = PolymerUtils.getElementById(this._prefix + "FeatureTextarea");
        if (UtilsNew.isNotUndefinedOrNull(featureTextArea) && UtilsNew.isNotEmpty(featureTextArea.value)) {
            allIds = featureTextArea.value.split(",");
        }

        let featureIdText = PolymerUtils.getElementById(this._prefix + "FeatureIdText");
        if (allIds.indexOf(featureIdText.value) === -1) {
            allIds.push(featureIdText.value);
        }
        featureIdText.value = "";
        featureTextArea.value = allIds;

        this.updateQueryFilters();
    }
     */


    //TODO recheck if there is no other way...
    _clearHtmlDom() {
        // Empty everything before rendering
        $("." + this._prefix + "FilterSelect").prop("selectedIndex", 0);
        $("." + this._prefix + "FilterSelect").prop("disabled", false);

        //handled in population-frequency-filter
        //TODO many other components use this!
        $("." + this._prefix + "FilterTextInput").val("");
        $("." + this._prefix + "FilterTextInput").prop("disabled", false);

        $("." + this._prefix + "FilterCheckBox").prop("checked", false);
        $("." + this._prefix + "FilterRadio").prop("checked", false);
        $("." + this._prefix + "FilterRadio").filter("[value=\"or\"]").prop("checked", true);
        $("." + this._prefix + "FilterRadio").prop("disabled", true);

        $("#" + this._prefix + "DiseasePanelsTextarea").val("");
        if (PolymerUtils.getElementById(this._prefix + "FileQualInput") !== null) {
            PolymerUtils.getElementById(this._prefix + "FileQualInput").disabled = true;
        }

        // Deselect bootstrap-select dropdowns

        //handled in updated() in disease-filter
        //$("#" + this._prefix + "DiseasePanels").selectpicker("val", []);
        //handled in updated() in biotype-filter
        //$("#" + this._prefix + "GeneBiotypes").selectpicker("val", []);

        $("#" + this._prefix + "vcfFilterSelect").selectpicker("val", []);
    }


    // This method is only executed one time from connectedCallback function
    // TODO recheck if it really needs to be executed in opencgaSessionObserver()
    _renderFilterMenu() {


        // Add events and tooltips to the filter menu
        // TODO move listeners in template
        // TODO move tooltips init somewhere after template has been rendered
        //this._addEventListeners();
        return this.config.menu.sections && this.config.menu.sections.length && this.config.menu.sections.map(section => this._createSection(section));
    }

    _createSection(section) {
        let id = section.title.replace(/ /g, "");
        let collapsed = section.collapsed ? "" : "in";

        //TODO check if the continue statement was necessary
        return html`
                    <div class="panel panel-default filter-section">
                        <div class="panel-heading" role="tab" id="${this._prefix}${id}Heading">
                            <h4 class="panel-title">
                                <a class="collapsed" role="button" data-toggle="collapse" data-parent="#${this._prefix}Accordion"
                                    href="#${this._prefix}${id}" aria-expanded="true" aria-controls="${this._prefix}${id}">
                                    ${section.title}
                                </a>
                            </h4>
                        </div>
                        <div id="${this._prefix}${id}" class="panel-collapse collapse ${collapsed}" role="tabpanel" aria-labelledby="${this._prefix}${id}Heading">
                            <div class="panel-body">
                                <!--TODO verify if cadd condition works-->
                                ${section.subsections && section.subsections.length && section.subsections.map(subsection => html`
                                     
                                                                   
                                    <!--${subsection.id === "cadd" && this.opencgaSession.project.organism.assembly.toLowerCase() === "grch38" ? html`/continue_statement_missing/` : html``} -->
                                    
                                    ${this.config.menu.skipSubsections && this.config.menu.skipSubsections.length && !!~this.config.menu.skipSubsections.indexOf(subsection.id) ? null : this._createSubSection(subsection)}
                                    
                                `)}
                            
                             </div>
                        </div>
                    </div>
                `;

    }

    _createSubSection(subsection) {
        // ConsequenceType needs horizontal scroll
        let ctScroll = (subsection.id === "consequenceType") ? "browser-ct-scroll" : "";


        let content = "";
        switch (subsection.id) {
        case "study":
            if (this.opencgaSession.project.studies.length < 2) {
                return "";
            }
            content = html`<study-filter .opencgaSession="${this.opencgaSession}" .differentStudies="${this.differentStudies}" .studies="${this.preparedQuery.studies}" @filterChange="${e => this.onFilterChange("studies", e.detail.value)}"></study-filter>`;
            break;
        case "cohort":
            content = html`<cohort-filter .opencgaSession="${this.opencgaSession}" .cohorts="${subsection.cohorts}" ._cohorts="${this._cohorts}" .cohortStatsAlt="${this.preparedQuery.cohortStatsAlt}" @filterChange="${e => this.onFilterChange("cohortStatsAlt", e.detail.value)}"> </cohort-filter>`;
            break;
        case "sample":
            content = html`<sample-filter ?enabled="${subsection.showSelectSamples}" .opencgaSession="${this.opencgaSession}" .clinicalAnalysis="${this.clinicalAnalysis}" .query="${this.query}" @sampleFilterChange="${e => this.onSampleFilterChange(e.detail.value)}"></sample-filter>`;
            break;
        case "file":
            /** @deprecated */
            content = html`<file-filter .query="${this.query}" @filterChange="${e => this.onFilterChange("filter", e.detail.value)}"></file-filter>`;
            break;
        case "file-pass":
            content = html`<file-pass-filter .filter="${this.preparedQuery.filter}" @filterChange="${e => this.onFilterChange("filter", e.detail.value)}"></file-pass-filter>`;
            break;
        case "file-qual":
            content = html`<file-qual-filter .qual="${this.preparedQuery.qual}" @filterChange="${e => this.onFilterChange("qual", e.detail.value)}"></file-qual-filter>`;
            break;
        case "location":
            content = html`<region-filter .cellbaseClient="${this.cellbaseClient}" .region="${this.preparedQuery.region}" 
                                           @filterChange="${e => this.onFilterChange("region", e.detail.value)}"></region-filter>`;
            break;
        case "feature":
            content = html`<feature-filter .cellbaseClient="${this.cellbaseClient}" .query=${this.query}
                                            @filterChange="${e => this.onFilterChange("xref", e.detail.value)}"></feature-filter>`;
            break;
        case "diseasePanels":
            content = html`<disease-filter .opencgaSession="${this.opencgaSession}" .config="${this.config}" .panel="${this.preparedQuery.panel}" 
                                @filterChange="${e => this.onFilterChange("panel", e.detail.value)}"></disease-filter>`;
            break;
        case "biotype":
            content = html`<biotype-filter .config="${this.config}" .biotype=${this.preparedQuery.biotype} @filterChange="${e => this.onFilterChange("biotype", e.detail.value)}"></biotype-filter>`;
            break;
        case "type":
            content = html`<variant-type-filter .config="${this.config}" .type="${this.preparedQuery.type}" .cellbaseClient="${this.cellbaseClient}" @filterChange="${e => this.onFilterChange("type", e.detail.value)}"></variant-type-filter>`;
            break;
        case "populationFrequency":
            content = html`<population-frequency-filter .populationFrequencies="${this.populationFrequencies}" ?showSetAll="${subsection.showSetAll}" .populationFrequencyAlt="${this.preparedQuery.populationFrequencyAlt}" @filterChange="${e => this.onFilterChange("populationFrequencyAlt", e.detail.value)}"></population-frequency-filter>`;
            break;
        case "consequenceType":
            content = html`<consequence-type-filter .consequenceTypes="${this.consequenceTypes}" .ct="${this.preparedQuery.ct}"  @filterChange="${e => this.onFilterChange("ct", e.detail.value)}"></consequence-type-filter>`;
            break;
        case "proteinSubstitutionScore":
            content = html`<protein-substitution-score-filter .protein_substitution="${this.preparedQuery.protein_substitution}" @filterChange="${e => this.onFilterChange("protein_substitution", e.detail.value)}"></protein-substitution-score-filter>`;
            break;
        case "cadd":
            if (this.opencgaSession.project.organism.assembly.toLowerCase() === "grch38") {
                return "";
            }
            content = html`<cadd-filter .annot-functional-score="${this.preparedQuery["annot-functional-score"]}" @filterChange="${e => this.onFilterChange("annot-functional-score", e.detail.value)}"></cadd-filter>`;
            break;
        case "conservation":
            content = html`<conservation-filter .conservation="${this.preparedQuery.conservation}" @filterChange="${e => this.onFilterChange("conservation", e.detail.value)}"></conservation-filter>`;
            break;
        case "go":
            content = html`<go-accessions-filter .go="${this.go}" @ontologyModalOpen="${this.onOntologyModalOpen}" @filterChange="${e => this.onFilterChange("go", e.detail.value)}"></go-accessions-filter>`;
            break;
        case "hpo":
            content = html`<hpo-accessions-filter .annot-hpo="${this.preparedQuery["annot-hpo"]}" @ontologyModalOpen="${this.onOntologyModalOpen}" @filterChange="${e => this.onFilterChange("annot-hpo", e.detail.value)}"></hpo-accessions-filter>`;
            break;
        case "clinvar":
            content = html`<clinvar-accessions-filter .clinvar="${this.preparedQuery.clinvar}" @filterChange="${e => this.onFilterChange("clinvar", e.detail.value)}"></clinvar-accessions-filter>`;
            break;
        case "fullTextSearch":
            content = html`<fulltext-search-accessions-filter .traits="${this.preparedQuery.traits}" @filterChange="${e => this.onFilterChange("traits", e.detail.value)}"></fulltext-search-accessions-filter>`;
            break;
        default:
            console.error("Filter component not found");
        }

        return html`
                    <div class="form-group">
                        <div class="browser-subsection" id="${subsection.id}" name="${subsection.title}">${subsection.title}
                            <div class="tooltip-div pull-right">
                                <a><i class="fa fa-info-circle" aria-hidden="true" id="${this._prefix}${subsection.id}Tooltip"></i></a>
                            </div>
                        </div>
                        <div id="${this._prefix}${subsection.id}" class="subsection-content ${ctScroll}">
                            ${content}
                         </div>
                    </div>
                `;
    }
/*

    //study-filter
    _getStudyHtml() {
        return html`
            <select class="form-control input-sm ${this._prefix}FilterSelect" id="${this._prefix}includeOtherStudy" @change="${this.updateQueryFilters}">
                <option value="in" selected>In all (AND)</option>
                <option value="atleast">In any of (OR)</option>
            </select>
            <div id="${this._prefix}DifferentStudies" class="form-group">
                <br>
                <input type="checkbox" value="${this.opencgaSession.study.alias}" data-id="${this.opencgaSession.study.id}" checked disabled >
                <span style="font-weight: bold;font-style: italic;color: darkred">${this.opencgaSession.study.alias}</span>
                ${this.differentStudies && this.differentStudies.length && this.differentStudies.map(study => html`
                            <br>
                            <input id="${this._prefix}${study.alias}Checkbox" type="checkbox" @click="${this.updateQueryFilters}" value="${study.alias}" data-id="${study.id}" class="${this._prefix}FilterCheckBox">
                            ${study.alias}
                `)}
            </div>
        `;
    }

    //cohort-filter
    _getCohortHtml(cohorts) {
        let projectId = this.opencgaSession.project.id;
        let cohortsPerStudy = cohorts[projectId];

        return cohortsPerStudy ? html`
            ${Object.keys(cohortsPerStudy).map(study => html`
                <div style="padding: 5px 0px">
                    <div style="padding-bottom: 5px">
                        <span style="font-style: italic">COHORT HTML${study}</span> study:
                    </div>
                    <div class="form-horizontal">
                        ${cohortsPerStudy[study] && cohortsPerStudy[study].map(cohort => html`
                            <div class="form-group" style="margin: 5px 0px">
                                <span class="col-md-4 control-label">${cohort.name}</span>
                                <div class="col-md-4" style="padding: 0px 10px">
                                    <select id="${this._prefix}${study}${cohort.id}CohortOperator" name="${cohort.id}Operator"
                                            class="form-control input-sm ${this._prefix}FilterSelect" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                        <option value="<" selected><</option>
                                        <option value="<="><=</option>
                                        <option value=">">></option>
                                        <option value=">=">>=</option>
                                    </select>
                                </div>
                                <div class="col-md-4" style="padding: 0px 10px">
                                    <input type="text" value="" class="form-control input-sm ${this._prefix}FilterTextInput"
                                           name="${study}_${cohort.id}" id="${this._prefix}${study}${cohort.id}Cohort" @change="${this.updateQueryFilters}">
                                </div>
                            </div>
                        `)}
                    </div>
                </div>`)}
        ` : html`
            <span>Project not found</span>
        `;
    }

    //sample-filter
    _getSampleHtml(subsection) {
        return subsection.showSelectSamples ? html`
            <div>
                <div style="padding: 10px 0px">Select Genotype Filter:</div>
                <div style="padding-left: 20px">
                    <button id="${this._prefix}SampleFilterModalButton" type="button" class="btn btn-default" style="width: 80%" @click="${this.onSampleFilterClick}">
                        Sample Filters ...
                    </button>
                </div>
            </div>
            <div style="padding: 10px 0px 5px 0px">
                <div style="padding: 15px 0px;">
                    <span>Sample Genotype Summary</span>
                </div>
                <table class="table" style="margin-bottom: 10px">
                    <thead>
                    <tr>
                        <th scope="col">Sample ID</th>
                        <th scope="col">GT</th>
                    </tr>
                    </thead>
                    <tbody id="${this._prefix}SampleFiltersSummaryTBody">
                    <tr>
                        <td>No samples selected</td>
                        <td></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        ` : ``;
    }

    //file-filter
    _getFileHtml() {
        return html`
            <div class="row">
                <div class="col-md-12">
                    <input id="${this._prefix}FilePassCheckbox" type="checkbox" class="${this._prefix}FilterCheckBox" @change="${this.updateQueryFilters}"><span
                        style="padding-left: 5px">Only include <span style="font-weight: bold;">PASS</span> variants</span>
                </div>
                <form class="form-horizontal">
                    <div class="form-group col-md-12">
                        <div class="col-md-8">
                            <input id="${this._prefix}FileQualCheckbox" type="checkbox"
                                   class="${this._prefix}FilterCheckBox" @change="${this.updateQueryFilters}"><span style="padding-left: 5px">Introduce min. <span
                                style="font-weight: bold;">QUAL</span></span>
                        </div>
                        <div class="col-md-4">
                            <input id="${this._prefix}FileQualInput" type="text" class="form-control input-sm ${this._prefix}FilterTextInput" disabled @keyup="${this.updateQueryFilters}">
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    //cellbase-region-filter
    _getLocationHtml() {
        return html`<textarea id="${this._prefix}LocationTextarea" name="location" class="form-control clearable ${this._prefix}FilterTextInput" rows="3" placeholder="3:444-55555,1:1-100000" @keyup="${this.updateQueryFilters}"></textarea>`;
    }

    //feature-filter
    _getFeatureHtml() {
        return html`
            <div class="row">
                <div class="col-md-9">
                    <input id="${this._prefix}FeatureIdText" type="text" class="form-control"
                           list="${this._prefix}FeatureDatalist"
                           placeholder="Search for Gene Symbols" value="" @keyup="${this.callAutocomplete}">
                    <datalist id="${this._prefix}FeatureDatalist"></datalist>
                </div>
                <div class="col-md-3">
                    <button id="${this._prefix}FeatureAddButton" type="button" class="btn btn-default btn-sm form-control" @click="${this.addFeatureId}">
                        <i class="fa fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <textarea id="${this._prefix}FeatureTextarea" name="geneSnp"
                    class="form-control clearable ${this._prefix}FilterTextInput"
                    rows="3" placeholder="BRCA2,ENSG00000139618,ENST00000544455,rs28897700"
                    style="margin-top: 5px" @keyup="${this.updateQueryFilters}"></textarea>
            </div>
        `;
    }

    //disease-filter
    _getDiseasePanelsHtml() {
        return html`
            <div>
                <select id="${this._prefix}DiseasePanels" class="selectpicker" data-size="10" data-live-search="true" data-selected-text-format="count" multiple @change="${this.updateQueryFilters}">
                    ${this.opencgaSession.study.panels && this.opencgaSession.study.panels.length && this.opencgaSession.study.panels.map(panel => html`
                        <option value="${panel.id}">
                            ${panel.name}
                            ${panel.source ? "v" + panel.source.version : ""}
                            ( ${panel.stats ? panel.stats.numberOfGenes + "genes, " + panel.stats.numberOfRegions + "regions" : "0 genes, 0 regions"})
                        </option>
                    `)}
                </select>
            <textarea id="${this._prefix}DiseasePanelsTextarea" class="form-control" rows="4" style="margin-top: 5px;background: #f7f7f7" disabled> </textarea>
            </div>
        `;
    }

    //cellbase-biotype-filter
    _getBiotypeHtml(biotypes = []) {
        return html`
            <select class="selectpicker" id="${this._prefix}GeneBiotypes" data-size="10" data-live-search="true" data-selected-text-format="count" multiple @change="${this.updateQueryFilters}">
                ${biotypes.map(biotype => html`
                     <option value="${biotype}">${biotype}</option>
                `)}
            </select>
        `;
    }

    //varianty-type=filter
    _getVariantTypeHtml(types) {
        return html`
            <div id="${this._prefix}Type">
                ${types && types.length && types.map(type => html`
                    <input type="checkbox" value="${type}" class="${this._prefix}FilterCheckBox" @change="${this.updateQueryFilters}"> ${type}<br>
                `)}
            </div>
        `;
    }

    //population-frequency-filter
    _getPopulationFrequencyHtml(showSetAll) {
        return html`
                        ${this.populationFrequencies.studies && this.populationFrequencies.studies.length && this.populationFrequencies.studies.map(study => html`
                            <div style="padding-top: 10px">
                                <i id="${this._prefix}${study.id}Icon" data-id="${this._prefix}${study.id}" class="fa fa-plus" style="cursor: pointer;padding-right: 10px" @click="${this.handleCollapseAction}"></i>
                                <strong>${study.title}</strong>
                                <div id="${this._prefix}${study.id}" class="form-horizontal" hidden>
                                    ${showSetAll ? html`
                                        <div class="form-group" style="margin: 5px 0px">
                                            <span class="col-md-7 control-label" data-toggle="tooltip" data-placement="top" style="text-align: left;">Set all</span>
                                            <div class="col-md-5" style="padding: 0px 10px">
                                                <input id="${this._prefix}${study.id}Input" type="text" data-study="${study.id}" value="" class="form-control input-sm ${this._prefix}FilterTextInput"
                                                name="${study.id}Input" @keyup="${this.keyUpAllPopFreq}" @change="${this.updateQueryFilters}" >
                                            </div>
                                        </div>
                                    ` : ""}
                                    ${study.populations && study.populations.length && study.populations.map(popFreq => html`
                                        <div class="form-group" style="margin: 5px 0px">
                                            <span class="col-md-3 control-label" data-toggle="tooltip" data-placement="top" title="${popFreq.title}">${popFreq.id}</span>
                                            <div class="col-md-4" style="padding: 0px 10px">
                                                <select id="${this._prefix}${study.id}${popFreq.id}Operator" name="${popFreq.id}Operator"
                                                        class="form-control input-sm ${this._prefix}FilterSelect" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                                    <option value="<" selected><</option>
                                                    <option value="<="><=</option>
                                                    <option value=">">></option>
                                                    <option value=">=">>=</option>
                                                </select>
                                            </div>
                                            <div class="col-md-5" style="padding: 0px 10px">
                                                <input id="${this._prefix}${study.id}${popFreq.id}" type="text" value="" class="form-control input-sm ${this._prefix}FilterTextInput"
                                                        name="${study.id}_${popFreq.id}" @keyup="${this.updateQueryFilters}">
                                            </div>
                                        </div>
                                    `)}
                                </div>
                            </div>
                        `)}
                `;
    }

    //consequence-type-filter
    _getConsequenceTypeHtml() {
        return html`
                    <div style="padding-top: 15px">Loss-of-Function (LoF) terms:</div>
                        <div class="form-check" style="margin-top: 5px;">
                            <div class="form-check-label">
                                <label id="${this._prefix}LossOfFunctionCheckBoxLabel" class="notbold">
                                    <input id="${this._prefix}LossOfFunctionCheckBox" type="checkbox" class="${this._prefix}FilterCheckBox"
                                           style="cursor: pointer" @change="${this.updateConsequenceTypeFilter}" />
                                    LoF terms
                                </label>
                            </div>
                        </div>
                        <div style="padding-top: 15px">Consequence Type terms:</div>
                        <div class="browser-ct-tree-view browser-ct-item">
                            <ul id="${this._prefix}consequenceTypeFilter">
                                ${this.consequenceTypes.categories && this.consequenceTypes.categories.length && this.consequenceTypes.categories.map(category => html`
                                    <li id="${category.title ? category.title : category.name}" class="form-check" style="margin-top: 10px;">
                                        ${category.terms && category.terms.length ? html`
                                            <label class="form-check-label notbold">
                                                <input id="${this._prefix}${category.title}Input" type="checkbox" class="${this._prefix}FilterCheckBox" @change="${this.updateConsequenceTypeFilter}"> ${category.title}
                                            </label>
                                            <ul>
                                                ${category.terms.map(item => html`
                                                    <li class="form-check">
                                                        <label class="form-check-label notbold">
                                                            <input id="${this._prefix}${item.name}Checkbox" type="checkbox" data-id="${item.name}" class="soTermCheckBox ${this._prefix}FilterCheckBox" @change="${this.updateConsequenceTypeFilter}">
                                                                <span title="${item.description}">
                                                                    ${item.name} (<a href="http://www.sequenceontology.org/browser/current_svn/term/${item.id}" target="_blank">${item.id}</a>)
                                                                </span>
                                                        </label>
                                                    </li>
                                                `)}
                                            </ul>
                                        ` : html`
                                            <input id="${this._prefix}${category.name}Checkbox" type="checkbox"
                                                       data-id="${category.name}" class="soTermCheckBox ${this._prefix}FilterCheckBox" @change="${this.updateConsequenceTypeFilter}">
                                                <span title="${category.description}">
                                                    ${category.name} (<a href="http://www.sequenceontology.org/browser/current_svn/term/${category.id}" target="_blank">${category.id}</a>)
                                                </span>
                                        `}
                                    </li>
                                `)}
                            </ul>
                        </div>
                    </div>
                `;
    }
    //proteine-substitution-score-filter
    _getProteinSubstitutionScoreHtml() {
        return html`
                    <div style="padding-top: 10px">
                        <span style="padding-left: 0px;">SIFT</span>
                        <div class="row">
                            <div class="col-md-5" style="padding-right: 5px">
                                <select  name="Sift" id="${this._prefix}SiftValues" class="${this._prefix}FilterSelect form-control input-sm options" @change="${this.checkScore}">
                                    <option value="score" selected>Score...</option>
                                    <option value="tolerated">Tolerated</option>
                                    <option value="deleterious">Deleterious</option>
                                </select>
                            </div>
                            <div class="col-md-3" style="padding: 0px 5px">
                                <select name="siftOperator" id="${this._prefix}SiftOperator" class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value="<"><</option>
                                    <option value="<="><=</option>
                                    <option value=">"selected>></option>
                                    <option value=">=">>=</option>
                                </select>
                            </div>
                            <div class="col-md-4" style="padding-left: 5px">
                                <input id="${this._prefix}SiftInput" name="Sift" type="text" value=""
                                            class="${this._prefix}FilterTextInput form-control input-sm" @keyup="${this.updateQueryFilters}">
                            </div>
                        </div>
                    </div>

                    <div style="padding-top: 15px">
                        <span style="padding-top: 10px;padding-left: 0px;">Polyphen</span>
                        <div class="row">
                            <div class="col-sm-5" style="padding-right: 5px">
                                <select name="Polyphen" id="${this._prefix}PolyphenValues" class="${this._prefix}FilterSelect form-control input-sm options" @change="${this.checkScore}">
                                    <option value="score" selected>Score...</option>
                                    <option value="benign">Benign</option>
                                    <option value="unknown">Unknown</option>
                                    <option value="possibly damaging">Possibly damaging</option>
                                    <option value="probably damaging">Probably damaging</option>
                                    <option value="possibly damaging,probably damaging">Possibly & Probably damaging</option>
                                </select>
                            </div>
                            <div class="col-sm-3" style="padding: 0px 5px">
                                <select name="polyphenOperator" id="${this._prefix}PolyphenOperator" class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value=">" selected>></option>
                                    <option value=">=">>=</option>
                                    <option value="<" ><</option>
                                    <option value="<="><=</option>
                                </select>
                            </div>
                            <div class="col-sm-4" style="padding-left: 5px">
                                <input type="text" value="" class="${this._prefix}FilterTextInput form-control input-sm"
                                            id="${this._prefix}PolyphenInput" name="Polyphen" @keyup="${this.updateQueryFilters}">
                            </div>
                        </div>

                        <form style="padding-top: 15px">
                            <label style="font-weight: normal;">Logical Operator</label>
                            <input type="radio" name="pss" id="${this._prefix}pssOrRadio" value="or" class="${this._prefix}FilterRadio"
                                    checked disabled  style="margin-left: 10px" @change="${this.updateQueryFilters}"> OR<br>
                            <input type="radio" name="pss" id="${this._prefix}pssAndRadio" value="and"
                                    class="${this._prefix}FilterRadio" disabled style="margin-left: 102px" @change="${this.updateQueryFilters}"> AND  <br>
                        </form>
                        <br>
                    </div>
                `;
    }

    //cadd-filter
    _getCaddHtml() {
        return html`
                    <div style="padding-top: 10px">
                        <div class="row">
                            <div class="col-md-5 form-group" style="padding-right: 5px">
                                <span class="control-label">Raw</span>
                            </div>
                            <div class="col-md-3" style="padding: 0px 5px">
                                <select name="caddRawOperator" id="${this._prefix}CaddRawOperator"
                                 class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value="<"><</option>
                                        <option value="<="><=</option>
                                        <option value=">" selected>></option>
                                        <option value=">=">>=</option>
                                </select>
                            </div>
                            <div class="col-md-4" style="padding-left: 5px">
                                <input type="text" value="" class="${this._prefix}FilterTextInput form-control input-sm"
                                   id="${this._prefix}CaddRawInput" name="caddRaw" @keyup="${this.updateQueryFilters}">
                            </div>

                        </div>
                    </div>

                    <div style="padding-top: 10px">
                        <div class="row">
                            <span class="col-md-5 control-label" style="padding-right: 5px">Scaled</span>
                            <div class="col-md-3" style="padding: 0px 5px">
                                <select name="caddRScaledOperator" id="${this._prefix}CaddScaledOperator"
                                class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value="<" selected><</option>
                                    <option value="<="><=</option>
                                    <option value=">">></option>
                                    <option value=">=">>=</option>
                                </select>
                            </div>
                            <div class="col-md-4" style="padding-left: 5px">
                                <input type="text" value="" class="${this._prefix}FilterTextInput form-control input-sm"
                                       id="${this._prefix}CaddScaledInput" name="caddScaled" @keyup="${this.updateQueryFilters}">
                            </div>
                        </div>
                    </div>
                `;
    }

    //conservation-filter
    _getConservationHtml() {
        return html`
                    <div style="padding-top: 10px">
                        <div class="row">
                            <span class="col-md-5 control-label" style="padding-right: 5px"> PhyloP</span>
                            <div class="col-md-3" style="padding: 0px 5px">
                                <select name="phylopOperator" id="${this._prefix}PhylopOperator" class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value="<"><</option>
                                    <option value="<="><=</option>
                                    <option value=">" selected>></option>
                                    <option value=">=">>=</option>
                                </select>
                            </div>
                            <div class="col-md-4" style="padding-left: 5px">
                                <input type="text" value="" class="${this._prefix}FilterTextInput form-control input-sm"
                                   id="${this._prefix}PhylopInput" name="phylop" @keyup="${this.updateQueryFilters}">
                            </div>
                        </div>
                    </div>

                     <div style="padding-top: 10px">
                        <div class="row">
                            <span class="col-md-5 control-label" style="padding-right: 5px">PhastCons</span>
                            <div class="col-md-3" style="padding: 0px 5px">
                                <select name="phastconsOperator" id="${this._prefix}PhastconsOperator"
                                       class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value="<" ><</option>
                                    <option value="<="><=</option>
                                    <option value=">" selected>></option>
                                    <option value=">=">>=</option>
                                </select>
                            </div>
                            <div class="col-md-4" style="padding-left: 5px">
                                <input type="text" value="" class="${this._prefix}FilterTextInput form-control input-sm"
                                   id="${this._prefix}PhastconsInput" name="phastCons" @keyup="${this.updateQueryFilters}">
                            </div>
                        </div>
                    </div>

                    <div style="padding-top: 10px">
                        <div class="row">
                            <span class="col-md-5 control-label" style="padding-right: 5px">Gerp</span>
                            <div class="col-md-3" style="padding: 0px 5px">
                                <select name="gerpOperator" id="${this._prefix}GerpOperator"
                                        class="${this._prefix}FilterSelect form-control input-sm" style="padding: 0px 5px" @change="${this.updateQueryFilters}">
                                    <option value="<"><</option>
                                    <option value="<="><=</option>
                                    <option value=">" selected>></option>
                                    <option value=">=">>=</option>
                                </select>
                             </div>
                            <div class="col-md-4" style="padding-left: 5px">
                                <input type="text" value="" class="${this._prefix}FilterTextInput form-control input-sm"
                                        id="${this._prefix}GerpInput" name="gerp" @keyup="${this.updateQueryFilters}">
                            </div>
                        </div>

                        <form style="padding-top: 15px">
                            <label style="font-weight: normal;">Logical Operator</label>
                            <input type="radio" name="conservation" id="${this._prefix}conservationOrRadio" value="or"
                                    class="${this._prefix}FilterRadio" checked disabled style="margin-left: 10px" @change="${this.updateQueryFilters}"> OR<br>
                            <input type="radio" name="conservation" id="${this._prefix}conservationAndRadio" value="and"
                                    class="${this._prefix}FilterRadio" disabled style="margin-left: 102px" @change="${this.updateQueryFilters}"> AND<br>
                        </form>
                    </div>
                `;
    }

    //go-accessions-filter
    _getGoAccessionsHtml() {
        return html`
                    <textarea id="${this._prefix}GeneOntologyTextarea" class="form-control clearable ${this._prefix}FilterTextInput"
                                rows="3" name="geneOntology" placeholder="GO:0000145" @keyup="${this.updateQueryFilters}"></textarea>
                    <span class="input-group-addon btn btn-primary searchingSpan" id="${this._prefix}buttonOpenGoAccesions" @click="${this.openModalGo}">
                        <strong style="color: white">Add GO Term</strong>
                        <i class="fa fa-search searchingButton" aria-hidden="true"></i>
                    </span>
                `;
    }

    //hop-accessions-filter
    _getHpoAccessionsHtml() {
        return html`
                    <textarea id="${this._prefix}HumanPhenotypeOntologyTextarea" class="form-control clearable ${this._prefix}FilterTextInput"
                                rows="3" name="hpo" placeholder="HP:0000001, HP:3000079" @keyup="${this.updateQueryFilters}"></textarea>
                    <span class="input-group-addon btn btn-primary searchingSpan" id="${this._prefix}buttonOpenHpoAccesions" @click="${this.openModalHpo}">
                        <strong style="color: white">Add HPO Term</strong>
                        <i class="fa fa-search searchingButton" aria-hidden="true"></i>
                    </span>
                     <form style="padding-top: 15px">
                        <label style="font-weight: normal;">Logical Operator</label>
                        <input type="radio" name="hpoRadio" id="${this._prefix}hpoOrRadio" value="or" class="${this._prefix}FilterRadio"
                                checked style="margin-left: 10px" @change="${this.updateQueryFilters}"> OR<br>
                        <input type="radio" name="hpoRadio" id="${this._prefix}hpoAndRadio" value="and"
                                class="${this._prefix}FilterRadio" style="margin-left: 102px" @change="${this.updateQueryFilters}"> AND  <br>
                    </form>
                `;
    }

    //clinvar-accessions-filter
    _getClinvarAccessionsHtml() {
        return html`
                    <textarea id="${this._prefix}ClinVarTextarea" class="form-control clearable ${this._prefix}FilterTextInput" rows="3" name="clinvar" placeholder="RCV000058226" @keyup="${this.updateQueryFilters}"></textarea>
                `;
    }

    //fulltext-search-accessions-filter
    _getFullTextSearchAccessionsHtml() {
        return html`
                    <textarea id="${this._prefix}TraitsTextarea" class="form-control clearable ${this._prefix}FilterTextInput" rows="5" name="traits" placeholder="Full-text search, e.g. *melanoma*" @keyup="${this.updateQueryFilters}"></textarea>
                `;
    }
*/


    /**
     * @deprecated
     * */
    /*
    _addEventListeners() {

        //FIXME ::  NOT present in DOM:
        //     PanelAppsTextarea
        //     FilterTextInput


        let keyupEvents = ["FileQualInput", "LocationTextarea", "FeatureTextarea", "PanelAppsTextarea", "FilterTextInput", "CaddRawInput", "CaddScaledInput", "SiftInput",
            "PolyphenInput", "PhylopInput", "PhastconsInput", "GerpInput", "GeneOntologyTextarea", "HumanPhenotypeOntologyTextarea", "ClinVarTextarea", "TraitsTextarea"];
        for (let id of keyupEvents) {
            let element = PolymerUtils.getElementById(this._prefix + id);
            if (UtilsNew.isNotUndefinedOrNull(element)) {
                element.addEventListener("keyup", this.updateQueryFilters.bind(this));
            }
        }


        // TODO change Type field to VariantType?
        // NOT present in DOM:
        // GenotypeQueryOptions
        // vcfFilterSelect

        let changeEvents = ["includeOtherStudy", "FilePassCheckbox", "FileQualCheckbox", "GenotypeQueryOptions", "DiseasePanels", "GeneBiotypes", "Type", "CaddRawOperator", "CaddScaledOperator", "SiftOperator", "PolyphenOperator",
            "pssOrRadio", "pssAndRadio", "PhylopOperator", "PhastconsOperator", "GerpOperator", "conservationAndRadio", "conservationOrRadio", "vcfFilterSelect",
            "hpoOrRadio", "hpoAndRadio"];
        for (let id of changeEvents) {
            let element = PolymerUtils.getElementById(this._prefix + id);
            if (UtilsNew.isNotUndefinedOrNull(element)) {
                element.addEventListener("change", this.updateQueryFilters.bind(this));
            }
        }


        // Add events for Feature IDs
        PolymerUtils.getElementById(this._prefix + "FeatureIdText").addEventListener("keyup", this.callAutocomplete.bind(this));
        PolymerUtils.getElementById(this._prefix + "FeatureAddButton").addEventListener("click", this.addFeatureId.bind(this));


        // Add events for Sample IDs
        let elementById = PolymerUtils.getElementById(this._prefix + "SampleFilterModalButton");
        if (UtilsNew.isNotUndefinedOrNull(elementById)) {
            elementById.addEventListener("click", this.onSampleFilterClick.bind(this));
        }


        // Add events for Studies checkboxes

        if (UtilsNew.isNotUndefinedOrNull(this.differentStudies)) {
            for (let study of this.differentStudies) {
                let element = PolymerUtils.getElementById(this._prefix + study.alias + "Checkbox");
                if (UtilsNew.isNotUndefinedOrNull(element)) {
                    element.addEventListener("change", this.updateQueryFilters.bind(this));
                }
            }
        }

        // Add events for Cohort
        for (let section of this.config.menu.sections) {
            for (let subsection of section.subsections) {
                if (subsection.id === "cohort") {
                    let projectId = this.opencgaSession.project.id;
                    if (UtilsNew.isNotUndefinedOrNull(subsection.cohorts[projectId])) {
                        for (let study of Object.keys(subsection.cohorts[projectId])) {
                            for (let cohort of subsection.cohorts[projectId][study]) {
                                let element = PolymerUtils.getElementById(this._prefix + study + cohort.id + "CohortOperator");
                                if (UtilsNew.isNotUndefinedOrNull(element)) {
                                    element.addEventListener("change", this.updateQueryFilters.bind(this));
                                }
                                element = PolymerUtils.getElementById(this._prefix + study + cohort.id + "Cohort");
                                if (UtilsNew.isNotUndefinedOrNull(element)) {
                                    element.addEventListener("keyup", this.updateQueryFilters.bind(this));
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add events for Population Frequency
        for (let study of this.populationFrequencies.studies) {
            let element = PolymerUtils.getElementById(this._prefix + study.id + "Icon");
            let inputAll = PolymerUtils.getElementById(this._prefix + study.id + "Input");
            if (UtilsNew.isNotUndefinedOrNull(element)) {
                element.addEventListener("click", this.handleCollapseAction.bind(this));
            }

            if (UtilsNew.isNotUndefinedOrNull(inputAll)) {
                inputAll.addEventListener("keyup", this.keyUpAllPopFreq.bind(this));
                inputAll.addEventListener("change", this.updateQueryFilters.bind(this));
            }

            for (let pop of study.populations) {
                PolymerUtils.getElementById(this._prefix + study.id + pop.id).addEventListener("keyup", this.updateQueryFilters.bind(this));
                PolymerUtils.getElementById(this._prefix + study.id + pop.id + "Operator").addEventListener("change", this.updateQueryFilters.bind(this));
            }
        }

        // Add events Protein substitution score
        PolymerUtils.getElementById(this._prefix + "SiftValues").addEventListener("change", this.checkScore.bind(this));
        PolymerUtils.getElementById(this._prefix + "PolyphenValues").addEventListener("change", this.checkScore.bind(this));

        // Add events consequence type
        PolymerUtils.getElementById(this._prefix + "LossOfFunctionCheckBox").addEventListener("change", this.updateConsequenceTypeFilter.bind(this));
        if (UtilsNew.isNotEmptyArray(consequenceTypes.categories)) {
            consequenceTypes.categories.forEach((category) => {
                let title = (category.title !== undefined) ? category.title : category.name;
                if (UtilsNew.isNotEmptyArray(category.terms)) {
                    PolymerUtils.getElementById(this._prefix + title + "Input").addEventListener("change", this.updateConsequenceTypeFilter.bind(this));
                    category.terms.forEach((item) => {
                        PolymerUtils.getElementById(this._prefix + item.name + "Checkbox").addEventListener("change", this.updateConsequenceTypeFilter.bind(this));
                    });
                } else {
                    PolymerUtils.getElementById(this._prefix + title + "Checkbox").addEventListener("change", this.updateConsequenceTypeFilter.bind(this));
                }
            });
        }

        // Add events GO accessions
        let goModalButton = PolymerUtils.getElementById(this._prefix + "buttonOpenGoAccesions");
        if (UtilsNew.isNotUndefinedOrNull(goModalButton)) {
            goModalButton.addEventListener("click", this.openModalGo.bind(this));
        }

        // Add events hpo accessions
        let hpoModalButton = PolymerUtils.getElementById(this._prefix + "buttonOpenHpoAccesions");
        if (UtilsNew.isNotUndefinedOrNull(hpoModalButton)) {
            hpoModalButton.addEventListener("click", this.openModalHpo.bind(this));
        }
    }
    */

    _addAllTooltips() {
        for (let section of this.config.menu.sections) {
            for (let subsection of section.subsections) {
                if (UtilsNew.isNotEmpty(subsection.tooltip)) {
                    let tooltipIcon = $("#" + this._prefix + subsection.id + "Tooltip");
                    if (UtilsNew.isNotUndefinedOrNull(tooltipIcon)) {
                        this._addTooltip(tooltipIcon, subsection.title, subsection.tooltip);
                    }
                }
            }
        }
    }

    _addTooltip(div, title, content) {
        div.qtip({
            content: {
                title: title,
                text: content
            },
            position: {
                target: "mouse",
                adjust: {
                    x: 2, y: 2,
                    mouse: false
                }
            },
            style: {
                width: true,
                classes: this.config.menu.tooltip.classes
            },
            show: {
                delay: 200
            },
            hide: {
                fixed: true,
                delay: 300
            }
        });
    }

    render() {
        return html`
            <style include="jso-styles">
            .panel.filter-section {
                margin-bottom: 10px
            }
            
            span + span {
                margin-left: 10px;
            }

            .browser-ct-scroll {
                /*max-height: 450px;*/
                /*overflow-y: scroll;*/
                overflow-x: scroll;
            }

            .browser-ct-tree-view,
            .browser-ct-tree-view * {
                padding: 0;
                margin: 0;
                list-style: none;
            }

            .browser-ct-tree-view li ul {
                margin: 0 0 0 22px;
            }

            .browser-ct-tree-view * {
                vertical-align: middle;
            }

            .browser-ct-tree-view {
                /*font-size: 14px;*/
            }

            .browser-ct-tree-view input[type="checkbox"] {
                cursor: pointer;
            }

            .browser-ct-item {
                white-space: nowrap;
                display: inline
            }

            div.block {
                overflow: hidden;
            }

            div.block label {
                width: 80px;
                display: block;
                float: left;
                text-align: left;
                font-weight: normal;
            }

            select + select {
                margin-left: 10px;
            }

            select + input {
                margin-left: 10px;
            }

            .browser-subsection {
                font-size: 1.35rem;
                font-weight: bold;
                padding: 5px 0px;
                color: #444444;
                border-bottom: 1px solid rgba(221, 221, 221, 0.8);
            }

            .subsection-content {
                margin: 5px 5px;
            }
            
            .bootstrap-select {
                width: 100%!important;
            }            
            
        </style>
        <div>
            ${this.searchButton ? html`
            <div class="search-button-wrapper">
                <button type="button" class="btn btn-primary ripple" @click="${this.onSearch}">
                    <i class="fa fa-search" aria-hidden="true"></i> ${this.config.menu.searchButtonText}
                </button>
            </div>
            ` : null}

            <div class="panel-group" id="${this._prefix}Accordion" role="tablist" aria-multiselectable="true" style="padding-top: 20px">
                <div id="FilterMenu">
                ${this._renderFilterMenu()}
                </div>
            </div>
        </div>
        <!--
        <variant-modal-ontology prefix=${this._prefix} @propagateok="${this.propagateOkHPO}" ontologyFilter="${this.ontologyFilter}" term="${this.ontologyTerm}"
                                selectedTerms="${this.selectedTermsOntology}">
        </variant-modal-ontology>
        -->
        `;
    }
}

customElements.define("opencga-variant-filter", OpencgaVariantFilter);
