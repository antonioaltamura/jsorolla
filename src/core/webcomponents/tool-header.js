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
import UtilsNew from "../utilsNew.js";

export default class ToolHeader extends LitElement {

    constructor() {
        super();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            title: {
                type: String
            },
            subtitle: {
                type: String
            },
            icon: {
                type: String
            },
            class: {
                type: String
            }
        }
    }

    render() {
        return html`
            <div class="page-title ${this.class ?? ""}">
                <h2>
                    ${this.icon ? this.icon.match(/\./)?.length ? html`
                        <img src="img/tools/icons/${this.icon}" alt="${this.title}">
                    ` : html`
                        <i class="${this.icon}" aria-hidden="true"></i>
                    ` : null}
                    ${UtilsNew.renderHTML(this.title)}
                </h2>
                ${this.subtitle ? html`<h3>${this.subtitle}</h3>` : null}
            </div>
        `;
    }
}

customElements.define("tool-header", ToolHeader);
