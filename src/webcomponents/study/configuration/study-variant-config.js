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

import {LitElement, html} from "lit";
import "./config-list-update.js";
import LitUtils from "../../commons/utils/lit-utils.js";
import UtilsNew from "../../../core/utilsNew.js";

export default class StudyVariantConfig extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            variantEngineConfig: {
                type: Object
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
        // console.log("init study variant config");
        this.updateParams = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("variantEngineConfig")) {
            this.variantEngineConfigObserver();
        }
        super.update(changedProperties);
    }

    variantEngineConfigObserver() {
        if (this.variantEngineConfig) {
            this._variantEngineConfig = JSON.parse(JSON.stringify(this.variantEngineConfig));
        }
    }


    onSyncItem(e) {
        e.stopPropagation();
        console.log("onSyncItem variant: ", e.detail.value);
        const {index, node, item} = e.detail.value;

        if (index === -1) {
            switch (node.parent) {
                case "fileIndexConfiguration":
                    // customFields
                    this.variantEngineConfig.sampleIndex[node.parent][node.child].push(item);
                    break;
                case "populationFrequency":
                    this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child].push(item);
                    break;
                case "biotype":
                case "consequenceType":
                case "clinicalSource":
                case "clinicalSignificance":
                case "transcriptFlagIndexConfiguration":
                    this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child][item.key] = item.values;

                    // Don't detect the change to update the component valuesMapping
                    // const valuesMapping = this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child];
                    // this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child] = {
                    //     ...valuesMapping,
                    //     [item.key]: item.values
                    // };
                    break;
            }
        }

        // edited valuesMapping (add or delete values)
        if (node?.child === "valuesMapping" && index !== -1) {
            this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child][index] = item.values;
            console.log("edited.....", this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child]);
        }

        this.variantEngineConfig = {
            ...this.variantEngineConfig
        };
    }

    onSyncRemoveItem(e) {
        e.stopPropagation();
        const {node, items} = e.detail.value;
        switch (node.parent) {
            case "fileIndexConfiguration":
                this.variantEngineConfig.sampleIndex.fileIndexConfiguration.customFields = items;
                break;
            case "populationFrequency":
                this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child] = items;
                // const populations = this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child];
                // this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child] = UtilsNew.removeArrayByIndex(populations, item.index);
                break;
            case "biotype":
            case "consequenceType":
            case "clinicalSource":
            case "clinicalSignificance":
            case "transcriptFlagIndexConfiguration":
                this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.parent][node.child] = items;
                break;
        }

        this.variantEngineConfig = {
            ...this.variantEngineConfig
        };
    }

    onFieldChange(e) {
        e.stopPropagation();
        console.log("on Field Change", e.detail);
        const {param} = e.detail;

        if (param?.includes("transcriptCombination")) {
            const val = e.detail.value;
            this.variantEngineConfig.sampleIndex.annotationIndexConfiguration.transcriptCombination = val;
        } else {
            // debugger
            const {node, param, value} = e.detail.value;
            this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.child] = {
                ...this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.child],
                [param]: value
            };
        }

        console.log("edited", this.variantEngineConfig);

    }

    onAddValues(e) {
        e.stopPropagation();
        const {node, values} = e.detail.value;
        this.variantEngineConfig.sampleIndex.annotationIndexConfiguration[node.child].values = values;
    }

    onClear() {

    }

    onSubmit() {
        // operation/variant/configure
        console.log("submit variant configs", this.variantEngineConfig);

    }

    configVariant(key, item, modal) {

        // Type
        // RANGE_LT, RANGE_GT. CATEGORICAL, CATEGORICAL_MULTI_VALUE

        // Source
        // VARIANT, META, FILE, SAMPLE, ANNOTATION

        //  IndexFieldConfiguration
        /** Source, key,type, thresholds, values, valuesMapping, nullable
         **/

        // DEPRECATED
        // const configModal = isNew => {
        //     return isNew ? {
        //         type: "modal",
        //         title: "Add Config",
        //         buttonStyle: "margin-top:6px"
        //     } : {
        //         type: "modal",
        //         title: "Edit Config",
        //         item: {
        //             title: item?.title,
        //             subtitle: item?.subtitle
        //         },
        //         buttonClass: "pull-right",
        //         btnGroups: [
        //             {
        //                 title: "Edit",
        //                 openModal: true,
        //             },
        //             {
        //                 title: "Delete",
        //                 btnClass: "btn-danger",
        //                 event: "removeItem"
        //             }
        //         ]
        //     };
        // };

        const configSection = key => {
            let node = {};
            switch (key) {
                case "fileIndexConfiguration":
                    return {
                        elements: [
                            {
                                title: "Source",
                                field: "source",
                                type: "input-text",
                            },
                            {
                                title: "Key",
                                field: "key",
                                type: "input-text",
                            },
                            {
                                title: "Type",
                                field: "type",
                                type: "input-text",
                            },
                            {
                                title: "Nullable",
                                field: "nullable",
                                type: "checkbox",
                            },
                        ]
                    };
                case "populations":
                    return {
                        elements: [
                            {
                                title: "Study",
                                field: "study",
                                type: "input-text",
                            },
                            {
                                title: "Population",
                                field: "population",
                                type: "input-text",
                            },
                        ]
                    };
                case "valuesMapping":
                    return {
                        elements: [
                            {
                                title: "key",
                                field: "key",
                                type: "input-text",
                            },
                            {
                                title: "Values",
                                field: "values",
                                type: "custom",
                                display: {
                                    render: data => {
                                        return html `
                                            <select-token-filter-static
                                                .data=${data}
                                                .value="${data?.join(",")}">
                                            </select-token-filter-static>`;
                                    }
                                }
                            }
                        ]
                    };
                case "populationFrequency":
                    node = {parent: "populationFrequency", child: "populations"};
                    return {
                        elements: [
                            {
                                title: "Populations",
                                field: "populations",
                                type: "custom",
                                display: {
                                    // layout: "horizontal",
                                    contentLayout: "horizontal",
                                    defaultLayout: "horizontal",
                                    width: 12,
                                    style: "padding-left: 0px",
                                    render: variant => html`
                                        <list-update
                                            .node=${node}
                                            .data="${{items: variant}}"
                                            .config=${this.configVariant("populations", {title: "study", subtitle: "population"}, true)}>
                                        </list-update>`
                                }
                            },
                            {
                                title: "thresholds",
                                field: "thresholds",
                                type: "custom",
                                display: {
                                    // layout: "horizontal",
                                    contentLayout: "horizontal",
                                    defaultLayout: "horizontal",
                                    width: 12,
                                    style: "padding-left: 0px",
                                    render: data => html`
                                        <select-token-filter-static
                                            .data=${data}
                                            .value="${data?.join(",")}">
                                        </select-token-filter-static>`
                                }
                            },
                        ]
                    };
                case "biotype":
                case "consequenceType":
                case "clinicalSource":
                case "clinicalSignificance":
                case "transcriptFlagIndexConfiguration":
                case "annotationIndexConfiguration":
                    node = {parent: key, child: "valuesMapping"};
                    return {
                        elements: [
                            {
                                title: "Source",
                                field: "source",
                                type: "input-text",
                            },
                            {
                                title: "Key",
                                field: "key",
                                type: "input-text",
                            },
                            {
                                title: "Type",
                                field: "type",
                                type: "input-text",
                            },
                            {
                                title: "Nullable",
                                field: "nullable",
                                type: "checkbox",
                            },
                            {
                                title: "Values",
                                field: "values",
                                type: "custom",
                                display: {
                                    // layout: "horizontal",
                                    contentLayout: "horizontal",
                                    defaultLayout: "horizontal",
                                    width: 12,
                                    style: "padding-left: 0px",
                                    render: variant => html`
                                        <select-token-filter-static
                                            .data=${variant}
                                            .value="${variant?.join(",")}">
                                        </select-token-filter-static>`
                                }
                            },
                            {
                                title: "ValuesMapping",
                                field: "valuesMapping",
                                type: "custom",
                                display: {
                                    contentLayout: "horizontal",
                                    defaultLayout: "horizontal",
                                    width: 12,
                                    style: "padding-left: 0px",
                                    render: valuesMapping => html`
                                        <list-update
                                            .node=${node}
                                            .data="${{items: valuesMapping}}"
                                            .config=${this.configVariant("valuesMapping", {}, true)}>
                                        </list-update>`
                                }
                            },
                        ]
                    };
            }
        };

        const configForm = (key, isNew) => {
            return {
                title: isNew ? "Add Config":"Edit",
                type: modal ? "modal" :"",
                // buttons: {
                //     show: modal,
                //     cancelText: "Cancel",
                //     classes: modal ? "btn btn-primary ripple pull-right": "pull-right",
                //     okText: isNew? "Add" : "Edit"
                // },
                display: {
                    titleVisible: false,
                    buttonOkText: "Save",
                    buttonClearText: "Cancel",
                    buttonsVisible: modal,
                    buttonsLayout: false,
                    buttonsClassName: modal ? "btn btn-primary ripple pull-right": "pull-right",
                    modalButtonClassName: !isNew?"btn-sm":"",
                    modalButtonStyle: isNew ? "margin-top:6px":"",
                    titleWidth: 3,
                    titleAlign: "right",
                    defaultLayout: "horizontal",
                    defaultValue: ""
                },
                sections: [configSection(key)]
            };
        };

        if (key.constructor === Array) {
            const configs = {};
            key.forEach(key => {
                configs[key] = {
                    ...configs[key],
                    edit: configForm(key, false),
                    new: configForm(key, true),
                    item: {
                        title: item?.title,
                        subtitle: item?.subtitle
                    },
                };
            });
            return configs;
        }

        return {
            item: {
                title: item?.title,
                subtitle: item?.subtitle
            },
            edit: configForm(key, false),
            new: configForm(key, true)
        };
    }

    getDefaultConfig() {
        return {
            type: "form",
            // buttons: {
            //     show: true,
            //     cancelText: "Cancel",
            //     okText: "Update"
            // },
            display: {
                buttonOkText: "Update",
                buttonClearText: "Cancel",
                buttonsVisible: true,
                buttonsLayout: false,
                buttonsWidth: 8,
                style: "margin: 10px",
                labelWidth: 3,
                labelAlign: "right",
                defaultLayout: "horizontal",
                defaultValue: "",
                // help: {
                //     mode: "block" // icon
                // }
            },
            sections: [
                {
                    title: "File Index Configuration",
                    elements: [
                        {
                            field: "sampleIndex.fileIndexConfiguration.customFields",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 8,
                                style: "padding-left: 0px",
                                render: customFields => {
                                    const node = {parent: "fileIndexConfiguration", child: "customFields"};
                                    return html`
                                    <list-update
                                        .node=${node}
                                        .data="${{items: customFields}}"
                                        .config=${this.configVariant("fileIndexConfiguration", {title: "source", subtitle: "key"}, true)}
                                        @changeItem=${e => this.onSyncItem(e)}
                                        @removeItem=${e => this.onSyncRemoveItem(e)}>
                                    </list-update>`;
                                }
                            }
                        },
                    ]
                },
                {
                    title: "Annotation Index Configuration",
                    elements: [
                        {
                            field: "sampleIndex.annotationIndexConfiguration",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: annotationIndexConfiguration => {
                                    const itemKeys = Object?.keys(annotationIndexConfiguration)
                                        .filter(key => annotationIndexConfiguration[key] instanceof Object);
                                    return html`
                                        <config-list-update
                                            key="annotationIndexConfiguration"
                                            .items="${annotationIndexConfiguration}"
                                            .config=${this.configVariant(itemKeys, {}, false)}
                                            @changeItem=${e => this.onSyncItem(e)}
                                            @removeItem=${e => this.onSyncRemoveItem(e)}>
                                        </config-list-update>`;
                                }
                            }
                        },
                        // {
                        //     title: "Transcript Combination",
                        //     field: "sampleIndex.annotationIndexConfiguration.transcriptCombination",
                        //     type: "checkbox"
                        // },
                    ]
                },
            ]
        };
    }

    render() {
        return html`
            <div style="margin: 25px 40px">
                <data-form
                    .data=${this.variantEngineConfig}
                    .config=${this._config}
                    @fieldChange="${e => this.onFieldChange(e)}"
                    @addValues="${e => this.onAddValues(e)}"
                    @clear="${this.onClear}"
                    @submit="${this.onSubmit}">
                </data-form>
            </div>
        `;
    }

}

customElements.define("study-variant-config", StudyVariantConfig);
