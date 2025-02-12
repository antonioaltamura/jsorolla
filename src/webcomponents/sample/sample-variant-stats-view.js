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
import "../commons/simple-chart.js";
import "../commons/forms/data-form.js";

/**
 * This component can work on two different ways:
 *  1. if a sample (or sampleID) is provided then it renders a dropdown to select the SampleVariantStats
 *  2. if a sampleVariantStats is provided it just renders it
 */
class SampleVariantStatsView extends LitElement {

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
            sample: {
                type: Object
            },
            sampleId: {
                type: String
            },
            sampleVariantStats: {
                type: Object
            },
            query: {
                type: Object
            },
            description: {
                type: String
            },
            config: {
                type: Object
            },
            active: {
                type: Boolean
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this.active = true;

        // Default config for Highcharts charts
        this.defaultHighchartConfig = {
            chart: {
                backgroundColor: {
                    // linearGradient: [0, 0, 500, 500],
                    stops: [
                        [0, "rgb(255, 255, 255)"],
                        [1, "rgb(240, 240, 255)"]
                    ]
                },
                borderWidth: 0,
                // plotBackgroundColor: "rgba(255, 255, 255, .9)",
                plotShadow: true,
                plotBorderWidth: 1
            },
            tooltip: {
                headerFormat: "<span style=\"font-size:10px\">{point.key}</span><table>",
                pointFormat: "<tr><td style=\"color:{series.color};padding:0\">{series.name}: </td>" +
                    "<td style=\"padding:0\"><b>{point.y:.1f} </b></td></tr>",
                footerFormat: "</table>",
                shared: true,
                useHTML: true
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if ((changedProperties.has("sampleId") || changedProperties.has("active")) && this.active) {
            this.sampleIdObserver();
        }

        if (changedProperties.has("sample") && this.active) {
            this.sampleObserver();
        }

        if ((changedProperties.has("sampleVariantStats") || changedProperties.has("query") || changedProperties.has("description") || changedProperties.has("active"))
            && this.active) {
            this.sampleVariantStatsObserver();
        }

        if (changedProperties.has("config")) {
            // this._config = {...this.getDefaultConfig(), ...this.config};
            this._config = this.getDefaultConfig();
            _.merge(this._config, this.config);
            this.requestUpdate();
        }

        super.update(changedProperties);
    }

    sampleIdObserver() {
        if (this.opencgaSession && this.sampleId) {
            this.opencgaSession.opencgaClient.samples().info(this.sampleId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.sample = response.getResult(0);
                    // this.sampleObserver();
                })
                .catch(response => {
                    console.error("An error occurred fetching sample: ", response);
                });
        }
    }

    sampleObserver() {

        // TODO temp fix to support both Opencga 2.0.3 and Opencga 2.1.0-rc
        if (this.sample?.qualityControl?.variantMetrics) {
            this._variantStatsPath = "variantMetrics";
        } else if (this.sample?.qualityControl?.variant) {
            this._variantStatsPath = "variant";
        } else {
            console.error("unexpected QC data model");
        }

        if (this.sample?.qualityControl?.[this._variantStatsPath].variantStats?.length) {
            // By default we render the stat 'ALL' from the first metric, if there is not stat 'ALL' then we take the first one
            this.statsSelect = this.sample.qualityControl[this._variantStatsPath].variantStats.map(stat => stat.id);
            this.variantStats = this.sample.qualityControl[this._variantStatsPath].variantStats.find(stat => stat.id === "ALL") ?? this.sample.qualityControl[this._variantStatsPath].variantStats[0];
            if (this.variantStats?.stats?.chromosomeCount) {
                this.variantStats.stats.chromosomeCount = UtilsNew.objectKeySort(this.variantStats.stats.chromosomeCount, CHROMOSOMES, false);
            }
        } else {
            this.statsSelect = [];
            this.variantStats = null;
        }
        // this.requestUpdate();
    }

    sampleVariantStatsObserver() {
        if (this.sampleVariantStats?.stats) {
            this.variantStats = {
                stats: {
                    ...this.sampleVariantStats?.stats,
                    chromosomeCount: UtilsNew.objectKeySort(this.sampleVariantStats?.stats?.chromosomeCount, CHROMOSOMES, false),
                    depthCount: UtilsNew.objectKeySort(this.sampleVariantStats?.stats?.depthCount, ["lt5", "lt10", "lt15", "lt20", "gte20", "na"]),
                    typeCount: UtilsNew.objectKeySort(this.sampleVariantStats?.stats?.typeCount, ["SNV", "INDEL", "CNV", "INSERTION", "DELETION"], true),
                    indelLengthCount: UtilsNew.objectKeySort(this.sampleVariantStats?.stats?.indelLengthCount, ["lt5", "lt10", "lt15", "lt20", "gte20"]),
                    clinicalSignificanceCount: UtilsNew.objectKeySort(this.sampleVariantStats?.stats?.clinicalSignificanceCount, ["benign_likely_benign", "uncertain_significance", "likely_pathogenic", "pathogenic"])
                },
                query: this.query,
                description: this.description
            };
        }
    }

    statChange(e) {
        this.variantStats = this.sample.qualityControl[this._variantStatsPath].variantStats.find(stat => stat.id === e.detail.value);
    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            display: {
                // collapsable: true,
                // showTitle: false,
                labelWidth: 3,
                defaultValue: "-",
                defaultLayout: "horizontal"
            },
            sections: [
                {
                    title: "Summary",
                    display: {
                    },
                    elements: [
                        {
                            name: "Sample ID",
                            field: "stats.id",
                            display: {
                                style: "font-weight: bold"
                            }
                        },
                        {
                            name: "Number of Variants",
                            field: "stats.variantCount",
                            type: "custom",
                            display: {
                                render: variantCount => {
                                    if (variantCount > 0) {
                                        return html`${variantCount} variants`;
                                    } else {
                                        return html`<span style="color: red">${variantCount} variants</span>`;
                                    }
                                }
                            }
                        },
                        {
                            name: "Ti/Tv Ratio",
                            field: "stats.tiTvRatio",
                            display: {
                                decimals: 4,
                                visible: tiTvRatio => tiTvRatio !== 0
                            }
                        },
                        {
                            name: "Quality Avg (Quality Standard Dev.)",
                            type: "complex",
                            display: {
                                template: "${qualityAvg} (${qualityStdDev})",
                                visible: variantStats => variantStats?.stats?.qualityAvg !== 0
                            }
                        },
                        {
                            name: "Heterozygosity Rate",
                            field: "stats.heterozygosityRate",
                            display: {
                                decimals: 4,
                                visible: heterozygosityRate => heterozygosityRate !== 0
                            }
                        },
                        {
                            name: "Stats Query Filters",
                            field: "query",
                            type: "custom",
                            display: {
                                render: query => query && !UtilsNew.isEmpty(query) ?
                                    Object.entries(query)
                                        .map(([k, v]) => {
                                            if (k !== "study") {
                                                return html`<span class="break-word"><span style="font-weight: bold">${k}:</span> ${v}</span><br>`;
                                            } else {
                                                if (Object.keys(query).length === 1) {
                                                    return html`<span>-</span>`;
                                                }
                                            }
                                        }) :
                                    "none"
                            }
                        },
                        {
                            name: "Description",
                            field: "description"
                        }
                    ]
                }, {
                    title: "Variant Stats",
                    display: {
                        visible: variantStats => variantStats?.stats?.variantCount > 0
                    },
                    elements: [
                        [
                            {
                                name: "Genotype and Filter",
                                type: "custom",
                                showLabel: false,
                                display: {
                                    render: variantStats => {
                                        return html`
                                            <div class="row">
                                                <div class="col-md-5 col-md-offset-1">
                                                    <simple-chart .active="${true}" type="pie" title="Genotypes" .data="${variantStats.stats.genotypeCount}"></simple-chart>
                                                </div>
                                                <div class="col-md-5 col-md-offset-1">
                                                    <simple-chart .active="${true}" type="pie" title="VCF Filter" .data="${variantStats.stats.filterCount}"></simple-chart>
                                                </div>
                                            </div>
                                        `;
                                    }
                                }
                            }
                        ], [
                            {
                                name: "Depth",
                                field: "stats.depthCount",
                                type: "chart",
                                showLabel: false,
                                display: {
                                    highcharts: {
                                        chart: {
                                            type: "column",
                                            ...this.defaultHighchartConfig.chart
                                        },
                                        title: {
                                            text: "Depth"
                                        },
                                        tooltip: {
                                            ...this.defaultHighchartConfig.tooltip
                                        }
                                    }
                                }
                            }
                        ]
                    ]
                },
                {
                    display: {
                        visible: variantStats => variantStats?.stats?.variantCount > 0
                    },
                    elements: [
                        {
                            name: "Chromosomes",
                            field: "stats.chromosomeCount",
                            type: "chart",
                            showLabel: false,
                            display: {
                                highcharts: {
                                    chart: {
                                        type: "column",
                                        ...this.defaultHighchartConfig.chart
                                    },
                                    title: {
                                        text: "Chromosomes"
                                    },
                                    tooltip: {
                                        ...this.defaultHighchartConfig.tooltip
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    display: {
                        visible: variantStats => variantStats?.stats?.variantCount > 0
                    },
                    elements: [
                        [
                            {
                                name: "Variant Type",
                                field: "stats.typeCount",
                                type: "chart",
                                showLabel: false,
                                display: {
                                    highcharts: {
                                        chart: {
                                            type: "column",
                                            ...this.defaultHighchartConfig.chart
                                        },
                                        tooltip: {
                                            ...this.defaultHighchartConfig.tooltip
                                        }
                                    }
                                }
                            }
                        ],
                        [
                            {
                                name: "INDEL Size",
                                field: "stats.indelLengthCount",
                                type: "chart",
                                showLabel: false,
                                display: {
                                    highcharts: {
                                        chart: {
                                            type: "column",
                                            ...this.defaultHighchartConfig.chart
                                        },
                                        tooltip: {
                                            ...this.defaultHighchartConfig.tooltip
                                        }
                                    }
                                }
                            }
                        ]
                    ]
                },
                {
                    // title: "plots2",
                    display: {
                        visible: variantStats => variantStats?.stats?.variantCount > 0
                    },
                    elements: [
                        {
                            name: "Consequence Type",
                            field: "stats.consequenceTypeCount",
                            type: "chart",
                            showLabel: false,
                            display: {
                                sort: true,
                                highcharts: {
                                    chart: {
                                        type: "column",
                                        ...this.defaultHighchartConfig.chart
                                    },
                                    tooltip: {
                                        ...this.defaultHighchartConfig.tooltip
                                    }
                                }
                            }
                        },
                        {
                            name: "Biotype",
                            field: "stats.biotypeCount",
                            type: "chart",
                            showLabel: false,
                            display: {
                                sort: true,
                                highcharts: {
                                    chart: {
                                        type: "column",
                                        ...this.defaultHighchartConfig.chart
                                    },
                                    tooltip: {
                                        ...this.defaultHighchartConfig.tooltip
                                    }
                                }
                            }
                        },
                        {
                            name: "ClinVar Clinical Significance",
                            field: "stats.clinicalSignificanceCount",
                            type: "chart",
                            showLabel: false,
                            display: {
                                highcharts: {
                                    chart: {
                                        type: "column",
                                        ...this.defaultHighchartConfig.chart
                                    },
                                    tooltip: {
                                        ...this.defaultHighchartConfig.tooltip
                                    }
                                }
                            }
                        }
                    ]
                }, {
                    title: "Variant Stats",
                    display: {
                        visible: variantStats => variantStats?.stats?.variantCount === 0
                    },
                    elements: [
                        {
                            name: "Warning",
                            type: "custom",
                            display: {
                                render: () => html`<span>No variants found</span>`
                            }
                        }
                    ]
                }
            ]
        };
    }

    render() {
        if (!this.variantStats?.stats?.id) {
            return html`
                <div class="alert alert-info">
                    <i class="fas fa-3x fa-info-circle align-middle" style="padding-right: 10px"></i> No Variant Stats found.
                </div>`;
        }

        return html`
            ${this.sample ?
                html`
                    <div style="margin: 20px 10px">
                        <div class="form-horizontal">
                            <div class="form-group">
                                <label class="col-md-2">Select Variant Stat</label>
                                <div class="col-md-2">
                                    <select-field-filter forceSelection .data="${this.statsSelect}" .value=${this.variantStats.id} @filterChange="${this.statChange}"></select-field-filter>
                                </div>
                            </div>
                        </div>
                    </div>` :
                null
            }

            <div>
                <data-form .data=${this.variantStats} .config="${this._config}"></data-form>
            </div>
        `;
    }

}

customElements.define("sample-variant-stats-view", SampleVariantStatsView);
