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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../utilsNew.js";

class AlignmentStatsView extends LitElement {

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
            fileIds: {
                type: Array
            },
            alignmentStats: {
                type: Array
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("fileIds")) {
            this.fileIdsObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    fileIdsObserver() {
        if (this.opencgaSession && this.fileIds) {
            this.opencgaSession.opencgaClient.alignments().infoStats(this.fileIds.join(","), {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.alignmentStats = response.responses[0].results;
                    this.requestUpdate();
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    renderTable() {
            return html`
                <table class="table table-hover table-no-bordered">
                    <thead>
                        <tr>
                            <th></th>
                            ${// Read column name from configuration if exist, otherwise use sampleId from the stats object
                                this._config?.columns?.length 
                                    ? this._config.columns.map( col => html`<th class="${col.classes}">${col.name}</th>`)
                                    : this.alignmentStats.map( stat => {
                                            let splitFields = stat.fileId.split(":");
                                            return html`<th>${splitFields[splitFields.length - 1]}</th>`;
                                        })
                            }
                        </tr>
                    </thead>
                    <tbody>
                        ${this._config.rows.map(variable => html`
                            <tr>
                                <td>
                                    <label>${variable.name}</label>
                                </td>
                                ${this.alignmentStats.map(stat => html`<td>${stat[variable.field] ?? "N/A"}</td>`) }
                            </tr>
                        `)}
                    </tbody>
                </table>`;
    }

    onDownload(e) {
        const header = this._config?.columns?.length ? this._config.columns.map( col => col.name) : this.alignmentStats.map( stat => stat.sampleId)
        const d = this._config.rows.map(variable => [variable.name, ...this.alignmentStats.map(stat => stat[variable.field] ?? "N/A")].join("\t"))
        if (e.currentTarget.dataset.downloadOption.toLowerCase() === "tab") {
            const dataString = [
                ["#key", ...header].join("\t"),
                d.join("\n")];
            UtilsNew.downloadData(dataString, "alignment_stats_view_" + this.opencgaSession.study.id + ".txt", "text/plain");
        } else {
            UtilsNew.downloadData(JSON.stringify(this.alignmentStats, null, "\t"), this.opencgaSession.study.id + ".json", "application/json");
        }
    }


    getDefaultConfig() {
        return {
            // title: "Samtools Stats",
            // columns: [
            //     {
            //         name: "ISDBM322015",
            //         classes: "text-danger"
            //     },
            //     {
            //         name: "ISDBM322016",
            //         classes: ""
            //     },
            //     {
            //         name: "ISDBM322017",
            //         classes: ""
            //     }
            // ],
            rows: [
                {
                    name: "File",
                    field: "fileId"
                },
                // {
                //     name: "Sample ID",
                //     field: "sampleId"
                // },
                {
                    name: "rawTotalSequences",
                    field: "rawTotalSequences"
                },
                {
                    name: "filteredSequences",
                    field: "filteredSequences"
                },
                {
                    name: "readsDuplicated",
                    field: "readsDuplicated"
                },
                {
                    name: "insertSizeAverage",
                    field: "insertSizeAverage"
                },
                {
                    name: "sequences",
                    field: "sequences"
                },
                {
                    name: "isSorted",
                    field: "isSorted"
                },
                {
                    name: "firstFragments",
                    field: "firstFragments"
                },
                {
                    name: "lastFragments",
                    field: "lastFragments"
                },
                {
                    name: "readsMapped",
                    field: "readsMapped"
                },
                {
                    name: "readsMappedAndPaired",
                    field: "readsMappedAndPaired"
                },
                {
                    name: "readsUnmapped",
                    field: "readsUnmapped"
                },
                {
                    name: "readsProperlyPaired",
                    field: "readsProperlyPaired"
                },
                {
                    name: "readsPaired",
                    field: "readsPaired"
                },
                {
                    name: "readsMq0",
                    field: "readsMq0"
                },
                {
                    name: "readsQcFailed",
                    field: "readsQcFailed"
                },
                {
                    name: "nonPrimaryAlignments",
                    field: "nonPrimaryAlignments"
                },
                {
                    name: "totalLength",
                    field: "totalLength"
                },
                {
                    name: "totalFirstFragmentLength",
                    field: "totalFirstFragmentLength"
                },
                {
                    name: "totalLastFragmentLength",
                    field: "totalLastFragmentLength"
                },
                {
                    name: "basesMapped",
                    field: "basesMapped"
                },
                {
                    name: "basesMappedCigar",
                    field: "basesMappedCigar"
                },
                {
                    name: "basesTrimmed",
                    field: "basesTrimmed"
                },
                {
                    name: "basesDuplicated",
                    field: "basesDuplicated"
                },
                {
                    name: "mismatches",
                    field: "mismatches"
                },
                {
                    name: "errorRate",
                    field: "errorRate"
                },
                {
                    name: "averageLength",
                    field: "averageLength"
                },
                {
                    name: "averageFirstFragmentLength",
                    field: "averageFirstFragmentLength"
                },
                {
                    name: "averageLastFragmentLength",
                    field: "averageLastFragmentLength"
                },
                {
                    name: "maximumLength",
                    field: "maximumLength"
                },
                {
                    name: "maximumFirstFragmentLength",
                    field: "maximumFirstFragmentLength"
                },
                {
                    name: "maximumLastFragmentLength",
                    field: "maximumLastFragmentLength"
                },
                {
                    name: "averageQuality",
                    field: "averageQuality"
                },
                {
                    name: "insertSizeStandardDeviation",
                    field: "insertSizeStandardDeviation"
                },
                {
                    name: "inwardOrientedPairs",
                    field: "inwardOrientedPairs"
                },
                {
                    name: "outwardOrientedPairs",
                    field: "outwardOrientedPairs"
                },
                {
                    name: "pairsWithOtherOrientation",
                    field: "pairsWithOtherOrientation"
                },
                {
                    name: "pairsOnDifferentChromosomes",
                    field: "pairsOnDifferentChromosomes"
                },
                {
                    name: "percentageOfProperlyPairedReads",
                    field: "percentageOfProperlyPairedReads"
                }
            ],
            download: ["Tab", "JSON"]
        };
    }

    render() {
        if (this.alignmentStats?.length === 0) {
            return html`<div class="alert alert-info"><i class="fas fa-3x fa-info-circle align-middle"></i> No QC data are available yet.</div>`;
        }

        // Alignment stats are the same for FAMILY and CANCER analysis
        return html`
            <div>
                <div class="btn-group pull-right">
                    <button type="button" class="btn btn-default ripple btn-sm dropdown-toggle" data-toggle="dropdown"
                                aria-haspopup="true" aria-expanded="false">
                        <i class="fa fa-download pad5" aria-hidden="true"></i> Download <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu btn-sm">
                        ${this._config.download.length 
                            ? this._config.download.map(item => html`
                                <li><a href="javascript:;" data-download-option="${item}" @click="${this.onDownload}">${item}</a></li>`) 
                            : null
                        }
                    </ul>
                </div>
                ${this.renderTable()}
            </div>
        `;
    }

}

customElements.define("alignment-stats-view", AlignmentStatsView);
