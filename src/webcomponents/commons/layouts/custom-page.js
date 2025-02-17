/**
 * Copyright 2015-present OpenCB
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

export default class CustomPage extends LitElement {

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            page: {
                type: Object
            },
        };
    }

    render() {
        return html`
            <div class="container" style="margin-top:48px;margin-bottom:48px;">
                <!-- Page title -->
                ${this.page.title && this.page.display?.showTitle !== false ? html`
                    <h1 class="${this.page.display?.titleClass}" style="${this.page.display?.titleStyle}">
                        ${this.page.title}
                    </h1>
                ` : null}
                ${this.page.display?.showTitleRule !== false ? html`<hr></hr>` : null}
                <!-- Page content -->
                ${this.page.content ? html`
                    <div>${UtilsNew.renderHTML(this.page.content)}</div>
                ` : null}
            </div>
        `;
    }

}

customElements.define("custom-page", CustomPage);
