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
import LitUtils from "../utils/lit-utils.js";

// TODO reorganize props multiple/forceSelection

/** NOTE - Design choice: to allow deselection, the single mode (this.multiple=false), has been implemented with the multiple flag in bootstrap-select, but forcing 1 selection with data-max-options=1
 *  (this has no consequences for the developer point of view). This behaviour can be over overridden using "forceSelection" prop.
 *
 *  NOTE putting names in data-content attr instead of as <option> content itself allows HTML entities to be correctly decoded.
 *
 *  Usage:
 * <select-field-filter .data="${["A","B","C"]}" .value=${"A"} @filterChange="${e => console.log(e)}"></select-field-filter>
 * <select-field-filter .data="${[{id: "a", name: "A"}, {id:"b", name: "B"}, {id: "c", name: "C"}]}" .value=${"a"} @filterChange="${e => console.log(e)}"></select-field-filter>
 */

export default class SelectFieldFilter extends LitElement {

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
            // NOTE value (default Values) can be either a single value as string or a comma separated list (in case of multiple=true we support array of strings)
            value: {
                type: String
            },
            placeholder: {
                type: String
            },
            multiple: {
                type: Boolean
            },
            disabled: {
                type: Boolean
            },
            required: {
                type: Boolean
            },
            maxOptions: {
                type: Number
            },
            liveSearch: {
                type: Boolean
            },
            forceSelection: {
                type: Boolean
            },
            classes: {
                type: String
            },
            size: {
                type: Number,
            },
            separator: {
                type: String,
            },
            // the expected format is either an array of string or an array of objects {id, name}
            data: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this.multiple = false;
        this.data = [];
        this.classes = "";
        this.elm = this._prefix + "selectpicker";
        this.size = 20; // Default size
        this.separator = ","; // Default separator
    }

    firstUpdated() {
        this.selectPicker = $("#" + this.elm, this);
        this.selectPicker.selectpicker({
            iconBase: "fas",
            tickIcon: "fa-check",
            val: "",
            multipleSeparator: this.separator
        });
        // this.selectPicker.selectpicker("val", "");
    }

    updated(changedProperties) {
        if (changedProperties.has("data")) {
            // TODO check why lit-element execute this for all existing select-field-filter instances..wtf
            this.data = this.data ?? [];
            this.selectPicker.selectpicker("refresh");
        }

        if (changedProperties.has("disabled")) {
            this.selectPicker.selectpicker("refresh");
        }

        if (changedProperties.has("value") || changedProperties.has("data") || changedProperties.has("disabled")) {
            let val = "";
            if (this.value) {
                if (this.multiple) {
                    if (Array.isArray(this.value)) {
                        val = this.value;
                    } else {
                        val = this.value.split(",");
                    }
                } else {
                    val = this.value;
                }
            }
            this.selectPicker.selectpicker("val", val);
        }

        if (changedProperties.has("classes")) {
            if (this.classes) {
                this.selectPicker.selectpicker("setStyle", this.classes, "add");
            } else {
                // if classes os removed then we need to removed the old assigned classes
                this.selectPicker.selectpicker("setStyle", changedProperties.get("classes"), "remove");
                this.selectPicker.selectpicker("setStyle", "btn-default", "add");
            }
        }
    }

    filterChange() {
        const selection = this.selectPicker.selectpicker("val");
        let val = null;
        if (selection && selection.length) {
            if (this.multiple) {
                val = selection.join(",");
            } else {
                if (this.forceSelection) {
                    // single mode that DOESN'T allow deselection
                    // forceSelection means multiple flag in selectpicker is false, this is the only case `selection` is not an array
                    val = selection;
                } else {
                    // single mode that allows deselection
                    val = selection[0];
                }
            }
        }

        LitUtils.dispatchCustomEvent(this, "filterChange", val, {
            data: this.data,
        }, null, {bubbles: false, composed: false});
    }

    renderOption(option) {
        let dataContent;
        if (option.description) {
            dataContent = `<span title="${option.description}">${option.name ?? option.id}</span>`;
        } else {
            dataContent = `<span>${option.name ?? option.id}</span>`;
        }
        return html`
            <option
                ?disabled="${option.disabled}"
                ?selected="${option.selected}"
                .value="${option.id ?? option.name}"
                data-content="${dataContent}">
            </option>
        `;
    }

    render() {
        return html`
            <div id="${this._prefix}-select-field-filter-wrapper" class="select-field-filter">
                <select id="${this.elm}"
                    class="${this.elm}"
                    ?multiple="${!this.forceSelection}"
                    ?disabled="${this.disabled}"
                    ?required="${this.required}"
                    data-live-search="${this.liveSearch ? "true" : "false"}"
                    data-size="${this.size}"
                    title="${this.placeholder ?? (this.multiple ? "Select option(s)" : "Select an option")}"
                    data-max-options="${!this.multiple ? 1 : this.maxOptions ? this.maxOptions : false}"
                    @change="${this.filterChange}"
                    data-width="100%"
                    data-style="btn-default ${this.classes}">
                    ${this.data?.map(opt => html`
                        ${opt?.separator ? html`
                            <option data-divider="true"></option>
                        ` : html`
                            ${opt?.fields ? html`
                                <optgroup label="${opt.id ?? opt.name}">
                                    ${opt.fields.map(subopt => html`
                                        ${UtilsNew.isObject(subopt) ?
                                            this.renderOption(subopt) :
                                            html`<option>${subopt}</option>`
                                        }
                                    `)}
                                </optgroup>
                            ` : html`
                                ${UtilsNew.isObject(opt) ?
                                    this.renderOption(opt) :
                                    html`<option data-content="${opt}">${opt}</option>`
                                }
                            `}
                        `}
                    `)}
                </select>
            </div>
        `;
    }

}

customElements.define("select-field-filter", SelectFieldFilter);
