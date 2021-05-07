/**
 * Copyright 2015-2020 OpenCB
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * WARNING: AUTOGENERATED CODE
 * 
 * This code was generated by a tool.
 * Autogenerated on: 2021-04-30 10:42:30
 * 
 * Manual changes to this file may cause unexpected behavior in your application.
 * Manual changes to this file will be overwritten if the code is regenerated. 
 *
**/

import OpenCGAParentClass from "./../opencga-parent-class.js";


/**
 * This class contains the methods for the "Meta" resource
 */

export default class Meta extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    /** Returns info about current OpenCGA code.
    * 
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    about() {
        return this._get("meta", null, null, null, "about");
    }

    /** API
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.category] - List of categories to get API from.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    api(params) {
        return this._get("meta", null, null, null, "api", params);
    }

    /** Ping Opencga webservices.
    * 
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    fail() {
        return this._get("meta", null, null, null, "fail");
    }

    /** Ping Opencga webservices.
    * 
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    ping() {
        return this._get("meta", null, null, null, "ping");
    }

    /** Database status.
    * 
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    status() {
        return this._get("meta", null, null, null, "status");
    }

}