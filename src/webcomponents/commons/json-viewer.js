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
import "../download-button.js";

export default class JsonViewer extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            data: {
                type: Object
            },
            // title: {
            //     type: String
            // },
            showDownloadButton: {
                type: Boolean
            },
            active: {
                type: Boolean
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);

        this.showDownloadButton = true;
        this.active = true;
    }

    connectedCallback() {
        super.connectedCallback();

        // this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if ((changedProperties.has("data") || changedProperties.has("active")) && this.active) {
            if (this.data) {
                // $(".json-renderer", this).jsonViewer(this.data);
                $(`#${this._prefix}JsonView`, this).jsonViewer(this.data);
            }
        }
        // super.update(changedProperties);
    }

    getDefaultConfig() {
        return {};
    }

    render() {
        if (!this.data) {
            return html`<h4>No valid data found</h4>`;
        }

        return html`
            ${this.showDownloadButton ? html`
                <div class="text-right">
                    <download-button
                        .json="${this.data}"
                        class="btn-sm">
                    </download-button>
                </div>
            ` : null
            }

            <div id="${this._prefix}JsonView" class="json-renderer"></div>
        `;
    }

}

customElements.define("json-viewer", JsonViewer);
