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
// import UtilsNew from "../../utilsNew.js";
import "../commons/view/data-view.js";


export default class OpencgaIndividualView extends LitElement {

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
            individualId: {
                type: String
            },
            individual: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        // this.prefix = "osv" + UtilsNew.randomString(6);
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }


    firstUpdated(_changedProperties) {
    }

    updated(changedProperties) {
        if (changedProperties.has("individualId")) {
            this.individualIdObserver();
        }
        if (changedProperties.has("individual")) {
            this.individualObserver();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }
    }

    configObserver() {
    }

    // TODO recheck
    individualIdObserver() {
        console.warn("individualIdObserver");
        if (this.file !== undefined && this.file !== "") {
            this.opencgaSession.opencgaClient.individual().info(this.individualId, {})
                .then( response => {
                    if (response.response[0].id === undefined) {
                        response.response[0].id = response.response[0].name;
                    }
                    this.individual = response.response[0].result[0];
                    console.log("_this.individual", this.individual);
                    this.requestUpdate();
                })
                .catch(function(reason) {
                    console.error(reason);
                });
        }

    }

    individualObserver() {
        console.log("individualObserver");

    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            display: {
                collapsable: true,
                showTitle: false,
                labelWidth: 2,
                labelOrientation: "left",
                defaultVale: "-"
            },
            sections: [
                {
                    title: "General",
                    collapsed: false,
                    elements: [
                        // available types: basic (optional/default), complex, list (horizontal and vertical), table, plot, custom
                        {
                            name: "Individual ID",
                            type: "complex",
                            display: {
                                template: "${id} (UUID ${uuid}  - Undefined ${uuuuuuid})",
                                format: {
                                    uuid: {
                                        style: "color: red"
                                    }
                                },
                                defaultValue: "NA"
                            }
                        },
                        {
                            name: "Name",
                            field: "name",
                            // type: "basic" (optional)
                        },
                        {
                            name: "Name",
                            field: "namelkjsaljksajksa",
                        },
                        {
                            name: "Father",
                            field: "father.id",
                            type: "basic",
                            display: {
                                format: {
                                    "father.id": {
                                        style: "color: red"
                                    }
                                }
                            }
                        },
                        {
                            name: "Mother of ${id}",
                            field: "mother.id",
                            type: "basic"
                        },
                        {
                            name: "Sex (Karyotypic Sex)",
                            type: "complex",
                            display: {
                                template: "${sex} (${karyotypicSex})",
                            }
                        },
                        {
                            name: "Sex (Karyotypic Sex)",
                            type: "custom",
                            display: {
                                render: (data) => {
                                    return html`${data.sex} (<span style="color: red">${data.karyotypicSex}</span>)`;
                                },
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "list",
                            display: {
                                template: "${name} (${id})",
                                contentLayout: "horizontal",
                                separator: ", "
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "list",
                            display: {
                                template: "${name} (${id})",
                                contentLayout: "vertical",
                                bullets: false,
                                format: {
                                    id: {
                                        link: "https://hpo.jax.org/app/browse/term/ID",
                                    },
                                    name: {
                                        style: "font-weight: bold"
                                    }
                                },
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "list",
                            display: {
                                layout: "horizontal",
                                template: "${name} (${id})",
                                contentLayout: "bullets",
                                format: {
                                    id: {
                                        link: "https://hpo.jax.org/app/browse/term/ID",
                                    },
                                    name: {
                                        style: "font-weight: bold"
                                    }
                                },
                                defaultVale: "N/A"
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "list",
                            display: {
                                layout: "vertical",
                                template: "${name} (${id})",
                                contentLayout: "bullets",
                                format: {
                                    id: {
                                        link: "https://hpo.jax.org/app/browse/term/ID",
                                    },
                                    name: {
                                        style: "font-weight: bold"
                                    }
                                },
                                defaultVale: "N/A"
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "table",
                            display: {
                                columns: [
                                    {
                                        name: "ID", field: "id"
                                    },
                                    {
                                        name: "Name", field: "name"
                                    },
                                    {
                                        name: "Source", field: "source"
                                    },
                                    {
                                        name: "Undefined Filed", field: "uf", defaultVale: "N/A"
                                    }
                                ],
                                format: {
                                    id: {
                                        link: "https://hpo.jax.org/app/browse/term/ID",
                                        style: "color: red"
                                    },
                                    name: {
                                        style: "font-weight: bold"
                                    }
                                },
                                border: true
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "table",
                            display: {
                                layout: "vertical",
                                columns: [
                                    {
                                        name: "ID", field: "id"
                                    },
                                    {
                                        name: "Name", field: "name"
                                    },
                                    {
                                        name: "Source", field: "source"
                                    },
                                    {
                                        name: "Undefined Filed", field: "uf", default: "N/A"
                                    }
                                ],
                                format: {
                                    id: {
                                        link: "https://hpo.jax.org/app/browse/term/ID",
                                    },
                                    name: {
                                        style: "font-weight: bold"
                                    }
                                },
                                border: true
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "plot",
                            display: {
                                chart: "histogram",
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "custom",
                            display: {
                                render: (data) => {
                                    return html`
                                        <pre>${JSON.stringify(data, null, 2)}</pre>
                                    `;
                                },
                            }
                        },
                    ]
                },
            ]
        };
    }

    render() {
        return html`
        <style>
            .section-title {
                border-bottom: 2px solid #eee;
            }
            .label-title {
                text-align: left;
                padding-left: 5px;
                padding-right: 10px;
            }
        </style>

        
        <data-view .data=${this.individual} .config="${this.getDefaultConfig()}"></data-view>
    
        
        ${this.individual && false ? html`
            <div>
                ${this._config.showTitle ? html`<h3 class="section-title">Summary</h3>` : null}
                <div class="col-md-12">
                    <form class="form-horizontal">
                        <div class="form-group">
                            <label class="col-md-3 label-title">ID</label>
                            <span class="col-md-9">${this.individual.id}</span>
                        </div>
                        <div class="form-group">
                            <label class="col-md-3 label-title">Name</label>
                            <span class="col-md-9">${this.individual.name}</span>
                        </div>
                        <div class="form-group">
                            <label class="col-md-3 label-title">Version</label>
                            <span class="col-md-9">${this.individual.version}</span>
                        </div>
                        <div class="form-group">
                            <label class="col-md-3 label-title">UUID</label>
                            <span class="col-md-9">${this.individual.uuid}</span>
                        </div>
                        <div class="form-group">
                            <label class="col-md-3 label-title">Sex (Karyotype)</label>
                            <span class="col-md-9">${this.individual.sex} (${this.individual.karyotypicSex})</span>
                        </div>
                        <div class="form-group">
                            <label class="col-md-3 label-title">Phenotypes</label>
                            <span class="col-md-9">
                            ${this.individual.phenotypes && this.individual.phenotypes.length ? this.individual.phenotypes.map( item => html`
                                <span>${item.name} (<a href="http://compbio.charite.de/hpoweb/showterm?id=${item.id}" target="_blank">${item.id}</a>)</span>
                                <br>
                            `) : null }
                        </span>
                        </div>
                    </form>
                </div>
            </div>
        ` : null }
        `;
    }

}

customElements.define("opencga-individual-view", OpencgaIndividualView);

