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
import LitUtils from "../utils/lit-utils.js";
import UtilsNew from "../../../core/utilsNew.js";


export default class CustomSidebar extends LitElement {

    constructor() {
        super();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            loggedIn: {
                type: Boolean
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    onSideBarToggle(e) {
        LitUtils.dispatchCustomEvent(this, "sideBarToggle", "", {event: e}, null);
    }

    onChangeApp(e, toggle) {
        LitUtils.dispatchCustomEvent(this, "changeApp", "", {event: e, toggle: toggle}, null);
    }

    render() {
        return html `
            <style>
                  /* The side navigation menu */
                #side-nav {
                    position: fixed;
                    z-index: 1002;
                    top: 0;
                    left: -250px;
                    background-color: #fff;
                    overflow-x: hidden;
                    padding-top: 20px;
                    width: 320px;
                    visibility: hidden;
                    /*transform: translate(-250px);*/
                    height: 100vh;
                    transform-origin: top left;
                    animation-duration: .3s;
                    animation-timing-function: ease;
                    animation-name: slideOutFrames
                }

                #side-nav.active {
                    left: 0px;
                    visibility: visible;
                    animation-name: slideInFrames
                }

                #side-nav .iva-logo {
                    font-size: 5px;
                    text-align: center;
                    margin-top: 30px;
                }

                #side-nav .nav a {
                    padding: 6px 1px 6px 1px;
                    text-decoration: none;
                    color: #818181;
                    display: block;
                    transition: 0.3s;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: .2em;
                }

                #side-nav .nav a:hover {
                    color: #204d74;
                }

                #side-nav .closebtn {
                    position: absolute;
                    top: 0;
                    right: 25px;
                    font-size: 36px;
                    margin-left: 50px;
                    padding:0;
                    z-index: 99;
                }

                #side-nav a.closebtn:hover {
                    background: transparent;
                    text-decoration: none;
                    color: black;
                }

                #side-nav a > img,
                #side-nav a > i {
                    width:48px
                }

                #side-nav .nav a.sidebar-nav-login {
                    padding: 20px 0;
                }

            </style>
            <!-- Left Sidebar: we only display this if more than 1 visible app exist -->
            ${this.config?.apps?.filter(app => UtilsNew.isAppVisible(app, this.opencgaSession)).length > 0 ? html`
                <div id="overlay" @click="${this.onSideBarToggle}"></div>
                <div id="side-nav" class="sidenav shadow-lg">
                    <a class="closebtn" @click="${this.onSideBarToggle}">&times;</a>
                    <nav class="navbar" id="sidebar-wrapper" role="navigation">
                        <a href="#home" @click="${e => this.onChangeApp(e, true)}">
                            <div class="iva-logo">
                                <img src="${this.config.logoAlt}" />
                                <span class="subtitle">OpenCB Suite</span>
                            </div>
                        </a>
                        <ul class="nav sidebar-nav">
                            ${!this.loggedIn ? html`
                                <li>
                                    <a href="#login" class="text-center sidebar-nav-login" role="button" @click="${e => this.onChangeApp(e, true)}">
                                        <i href="#login" class="fa fa-3x fa-sign-in-alt fa-lg icon-padding" aria-hidden="true"></i>Login
                                    </a>
                                </li>
                            ` : null}

                            ${this.config?.apps?.filter(item => UtilsNew.isAppVisible(item, this.opencgaSession)).map(item => html`
                                <li>
                                    <a href="#home" role="button" data-id="${item.id}" @click="${e => this.onChangeApp(e, true)}">
                                        <img src="${item.icon}" alt="${item.name}"/>  ${item.name}
                                    </a>
                                </li>
                            `)}
                        </ul>
                    </nav>
                </div>
            ` : null
            }
                `;
    }

}

customElements.define("custom-sidebar", CustomSidebar);
