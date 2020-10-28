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
import UtilsNew from "../../../utilsNew.js";

export default class BiotypeFilter extends LitElement {

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
            query: {
                type: Object
            },
            biotypes: {
                type: Array
            },
            biotype: {
                type: Array
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "crf-" + UtilsNew.randomString(6) + "_";
        this._config = this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            biotypes: [
                "3prime_overlapping_ncrna", "IG_C_gene", "IG_C_pseudogene", "IG_D_gene", "IG_J_gene", "IG_J_pseudogene",
                "IG_V_gene", "IG_V_pseudogene", "Mt_rRNA", "Mt_tRNA", "TR_C_gene", "TR_D_gene", "TR_J_gene", "TR_J_pseudogene",
                "TR_V_gene", "TR_V_pseudogene", "antisense", "lincRNA", "miRNA", "misc_RNA", "non_stop_decay",
                "nonsense_mediated_decay", "polymorphic_pseudogene", "processed_pseudogene", "processed_transcript",
                "protein_coding", "pseudogene", "rRNA", "retained_intron", "sense_intronic", "sense_overlapping", "snRNA",
                "snoRNA", "transcribed_processed_pseudogene", "transcribed_unprocessed_pseudogene",
                "translated_processed_pseudogene", "unitary_pseudogene", "unprocessed_pseudogene"
            ]
        };
    }

    filterChange(e) {
        //select-field-filter already emits a bubbled filterChange event.
    }

    render() {
        return html`
            <select-field-filter .liveSearch=${true} multiple .data="${this._config.biotypes}" .value=${this.biotype} @filterChange="${this.filterChange}"></select-field-filter>
        `;
    }

}

customElements.define("biotype-filter", BiotypeFilter);
