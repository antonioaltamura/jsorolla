/*
 * Copyright 2016 OpenCB
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

import {RestResponse} from "../rest-response.js";
import Admin from "./api/Admin.js";
import Alignment from "./api/Alignment.js";
import Clinical from "./api/Clinical.js";
import Cohort from "./api/Cohort.js";
import DiseasePanel from "./api/DiseasePanel.js";
import Family from "./api/Family.js";
import File from "./api/File.js";
import GA4GH from "./api/GA4GH.js";
import Individual from "./api/Individual.js";
import Job from "./api/Job.js";
import Meta from "./api/Meta.js";
import Project from "./api/Project.js";
import Sample from "./api/Sample.js";
import Study from "./api/Study.js";
import User from "./api/User.js";
import Variant from "./api/Variant.js";
import VariantOperation from "./api/VariantOperation.js";


export class OpenCGAClient {

    constructor(config) {
        // this._config = config;
        this.setConfig(config);
        this.check();
    }

    getDefaultConfig() {
        return {
            host: "",
            version: "",
            userId: "",
            token: "",
            query: {
                batchSize: "",
                limit: 10
            },
            cookies: {
                active: true,
                prefix: ""
                // expirationTime: ""
            }
        };
    }

    async check() {
        const globalEvent = (type, value) => {
            globalThis.dispatchEvent(
                new CustomEvent(type, {
                    detail: value
                }));
        };
        try {
            const about = await this.meta().about();
            if (about.getResult(0)) {
                globalEvent("hostInit", {host: "opencga", value: "v" + about.getResult(0)["Version"]});
            } else {
                globalEvent("signingInError", {value: "Opencga host not available."});
                globalEvent("hostInit", {host: "opencga", value: "NOT AVAILABLE"});
            }
        } catch (e) {
            console.error(e);
            globalEvent("signingInError", {value: "Opencga host not available."});
            globalEvent("hostInit", {host: "opencga", value: "NOT AVAILABLE"});
        }
    }

    /*
     * Client singleton functions
     */
    users() {
        if (!this.clients.has("users")) {
            this.clients.set("users", new User(this._config));
        }
        return this.clients.get("users");
    }

    projects() {
        if (!this.clients.has("projects")) {
            this.clients.set("projects", new Project(this._config));
        }
        return this.clients.get("projects");
    }

    studies() {
        if (!this.clients.has("studies")) {
            this.clients.set("studies", new Study(this._config));
        }
        return this.clients.get("studies");
    }

    files() {
        if (!this.clients.has("files")) {
            this.clients.set("files", new File(this._config));
        }
        return this.clients.get("files");
    }

    jobs() {
        if (!this.clients.has("jobs")) {
            this.clients.set("jobs", new Job(this._config));
        }
        return this.clients.get("jobs");
    }

    samples() {
        if (!this.clients.has("samples")) {
            this.clients.set("samples", new Sample(this._config));
        }
        return this.clients.get("samples");
    }

    cohorts() {
        if (!this.clients.has("cohorts")) {
            this.clients.set("cohorts", new Cohort(this._config));
        }
        return this.clients.get("cohorts");
    }

    individuals() {
        if (!this.clients.has("individuals")) {
            this.clients.set("individuals", new Individual(this._config));
        }
        return this.clients.get("individuals");
    }

    families() {
        if (!this.clients.has("families")) {
            this.clients.set("families", new Family(this._config));
        }
        return this.clients.get("families");
    }

    panels() {
        if (!this.clients.has("panels")) {
            this.clients.set("panels", new DiseasePanel(this._config));
        }
        return this.clients.get("panels");
    }

    meta() {
        if (!this.clients.has("meta")) {
            this.clients.set("meta", new Meta(this._config));
        }
        return this.clients.get("meta");
    }

    admin() {
        if (!this.clients.has("admin")) {
            this.clients.set("admin", new Admin(this._config));
        }
        return this.clients.get("admin");
    }

    // Analysis
    alignments() {
        if (!this.clients.has("alignments")) {
            this.clients.set("alignments", new Alignment(this._config));
        }
        return this.clients.get("alignments");
    }

    variants() {
        if (!this.clients.has("variants")) {
            this.clients.set("variants", new Variant(this._config));
        }
        return this.clients.get("variants");
    }

    clinical() {
        if (!this.clients.has("clinical")) {
            this.clients.set("clinical", new Clinical(this._config));
        }
        return this.clients.get("clinical");
    }

    variantOperations() {
        if (!this.clients.has("variantOperations")) {
            this.clients.set("variantOperations", new VariantOperation(this._config));
        }
        return this.clients.get("variantOperations");
    }

    ga4gh() {
        if (!this.clients.has("ga4gh")) {
            this.clients.set("ga4gh", new GA4GH(this._config));
        }
        return this.clients.get("ga4gh");
    }

    /*
     * Convenient function to create a client from the entity name, this is case insensitive.
     */
    getClient(entity) {
        switch (entity?.toUpperCase()) {
            case "USER":
                return this.users();
            case "PROJECT":
                return this.projects();
            case "STUDY":
                return this.studies();
            case "JOB":
                return this.jobs();
            case "FILE":
                return this.files();
            case "SAMPLE":
                return this.samples();
            case "INDIVIDUAL":
                return this.individuals();
            case "FAMILY":
                return this.families();
            case "COHORT":
                return this.cohorts();
            case "PANEL":
            case "DISEASE_PANEL":
                return this.panels();
            case "ALIGNMENT":
                return this.alignments();
            case "VARIANT":
                return this.variants();
            case "VARIANT_OPERATIONS":
                return this.variantOperations();
            case "CLINICAL":
            case "CLINICAL_ANALYSIS":
                return this.clinical();
            case "META":
                return this.meta();
            default:
                throw new Error("Resource not recognized");
        }
    }

    async login(userId, password) {
        try {
            const restResponse = await this.users().login({user: userId, password: password});

            // TODO remove userId and token from config and move it to session
            this._config.userId = userId;
            this._config.token = restResponse.getResult(0).token;

            // Check if cookies being used
            if (this._config.cookies.active) {
                this.setCookies(userId, this._config.token);
            }
            this.clients.forEach(client => client.setToken(this._config.token));
            // this.createSession();
            return restResponse;
        } catch (restResponse) {
            console.error(restResponse);
            return restResponse;
        }
    }

    setCookies(userId, token) {
        if (userId && token) {
            Cookies.set(this._config.cookies.prefix + "_userId", userId);
            Cookies.set(this._config.cookies.prefix + "_sid", this._config.token);
        } else {
            Cookies.expire(this._config.cookies.prefix + "_userId");
            Cookies.expire(this._config.cookies.prefix + "_sid");
        }
    }

    // refresh only works if cookies are enabled
    async refresh() {
        const userId = this._config.userId;
        const response = await this.users().login({refreshToken: this._config.token});
        this._config.token = response.getResult(0).token;

        await this.updateUserConfigs({
            lastAccess: new Date().getTime()
        });

        if (this._config.cookies.active) {
            this.setCookies(userId, this._config.token);
        }
        this.clients.forEach(client => client.setToken(this._config.token));
        return response;
    }

    logout() {
        // TODO remove when we use session
        this._config.userId = null;
        this._config.token = null;
        // this.session = null;

        // Remove cookies
        if (this._config.cookies.active) {
            this.setCookies();
        }
        return Promise.resolve();
    }

    /**
     * Creates and return an anonymous session object, it is a sync function.
     */
    createAnonymousSession() {
        const opencgaSession = {};
        opencgaSession.user = {
            id: "anonymous", projects: []
        };
        opencgaSession.token = "";
        opencgaSession.date = new Date().toISOString();
        opencgaSession.server = {
            host: this._config.host,
            version: this._config.version
        };
        opencgaSession.opencgaClient = this;

        return opencgaSession;
    }

    /**
     * Creates an authenticated session for the user and token of the current OpenCGAClient. The token is taken from the
     * opencgaClient object itself.
     * @returns {Promise<any>}
     */
    // TODO urgent refactor
    createSession() {
        const _this = this;
        return new Promise((resolve, reject) => {
            // check that a session exists
            // TODO should we check the session has not expired?
            if (_this._config.token) {
                _this._notifySessionEvent("signingIn", "Fetching User data");
                _this.users().info(_this._config.userId)
                    .then(async response => {
                        const session = {};
                        try {
                            session.user = response.getResult(0);
                            session.token = _this._config.token;
                            session.date = new Date().toISOString();
                            session.server = {
                                host: _this._config.host,
                                version: _this._config.version,
                                // serverVersion: _this._config.serverVersion,
                            };
                            session.opencgaClient = _this;
                            _this._notifySessionEvent("signingIn", "Updating User config");
                            const userConfig = await this.updateUserConfigs({
                                ...session.user.configs.IVA,
                                lastAccess: new Date().getTime()
                            });
                            session.user.configs.IVA = userConfig.getResult(0);
                        } catch (e) {
                            console.error(e);
                        }


                        session.projects = session.user.projects;


                        // Fetch authorised Projects and Studies
                        _this._notifySessionEvent("signingIn", "Fetching Projects and Studies");
                        _this.projects().search({})
                            .then(async function (response) {
                                try {
                                    // session.projects = response.responses[0].results;
                                    for (const project of response.responses[0].results) {
                                        let projectIndex = session.projects.findIndex(proj => proj.fqn === project.fqn);
                                        if (projectIndex < 0) {
                                            session.projects.push(project);
                                        }
                                    }
                                    if (session.projects?.length) {    // && session?.projects[0]?.studies.length
                                        const studies = [];
                                        for (const project of session.projects) {
                                            // project.alias = project.alias || project.fqn || null;
                                            if (project.studies?.length > 0) {
                                                for (const study of project.studies) {
                                                    // We need to store the user permission fr the all the studies fetched
                                                    _this._notifySessionEvent("signingIn", "Fetching User permissions");

                                                    let acl = null;
                                                    const admins = study.groups.find(g => g.id === "@admins");
                                                    if (admins.userIds?.includes(session.user.id)) {
                                                        acl = await _this.studies().acl(study.fqn, {});
                                                    } else {
                                                        acl = await _this.studies().acl(study.fqn, {member: session.user.id});
                                                    }
                                                    study.acl = acl.getResult(0);

                                                    // Fetch all the cohort
                                                    _this._notifySessionEvent("signingIn", "Fetching Cohorts");
                                                    const cohortsResponse = await _this.cohorts()
                                                        .search({study: study.fqn, internalStatus: "READY", include: "id,description,numSamples,internal,attributes", limit: 50});
                                                    study.cohorts = cohortsResponse.responses[0].results
                                                        .filter(cohort => !cohort.attributes?.IVA?.ignore);
                                                    // FIXME line above should check cohort.internal instead
                                                    // .filter(cohort => cohort.internal.index?.status === "READY");

                                                    // Check if lastStudy form User Configuration matches
                                                    if (session.user?.configs?.IVA?.lastStudy === study.fqn) {
                                                        session.project = project;
                                                        session.study = study;
                                                    }
                                                    // Keep track of the studies to fetch Disease Panels
                                                    studies.push(project.id + ":" + study.id);
                                                }
                                            }
                                        }

                                        /** if the user doesn't have his own Default study in User config then there the fallback is:
                                         *  first study of the first project
                                         */
                                        // We select the first project and study as default
                                        if (!session.project && !session.study) {
                                            for (const project of session.projects) {
                                                if (project.studies?.length > 0) {
                                                    session.project = project;
                                                    session.study = project.studies[0];
                                                }
                                            }
                                        }

                                        // if (!session.project || !session.study) {
                                        //     throw new Error("Default study not found");
                                        // }

                                        // Fetch the Disease Panels for each Study
                                        _this._notifySessionEvent("signingIn", "Fetching Disease Panels");
                                        const panelPromises = [];
                                        for (const study of studies) {
                                            const promise = _this.panels().search({
                                                study: study,
                                                limit: 2000,
                                                include: "id,name,stats,source,genes.id,genes.name,genes.modeOfInheritance,genes.confidence,regions.id"
                                            });
                                            panelPromises.push(promise);
                                        }
                                        const panelResponses = await Promise.all(panelPromises);
                                        for (let i = 0, t = 0; i < session.projects.length; i++) {
                                            for (let x = 0; x < session.projects[i].studies.length; x++, t++) {
                                                session.projects[i].studies[x].panels = panelResponses[t].getResults();
                                            }
                                        }
                                    }
                                    resolve(session);
                                } catch (e) {
                                    console.error("Error getting study permissions, cohorts or disease panels");
                                    console.error(e);
                                    reject(new Error("Error getting study permissions / study panels"));
                                }
                            })
                            .catch(response => {
                                console.error(response);
                                reject(new Error("An error when getting user projects"));
                            });
                    })
                    .catch(response => {
                        console.error(response);
                        reject(new Error("An error getting user information"));
                    });
            } else {
                console.error("No valid token:" + _this?._config?.token);
                reject(new Error("No valid token:" + _this?._config?.token));
            }
        });
    }

    _notifySessionEvent(id, message) {
        globalThis.dispatchEvent(new CustomEvent(id,
            {
                detail: {
                    value: message
                }
            }
        ));
    }

    getConfig() {
        return this._config;
    }

    setConfig(config) {
        this._config = {...this.getDefaultConfig(), ...config};
        this.clients = new Map();
    }

    getClients() {
        return this.clients;
    }

    getUserConfigs() {
        return this.users().configs(this._config.userId, "IVA");
    }

    updateUserConfigs(data) {
        // TODO remove this nasty nested bug fix
        if (data?.IVA) {
            delete data.IVA;
        }
        const userIvaConfig = this.users().updateConfigs(this._config.userId, {
            id: "IVA",
            configuration: {
                ...data
            }
        });
        // Update opencgaSession object
        // if (opencgaSession?.user?.configs) {
        //     opencgaSession.user.configs.IVA = userIvaConfig.responses[0].results[0];
        // }
        return userIvaConfig;
    }

}
