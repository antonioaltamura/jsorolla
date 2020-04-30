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
 * Autogenerated on: 2020-04-30 10:56:34
 * 
 * Manual changes to this file may cause unexpected behavior in your application.
 * Manual changes to this file will be overwritten if the code is regenerated. 
 *
**/

import OpenCGAParentClass from "./../opencga-parent-class.js";


/**
 * This class contains the methods for the "Alignment" resource
 */

export default class Alignment extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    /** BWA is a software package for mapping low-divergent sequences against a large reference genome.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - study.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An id will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job ids the job will depend on.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runBwa(params) {
        return this._post("analysis/alignment", null, "bwa", null, "run", params);
    }

    /** Query the coverage of an alignment file for regions or genes
    * @param {String} file - File ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.region] - Comma separated list of regions 'chr:start-end, e.g.: 2,3:63500-65000.
    * @param {String} [params.gene] - Comma separated list of genes, e.g.: BCRA2,TP53.
    * @param {Number} [params.offset] - Offset to extend the region, gene or exon at up and downstream.
    * @param {Boolean} [params.onlyExons] - Only exons are taking into account when genes are specified.
    * @param {String} [params.range] - Range of coverage values to be reported. Minimum and maximum values are separated by '-', e.g.: 20-40
    *     (for coverage values greater or equal to 20 and less or equal to 40). A single value means to report coverage values less or equal to
    *     that value.
    * @param {Number} [params.windowSize] - Window size for the region coverage (if a coverage range is provided, window size must be 1).
    * @param {Boolean} [params.splitResults] - Split results into regions (or gene/exon regions).
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    queryCoverage(file, params) {
        return this._get("analysis/alignment", null, "coverage", null, "query", {file, ...params});
    }

    /** Compute coverage ratio from file #1 vs file #2, (e.g. somatic vs germline)
    * @param {String} file1 - Input file #1 (e.g. somatic file).
    * @param {String} file2 - Input file #2 (e.g. germline file).
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {Boolean} [params.skipLog2] - Do not apply Log2 to normalise the coverage ratio.
    * @param {String} [params.region] - Comma separated list of regions 'chr:start-end, e.g.: 2,3:63500-65000.
    * @param {String} [params.gene] - Comma separated list of genes, e.g.: BCRA2,TP53.
    * @param {Number} [params.offset] - Offset to extend the region, gene or exon at up and downstream.
    * @param {Boolean} [params.onlyExons] - Only exons are taking into account when genes are specified.
    * @param {Number} [params.windowSize] - Window size for the region coverage (if a coverage range is provided, window size must be 1).
    * @param {Boolean} [params.splitResults] - Split results into regions (or gene/exon regions).
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    ratioCoverage(file1, file2, params) {
        return this._get("analysis/alignment", null, "coverage", null, "ratio", {file1, file2, ...params});
    }

    /** Compute coverage for a list of alignment files
    * @param {String} file - File ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {Number} [params.windowSize] - Window size for the region coverage (if a coverage range is provided, window size must be 1).
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runCoverage(file, params) {
        return this._post("analysis/alignment", null, "coverage", null, "run", {file, ...params});
    }

    /** Deeptools is a suite of python tools particularly developed for the efficient analysis of high-throughput sequencing data, such as
    * ChIP-seq, RNA-seq or MNase-seq.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - study.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An id will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job ids the job will depend on.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runDeeptools(params) {
        return this._post("analysis/alignment", null, "deeptools", null, "run", params);
    }

    /** A quality control tool for high throughput sequence data.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - study.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An id will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job ids the job will depend on.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runFastqc(params) {
        return this._post("analysis/alignment", null, "fastqc", null, "run", params);
    }

    /** Index alignment file
    * @param {String} file - File ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    index(file, params) {
        return this._post("analysis/alignment", null, null, null, "index", {file, ...params});
    }

    /** Search over indexed alignments
    * @param {String} file - File ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @param {Boolean} [params.count = "false"] - Get the total number of results matching the query. Deactivated by default. The default
    *     value is false.
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.region] - Comma separated list of regions 'chr:start-end, e.g.: 2,3:63500-65000.
    * @param {String} [params.gene] - Comma separated list of genes, e.g.: BCRA2,TP53.
    * @param {Number} [params.offset] - Offset to extend the region, gene or exon at up and downstream.
    * @param {Boolean} [params.onlyExons] - Only exons are taking into account when genes are specified.
    * @param {Number} [params.minMappingQuality] - Minimum mapping quality.
    * @param {Number} [params.maxNumMismatches] - Maximum number of mismatches.
    * @param {Number} [params.maxNumHits] - Maximum number of hits.
    * @param {Boolean} [params.properlyPaired] - Return only properly paired alignments.
    * @param {Number} [params.maxInsertSize] - Maximum insert size.
    * @param {Boolean} [params.skipUnmapped] - Skip unmapped alignments.
    * @param {Boolean} [params.skipDuplicated] - Skip duplicated alignments.
    * @param {Boolean} [params.regionContained] - Return alignments contained within boundaries of region.
    * @param {Boolean} [params.forceMDField] - Force SAM MD optional field to be set with the alignments.
    * @param {Boolean} [params.binQualities] - Compress the nucleotide qualities by using 8 quality levels.
    * @param {Boolean} [params.splitResults] - Split results into regions (or gene/exon regions).
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    query(file, params) {
        return this._get("analysis/alignment", null, null, null, "query", {file, ...params});
    }

    /** Samtools is a program for interacting with high-throughput sequencing data in SAM, BAM and CRAM formats.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - study.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An id will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job ids the job will depend on.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runSamtools(params) {
        return this._post("analysis/alignment", null, "samtools", null, "run", params);
    }

    /** Show the stats for a given alignment file
    * @param {String} file - File ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    infoStats(file, params) {
        return this._get("analysis/alignment", null, "stats", null, "info", {file, ...params});
    }

    /** Fetch alignment files according to their stats
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.rawTotalSequences] - Raw total sequences: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.filteredSequences] - Filtered sequences: [<|>|<=|>=]{number}, e.g. <=500.
    * @param {String} [params.readsMapped] - Reads mapped: [<|>|<=|>=]{number}, e.g. >3000.
    * @param {String} [params.readsMappedAndPaired] - Reads mapped and paired: paired-end technology bit set + both mates mapped:
    *     [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.readsUnmapped] - Reads unmapped: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.readsProperlyPaired] - Reads properly paired (proper-pair bit set: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.readsPaired] - Reads paired: paired-end technology bit set: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.readsDuplicated] - Reads duplicated: PCR or optical duplicate bit set: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.readsMQ0] - Reads mapped and MQ = 0: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.readsQCFailed] - Reads QC failed: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.nonPrimaryAlignments] - Non-primary alignments: [<|>|<=|>=]{number}, e.g. <=100.
    * @param {String} [params.mismatches] - Mismatches from NM fields: [<|>|<=|>=]{number}, e.g. <=100.
    * @param {String} [params.errorRate] - Error rate: mismatches / bases mapped (cigar): [<|>|<=|>=]{number}, e.g. <=0.002.
    * @param {String} [params.averageLength] - Average_length: [<|>|<=|>=]{number}, e.g. >=90.0.
    * @param {String} [params.averageFirstFragmentLength] - Average first fragment length: [<|>|<=|>=]{number}, e.g. >=90.0.
    * @param {String} [params.averageLastFragmentLength] - Average_last_fragment_length: [<|>|<=|>=]{number}, e.g. >=90.0.
    * @param {String} [params.averageQuality] - Average quality: [<|>|<=|>=]{number}, e.g. >=35.5.
    * @param {String} [params.insertSizeAverage] - Insert size average: [<|>|<=|>=]{number}, e.g. >=100.0.
    * @param {String} [params.insertSizeStandardDeviation] - Insert size standard deviation: [<|>|<=|>=]{number}, e.g. <=1.5.
    * @param {String} [params.pairsWithOtherOrientation] - Pairs with other orientation: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.pairsOnDifferentChromosomes] - Pairs on different chromosomes: [<|>|<=|>=]{number}, e.g. >=1000.
    * @param {String} [params.percentageOfProperlyPairedReads] - Percentage of properly paired reads: [<|>|<=|>=]{number}, e.g. >=96.5.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    queryStats(params) {
        return this._get("analysis/alignment", null, "stats", null, "query", params);
    }

    /** Compute stats for a given alignment file
    * @param {String} file - File ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runStats(file, params) {
        return this._post("analysis/alignment", null, "stats", null, "run", {file, ...params});
    }

}