/**
 * Copyright 2015-2021 OpenCB
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

import {LitElement, html, nothing} from "lit";
import FormUtils from "../../webcomponents/commons/forms/form-utils.js";
import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import UtilsNew from "../../core/utilsNew.js";
import Types from "../commons/types.js";
import "../study/phenotype/phenotype-list-update.js";
import "../study/annotationset/annotation-set-update.js";
export default class SampleUpdate extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            sample: {
                type: Object
            },
            sampleId: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.sample = {};
        this.phenotype = {};
        this.annotationSets = {};
    }

    connectedCallback() {
        super.connectedCallback();
        // it's not working well init or update,
        // it's working well here.. connectedCallback
        this.updateParams = {};
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("sample")) {
            this.sampleObserver();
        }

        if (changedProperties.has("sampleId")) {
            this.sampleIdObserver();
        }

        // it's just work on update or connectedCallback
        // It's working here, it is not necessary put this on connectecCallback.
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }

        super.update(changedProperties);
    }

    sampleObserver() {
        // When updating wee need to keep a private copy of the original object
        if (this.sample) {
            this._sample = JSON.parse(JSON.stringify(this.sample));
        }
    }

    sampleIdObserver() {
        if (this.opencgaSession && this.sampleId) {
            const query = {
                study: this.opencgaSession.study.fqn,
                includeIndividual: true
            };
            this.opencgaSession.opencgaClient.samples().info(this.sampleId, query)
                .then(response => {
                    this.sample = response.responses[0].results[0];
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    onFieldChange(e) {
        switch (e.detail.param) {
            case "id":
            case "description":
            case "individualId":
            case "somatic":
                this.updateParams = FormUtils.updateScalar(
                    this._sample,
                    this.sample,
                    this.updateParams,
                    e.detail.param,
                    e.detail.value);
                break;
            case "status.name":
            case "status.description":
            case "processing.product":
            case "processing.preparationMethod":
            case "processing.extractionMethod":
            case "processing.labSambpleId":
            case "processing.quantity":
            case "processing.date":
            case "collection.tissue":
            case "collection.organ":
            case "collection.quantity":
            case "collection.method":
            case "collection.date":
                this.updateParams = FormUtils.updateObjectWithProps(
                    this._sample,
                    this.sample,
                    this.updateParams,
                    e.detail.param,
                    e.detail.value);
                break;
        }
        this.requestUpdate();
    }

    onClear() {
        this._config = this.getDefaultConfig();
        this.sample = JSON.parse(JSON.stringify(this._sample));
        this.updateParams = {};
        this.sampleId = "";
    }

    onSubmit() {
        const params = {
            study: this.opencgaSession.study.fqn,
            phenotypesAction: "SET"
        };

        this.opencgaSession.opencgaClient.samples()
            .update(this.sample.id, this.updateParams, params)
            .then(res => {
                // this.sample = {...res.responses[0].results[0], attributes: this.sample.attributes}; // To keep OPENCGA_INDIVIDUAL
                this._sample = JSON.parse(JSON.stringify(this.sample));
                this.updateParams = {};
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                    title: "Update Sample",
                    message: "Sample updated correclty"
                });
                // FormUtils.showAlert("Update Sample", "Sample updated correctly", "success");
                // sessionUpdateRequest
                // TODO: dispacth to the user the data is saved
            })
            .catch(err => {
                // console.error(err);
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, err);
                // FormUtils.showAlert("Update Sample", "Sample not updated correctly", "error");
            });
    }

    onSync(e, type) {
        e.stopPropagation();
        switch (type) {
            case "phenotypes":
                this.updateParams = {...this.updateParams, phenotypes: e.detai.value};
                break;
            case "annotationsets":
                this.updateParams = {...this.updateParams, annotationSets: e.detail.value};
                break;
        }
    }

    // display a button to back sample browser.
    onShowBtnSampleBrowser() {
        const query = {
            xref: this.sampleId
        };

        const showBrowser = () => {
            LitUtils.dispatchCustomEvent(this, "querySearch", null, {query: query}, null);
            const hash = window.location.hash.split("/");
            const newHash = "#sample/" + hash[1] + "/" + hash[2];
            window.location.hash = newHash;
        };

        return html `
            <div style="float: right;padding: 10px 5px 10px 5px">
                <button type="button" class="btn btn-primary" @click="${showBrowser}">
                    <i class="fa fa-hand-o-left" aria-hidden="true"></i> Sample Browser
                </button>
            </div>
        `;
    }

    render() {
        return html`
            ${this._config?.display?.showBtnSampleBrowser? this.onShowBtnSampleBrowser(): nothing}
            <data-form
                .data=${this.sample}
                .config="${this._config}"
                .updateParams=${this.updateParams}
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }


    getDefaultConfig() {
        return Types.dataFormConfig({
            title: "Sample Update",
            icon: "fas fa-edit",
            type: "form",
            display: {
                style: "margin: 10px",
                defaultValue: "",
                defaultLayout: "horizontal",
                labelAlign: "right",
                labelWidth: 3,
            },
            sections: [{
                title: "Sample General Information",
                elements: [
                    {
                        title: "Sample ID",
                        field: "id",
                        type: "input-text",
                        display: {
                            placeholder: "Add a short ID...",
                            disabled: true,
                            helpMessage: "Add short sample id",
                        }
                    },
                    {
                        title: "Individual ID",
                        field: "individualId",
                        type: "input-text",
                        display: {
                            placeholder: "Add a short ID...",
                            disabled: true,
                            helpMessage: "Search individual to select"
                        }
                    },
                    {
                        title: "Description",
                        field: "description",
                        type: "input-text",
                        display: {
                            placeholder: "Add a description...",
                            rows: 3,
                        }
                    },
                    {
                        title: "Somatic",
                        field: "somatic",
                        type: "checkbox"
                    },
                    {
                        title: "Status name",
                        field: "status.name",
                        type: "input-text",
                        display: {
                            placeholder: "Add a status name..."
                        }
                    },
                    {
                        title: "Status Description",
                        field: "status.description",
                        type: "input-text",
                        display: {
                            rows: 3,
                            placeholder: "Add a description for the status..."
                        }
                    },
                    {
                        title: "Creation Date",
                        field: "creationDate",
                        type: "custom",
                        display: {
                            render: creationDate => html`${UtilsNew.dateFormatter(creationDate)}`
                        }
                    },
                ]
            },
            {
                title: "Processing Info",
                elements: [
                    {
                        title: "Product",
                        field: "processing.product",
                        type: "input-text",
                        display: {
                            placeholder: "Add a product..."
                        }
                    },
                    {
                        title: "Preparation Method",
                        field: "processing.preparationMethod",
                        type: "input-text",
                        display: {
                            placeholder: "Add a preparation method..."
                        }
                    },
                    {
                        title: "Extraction Method",
                        field: "processing.extractionMethod",
                        type: "input-text",
                        display: {
                            placeholder: "Add a extraction method..."
                        }
                    },
                    {
                        title: "Lab Sample ID",
                        field: "processing.labSambpleId",
                        type: "input-text",
                        display: {
                            placeholder: "Add the lab sample ID..."
                        }
                    },
                    {
                        title: "Quantity",
                        field: "processing.quantity",
                        type: "input-text",
                        display: {
                            placeholder: "Add a quantity..."
                        }
                    },
                    {
                        title: "Date",
                        field: "processing.date",
                        type: "input-date",
                        display: {
                            render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY")
                        }
                    }
                ]
            },
            {
                title: "Collection Info",
                elements: [
                    {
                        title: "Tissue",
                        field: "collection.tissue",
                        type: "input-text",
                        display: {
                            placeholder: "Add a tissue..."
                        }
                    },
                    {
                        title: "Organ",
                        field: "collection.organ",
                        type: "input-text",
                        display: {
                            placeholder: "Add an organ..."
                        }
                    },
                    {
                        title: "Quantity",
                        field: "collection.quantity",
                        type: "input-text",
                        display: {
                            placeholder: "Add a quantity..."
                        }
                    },
                    {
                        title: "Method",
                        field: "collection.method",
                        type: "input-text",
                        display: {
                            placeholder: "Add a method..."
                        }
                    },
                    {
                        title: "Date",
                        field: "collection.date",
                        type: "input-date",
                        display: {
                            render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY")
                        }
                    }
                ]
            },
            {
                title: "Phenotypes",
                elements: [
                    {
                        title: "",
                        type: "notification",
                        text: "Empty, create a new phenotype",
                        display: {
                            visible: sample => !(sample?.phenotypes && sample?.phenotypes.length > 0),
                            notificationType: "info",
                        }
                    },
                    {
                        field: "phenotype",
                        type: "custom",
                        display: {
                            layout: "vertical",
                            defaultLayout: "vertical",
                            width: 12,
                            style: "padding-left: 0px",
                            render: () => html`
                                <phenotype-list-update
                                    .phenotypes="${this.sample?.phenotypes}"
                                    .opencgaSession="${this.opencgaSession}"
                                    @changePhenotypes="${e => this.onSync(e, "phenotypes")}">
                                </phenotype-list-update>`
                        }
                    },
                ]
            },
            // {
            //     title: "Annotation Set",
            //     elements: [
            //         {
            //             field: "annotationSets",
            //             type: "custom",
            //             display: {
            //                 layout: "vertical",
            //                 defaultLayout: "vertical",
            //                 width: 12,
            //                 style: "padding-left: 0px",
            //                 render: () => html`
            //                 <annotation-set-update
            //                     .annotationSets="${this.sample?.annotationSets}"
            //                     .opencgaSession="${this.opencgaSession}"
            //                     @changeAnnotationSets="${e => this.onSync(e, "annotationsets")}">
            //                 </annotation-set-update>`
            //             }
            //         }
            //     ]
            // }
            ]
        });
    }

}

customElements.define("sample-update", SampleUpdate);
