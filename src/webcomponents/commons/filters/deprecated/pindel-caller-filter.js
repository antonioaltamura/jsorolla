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
import UtilsNew from "../../../../core/utilsNew.js";
import "../../forms/data-form.js";


export default class PindelCallerFilter extends LitElement {

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
            fileId: {
                type: String
            },
            query: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this.filter = {};
        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("query")) {
            if (this.query) {
                this.filter = this.query;
            }
        }
    }

    filterChange(e) {
        if (e.detail.value) {
            if (e.detail.param === "FILTER") {
                this.filter["FILTER"] = "PASS";
            } else {
                this.filter[e.detail.param] = e.detail.value;
            }
        } else {
            delete this.filter[e.detail.param];
        }

        this.notify();
    }

    notify() {
        let filter = this.fileId ? this.fileId + ":" : "";
        filter += Object.entries(this.filter).map(([k, v]) => {
            if (k === "FILTER") {
                return k + "=" + v;
            } else {
                return k + "" + v;
            }
        }).join(";");

        const event = new CustomEvent("filterChange", {
            detail: {
                value: filter
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    getDefaultConfig() {
        return {
            title: "",
            icon: "",
            type: "form",
            display: {
                collapsable: true,
                showTitle: false,
                labelWidth: 2,
                defaultValue: "-",
                defaultLayout: "vertical"
            },
            sections: [
                {
                    title: "",
                    collapsed: false,
                    elements: [
                        {
                            name: "PASS",
                            field: "FILTER",
                            type: "checkbox",
                        },
                        {
                            name: "QUAL",
                            field: "QUAL",
                            type: "input-number",
                            defaultValue: "",
                        },
                        {
                            name: "REP",
                            field: "REP",
                            type: "input-number",
                            defaultValue: "",
                        },
                    ]
                },
            ]
        };
    }

    render() {
        return html`
            <data-form .data=${this.filter} .config="${this._config}" @fieldChange="${this.filterChange}"></data-form>
        `;
    }
}

customElements.define("pindel-caller-filter", PindelCallerFilter);
