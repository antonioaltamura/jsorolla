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
import UtilsNew from "../../utilsNew.js";
import "./opencga-file-view.js";
import "../commons/view/data-form.js";
import "../loading-spinner.js";

export default class OpencgaFileManager extends LitElement {

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
            root: {
                type: String
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.currentRootId = ":";
        this.tree = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }

        if (changedProperties.has("opencgaSession")) {
            this.opencgaSession.opencgaClient.files().tree(this.currentRootId, {study: this.opencgaSession.study.fqn, maxDepth: 3, include: "id,name,path,size,format"})
                .then(restResponse => {
                    this.tree = restResponse.getResult(0);
                    this.currentRoot = restResponse.getResult(0);
                    this.requestUpdate();
                })
                .catch(restResponse => {
                    console.error(restResponse);
                });
        }
    }

    async fetchFolder(node) {
        try {
            if (!node.visited) {
                const restResponse = await this.opencgaSession.opencgaClient.files().tree(node.file.id, {study: this.opencgaSession.study.fqn, maxDepth: 3,include: "id,name,path,size,format"})
                const result = restResponse.getResult(0);
                node.children = result.children;
                node.visited = true;
                //this.currentRoot = result;
            } else {
                //this.currentRoot = node;
            }

            console.log("current root", this.currentRoot)

            this.requestUpdate();
        } catch (restResponse) {
            console.error(restResponse);
        }
    }

    searchNode(nodeId, array) {
        for (const f of array) {
            if (f.file.id === nodeId) {
                return f;
            }
            if (f.file.type === "DIRECTORY") {
                const r = this.searchNode(nodeId, f.children || []);
                if (r) return r;
            }
        }
    }

    renderFileManager(root) {
        const children = root.children;
        return html`
            ${this.path(root)}
            <ul class="file-manager">
                ${children.map(node => {
                    if (node.file.type === "DIRECTORY") {
                        return html`${this.folder(node)}`;
                    } else if (node.file.type === "FILE") {
                        return html`${this.file(node)}`;
                    } else {
                        throw new Error("Type not recognized " + node.file.type);
                    }
                })}
            </ul>
        `;
    }

    icon(format, size) {
        const icon = {
            IMAGE: "fas fa-file-image",
            VCF: "fas fa-file"
        }[format];
        return html`<i class="${icon || "fas fa-file"} ${size ? `fa-${size}x` : ""}"></i>`
    }

    renderTree(root) {
        const children = root.children;
        const domId = `tree-${root.file.id.replace(/:/g, "")}`;
        return html`
            ${root.file.name !== "." ? html`
                    <i @click="${() => this.toggleFolder(domId, root)}" class="fas fa-angle-${root.exploded ? "down" : "right"}"></i> <a class="folder-name ${domId} ${root.exploded ? "exploded" : ""}" @click="${() => this.toggleFolder(domId, root)}"> ${root.file.name} </a>
                ` : html`
                    <i class="fas fa-home"></i> <a class="home" @click="${this.reset}"> Home</a>`}
            
            <ul class="">
                ${children.map(node => {
                    if (node.file.type === "DIRECTORY") {
                        return html`
                            <li class="folder">
                                <!-- <span class="badge">${node.children.length}</span>-->
                                ${this.renderTree(node)}
                            </li>`;
                    } else if (node.file.type === "FILE") {
                        return html`
                            <p class="file" @click="${() => this.onClickFile(node.file.id)}">
                                ${this.icon(node)} ${node.file.name}
                            </p>`;
                    } else {
                        throw new Error("Type not recognized " + node.file.type);
                    }
                })}
            </ul>
        `;
    }

    async toggleFolder(domId, node) {
        //check for the root
        if (domId !== "tree-") {
            if(!node.exploded) {
                /*node.exploded = true;
                if(!node.visited) {
                    await this.fetchFolder(node);
                }
                $("." + domId + "").addClass("exploded")*/
                this.route(node.file.id);
            } else {
                node.exploded = false;
                $("." + domId + "").removeClass("exploded")
            }
            console.log("toggle" + node.file.id);
            console.log($("." + domId + " ul"));

        } else {
            console.error("no id!")
        }
        //$("." + id + " + ul").slideToggle();
        await this.requestUpdate();
    }


    folder(node) {
        return html`
            <li class="folder">
                <a @click="${() => this.route(node.file.id)}">
                    <span class="icon"><i class="fas fa-folder fa-5x"></i></span>
                    <span class="content">
                        <span class="name"><span class="max-lines-2"> ${node.file.name} </span>
                        <span class="details">${node.children.length} items</span>
                    </span>
                </a>
            </li>
        `;
    }

    file(node) {
        return html`
            <li class="file">
                <a @click="${() => this.onClickFile(node.file.id)}">
                    <span class="icon">${this.icon(node.file.format, 5)}<span class="format">${node.file.format}</span></span>
                    <span class="content">
                        <span class="name">
                            <span class="max-lines-2">
                                ${node.file.name}
                            </span>
                        </span>
                        <span class="details">${UtilsNew.getDiskUsage(node.file.size)}</span>
                    </span>
                </a>
            </li>
        `;
    }

    async route(id) {
        console.log("route", id)
        this.currentRoot = this.searchNode(id, this.tree.children);
        this.currentRoot.exploded = true;

        if(!this.currentRoot.visited) {
            await this.fetchFolder(this.currentRoot);
        }

        const domId = `tree-${id.replace(/:/g, "")}`;
        $("." + domId + "").addClass("exploded");

        //$("." + domId + " + ul").slideToggle();
        this.fileId = null;
        this.requestUpdate();
    }

    reset() {
        console.log("reset")
        this.currentRoot = this.tree;
        this.fileId = null;
        this.requestUpdate();
    }

    path(node) {
        const path = node.file.id.split(":").filter(Boolean);
        return html`
            <div class="file-manager-breadcrumbs">
                <a @click="${this.reset}"> ~ </a> <span class="path-separator">/</span>
                ${path.map((name, i) => html`<a @click="${() => this.route(path.slice(0, i + 1).join(":") + ":")}"> ${name} </a> <span class="path-separator">/</span>`)}
            </div>`;
    }

    onClickFile(id) {
        console.log(id)
        this.fileId = id;
        this.requestUpdate();
    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: ""
        };
    }


    render() {
        return html`
            <div class="">
                <h2>
                    <i aria-hidden="true" class="fas fa-file"></i> File Explorer
                </h2>
            </div>
            
            <div class="row">
                <div class="col-md-3 left-menu file-manager-tree">
                    ${this.tree ? html`${this.renderTree(this.tree)}` : null}
                    
                </div>

                <div class="col-md-9">
                    ${this.currentRoot ? html`
                        <div>
                            ${this.renderFileManager(this.currentRoot)}
                        </div>
                    <opencga-file-view .opencgaSession="${this.opencgaSession}" .fileId="${this.fileId}"></opencga-file-view>
                ` : html`<loading-spinner></loading-spinner>`}
                    
                </div>
            </div>
            
        `;
    }

}

customElements.define("opencga-file-manager", OpencgaFileManager);
