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
import {RestResponse} from "../../core/clients/rest-response.js";
import LitUtils from "../commons/utils/lit-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";


export default class UserLogin extends LitElement {

    constructor() {
        super();
        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
        };
    }

    #init() {
        this.hasEmptyUser = false;
        this.hasEmptyPassword = false;
    }

    firstUpdated() {
        if (this.opencgaSession?.study) {
            this.redirect("home");
        }
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") && this.opencgaSession?.study) {
            this.redirect("home");
        }
    }

    redirect(to) {
        LitUtils.dispatchCustomEvent(this, "redirect", null, {hash: to});
    }

    onSubmit() {
        const user = (this.querySelector("#user").value || "").trim();
        const password = (this.querySelector("#password").value || "").trim();

        this.hasEmptyUser = user.length === 0;
        this.hasEmptyPassword = password.length === 0;
        if (this.hasEmptyUser || this.hasEmptyPassword) {
            return this.requestUpdate();
        }

        if (this.opencgaSession) {
            this.requestUpdate(); // Remove errors
            this.opencgaSession.opencgaClient.login(user, password)
                .then(response => {
                    if (response instanceof RestResponse) {
                        if (response.getEvents?.("ERROR")?.length) {
                            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                        } else if (response) {
                            const token = response.getResult(0).token;
                            const decoded = jwt_decode(token);
                            const dateExpired = new Date(decoded.exp * 1000);
                            const validTimeSessionId = moment(dateExpired, "YYYYMMDDHHmmss").format("D MMM YY HH:mm:ss");

                            LitUtils.dispatchCustomEvent(this, "login", null, {
                                userId: user,
                                token: token
                            }, null);

                            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                                message: `Welcome back, <b>${user}</b>. Your session is valid until ${validTimeSessionId}`,
                            });
                        }
                    } else {
                        NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_ERROR, {
                            title: "Generic Server Error",
                            message: "Unexpected response format. Please check your host is up and running.",
                        });
                    }
                })
                .catch(response => {
                    NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, response);
                });
        } else {
            NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_ERROR, {
                title: "Error retrieving OpencgaSession",
                message: `
                    There was an error retrieving the OpencgaSession.
                    Please try again later or contact the administrator if the problem persists.
                `,
            });
        }
    }

    // Handle keyup event --> check for enter key to submit the form
    onKeyUp(e) {
        if (e.key === "Enter") {
            return this.onSubmit(e);
        }
    }

    // NOTE Josemi 20220317: reset password is disabled until we have an endpoint in OpenCGA to allow users
    // to reset it's password
    renderResetPasswordLink() {
        return null;
        // return html`
        //     <div align="center">
        //         <a @click="${() => this.redirect("#reset-password")}" style="cursor:pointer;">Forgot your password?</a>
        //     </div>
        // `;
    }

    render() {
        return html`
            <div class="container-fluid" style="max-width:380px;">
                <div class="panel panel-default" style="margin-top:96px;">
                    <div class="panel-body" style="padding:32px;">
                        <div align="center">
                            <h3 style="font-weight:bold;margin-top:0px;">
                                Login
                            </h3>
                        </div>
                        <div class="form-group ${this.hasEmptyUser ? "has-error" : ""}">
                            <label for="user" class="control-label label-login">User ID</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="username">
                                    <i class="fa fa-user fa-lg"></i>
                                </span>
                                <input id="user" type="text" class="form-control" placeholder="User ID" @keyup="${e => this.onKeyUp(e)}">
                            </div>
                        </div>
                        <div class="form-group ${this.hasEmptyPassword ? "has-error" : ""}">
                            <label for="pass" class="control-label label-login">Password</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="username">
                                    <i class="fa fa-key fa-lg"></i>
                                </span>
                                <input id="password" type="password" class="form-control" placeholder="Password" @keyup="${e => this.onKeyUp(e)}">
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" @click="${e => this.onSubmit(e)}">
                            <strong>Sign In</strong>
                        </button>
                    </div>
                </div>
                ${this.renderResetPasswordLink()}
            </div>
        `;
    }

}

customElements.define("user-login", UserLogin);
