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

import BioinfoUtils from "../../core/bioinfo/bioinfo-utils.js";


export default class VariantGridFormatter {

    // DEPRECATED: use new consequenceTypes.impact instead
    static assignColors(consequenceTypes, proteinSubstitutionScores) {
        let result = {};
        if (consequenceTypes) {
            const consequenceTypeToColor = {};
            const consequenceTypeToImpact = {};
            for (const category of consequenceTypes.categories) {
                if (category.terms) {
                    for (const term of category.terms) {
                        consequenceTypeToColor[term.name] = consequenceTypes.style[term.impact];
                        consequenceTypeToImpact[term.name] = term.impact;
                    }
                } else {
                    if (category.id && category.name) {
                        consequenceTypeToColor[category.name] = consequenceTypes[category.impact];
                        consequenceTypeToImpact[category.name] = category.impact;
                    }
                }
            }
            result = {
                consequenceTypeToColor: consequenceTypeToColor,
                consequenceTypeToImpact: consequenceTypeToImpact
            };
        }

        if (proteinSubstitutionScores) {
            const pssColor = new Map();
            for (const i in proteinSubstitutionScores) {
                if (Object.prototype.hasOwnProperty.call(proteinSubstitutionScores, i)) {

                    const obj = proteinSubstitutionScores[i];
                    Object.keys(obj).forEach(key => {
                        pssColor.set(key, obj[key]);
                    });
                }
            }
            result.pssColor = pssColor;
        }
        return result;
    }

    static variantFormatter(value, row, index, assembly, config) {
        if (!row) {
            return;
        }

        let ref = row.reference ? row.reference : "-";
        let alt = row.alternate ? row.alternate : "-";

        // Check size
        const maxAlleleLength = config?.alleleStringLengthMax ? config.alleleStringLengthMax : 20;
        ref = (ref.length > maxAlleleLength) ? ref.substring(0, 4) + "..." + ref.substring(ref.length - 4) : ref;
        alt = (alt.length > maxAlleleLength) ? alt.substring(0, 4) + "..." + alt.substring(alt.length - 4) : alt;

        // Ww need to escape < and > symbols from <INS>, <DEL>, ...
        alt = alt.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

        // Create links for tooltip
        const variantRegion = row.chromosome + ":" + row.start + "-" + row.end;
        const tooltipText = `
            <div class="dropdown-header" style="padding-left: 5px">External Links</div>
            <div style="padding: 5px">
                <a target="_blank" href="${BioinfoUtils.getVariantLink(row.id, variantRegion, "ensembl_genome_browser", assembly)}">
                    Ensembl Genome Browser
                </a>
            </div>
            <div style="padding: 5px">
                <a target="_blank" href="${BioinfoUtils.getVariantLink(row.id, variantRegion, "ucsc_genome_browser")}">
                    UCSC Genome Browser
                </a>
            </div>
        `;

        const snpHtml = VariantGridFormatter.snpFormatter(value, row, index, assembly);

        // Add highlight icons
        let iconHighlights = [];
        if (config.highlights && config.activeHighlights) {
            iconHighlights = config.activeHighlights.map(id => {
                const highlight = config.highlights.find(item => item.id === id);
                if (highlight.condition(row, index) && highlight.style?.icon) {
                    const description = highlight.description || highlight.name || "";
                    const icon = highlight.style.icon;
                    const color = highlight.style.iconColor || "";

                    return `<i title="${description}" class="fas fa-${icon}" style="color:${color};margin-left:4px;"></i>`;
                }
            });
        }

        return `
            <div style="margin:5px 0px;white-space:nowrap;">
                <a tooltip-title='Links' tooltip-text='${tooltipText}'>
                    ${row.chromosome}:${row.start}&nbsp;&nbsp;${ref}/${alt}
                </a>
                ${iconHighlights.join("")}
            </div>
            ${snpHtml ? `<div style="margin: 5px 0px">${snpHtml}</div>` : ""}
        `;
    }

    static snpFormatter(value, row, index, assembly) {
        // We try first to read SNP ID from the 'names' of the variant (this identifier comes from the file).
        // If this ID is not a "rs..." then we search the rs in the CellBase XRef annotations.
        // This field is in annotation.xref when source: "dbSNP".
        let snpId = "";
        if (row.names && row.names.length > 0) {
            for (const name of row.names) {
                if (name.startsWith("rs")) {
                    snpId = name;
                    break;
                }
            }
        } else {
            if (row.annotation) {
                if (row.annotation.id && row.annotation.id.startsWith("rs")) {
                    snpId = row.annotation.id;
                } else {
                    if (row.annotation.xrefs) {
                        for (const xref of row.annotation.xrefs) {
                            if (xref.source === "dbSNP") {
                                snpId = xref.id;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (snpId) {
            if (assembly.toUpperCase() === "GRCH37") {
                return "<a target='_blank' href='http://grch37.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=" + snpId + "'>" + snpId + "</a>";
            } else {
                return "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=" + snpId + "'>" + snpId + "</a>";
            }
        }
        return snpId;
    }

    static geneFormatter(variant, index, query, opencgaSession, gridCtSettings) {
        // debugger
        // FIXME
        if (!variant.annotation) {
            variant.annotation = {
                consequenceTypes: []
            };
        }
        const {selectedConsequenceTypes, notSelectedConsequenceTypes} =
            VariantGridFormatter._consequenceTypeDetailFormatterFilter(variant.annotation.consequenceTypes, gridCtSettings);

        // Keep a map of genes and the SO accessions and names
        const geneHasQueryCt = new Set();
        if (query?.ct) {
            const consequenceTypes = new Set();
            for (const ct of query.ct.split(",")) {
                consequenceTypes.add(ct);
            }

            for (const ct of selectedConsequenceTypes) {
                if (ct.sequenceOntologyTerms.some(so => consequenceTypes.has(so.name))) {
                    geneHasQueryCt.add(ct.geneName);
                }
            }
        }

        if (variant?.annotation?.consequenceTypes?.length > 0) {
            const visited = {};
            const geneLinks = [];
            const geneWithCtLinks = [];
            for (let i = 0; i < variant.annotation.consequenceTypes.length; i++) {
                const geneName = variant.annotation.consequenceTypes[i].geneName;

                // We process Genes just one time
                if (geneName && !visited[geneName]) {
                    let geneViewMenuLink = "";
                    if (opencgaSession.project && opencgaSession.study) {
                        geneViewMenuLink = `<div style='padding: 5px'>
                                                <a style='cursor: pointer' href='#gene/${opencgaSession.project.id}/${opencgaSession.study.id}/${geneName}' data-cy='gene-view'>Gene View</a>
                                            </div>`;
                    }

                    const tooltipText = `
                        ${geneViewMenuLink}

                        <div class='dropdown-header' style='padding-left: 5px;padding-top: 5px; font-weight: bold;
    border-top: 1px solid #d9d9d9;'>External Links</div>
                        <div style='padding: 5px'>
                             <a target='_blank' href='${BioinfoUtils.getEnsemblLink(geneName, "gene", opencgaSession?.project?.organism?.assembly)}'>Ensembl</a>
                        </div>
                        <div style='padding: 5px'>
                             <a target='_blank' href='${BioinfoUtils.getGeneLink(geneName, "lrg")}'>LRG</a>
                        </div>
                        <div style='padding: 5px'>
                             <a target='_blank' href='${BioinfoUtils.getUniprotLink(geneName)}'>UniProt</a>
                        </div>

                        <div class='dropdown-header' style='padding-left: 5px;padding-top: 5px; font-weight: bold;
    border-top: 1px solid #d9d9d9;'>Clinical Resources</div>
                        <div style='padding: 5px'>
                             <a target='_blank' href='${BioinfoUtils.getGeneLink(geneName, "decipher")}'>Decipher</a>
                        </div>
                        <div style='padding: 5px'>
                             <a target='_blank' href='${BioinfoUtils.getGeneLink(geneName, "cosmic", opencgaSession.project.organism.assembly)}'>COSMIC</a>
                        </div>
                        <div style='padding: 5px'>
                             <a target='_blank' href='${BioinfoUtils.getGeneLink(geneName, "omim")}'>OMIM</a>
                        </div>
                    `;

                    // If query.ct exists
                    if (query?.ct) {
                        // If gene contains one of the query.ct
                        if (geneHasQueryCt.has(geneName)) {
                            geneWithCtLinks.push(`<a class="gene-tooltip" tooltip-title="Links" tooltip-text="${tooltipText}" style="margin-left: 2px;">
                                                        ${geneName}
                                                  </a>`);
                        } else {
                            geneLinks.push(`<a class="gene-tooltip" tooltip-title="Links" tooltip-text="${tooltipText}" style="margin-left: 2px;color: darkgray;font-style: italic">
                                                    ${geneName}
                                            </a>`);
                        }
                    } else {
                        // No query.ct passed
                        geneLinks.push(`<a class="gene-tooltip" tooltip-title="Links" tooltip-text="${tooltipText}" style="margin-left: 2px">
                                                ${geneName}
                                        </a>`);
                    }
                    visited[geneName] = true;
                }
            }

            // Do not write more than 4 genes per line, this could be easily configurable
            let resultHtml = "";
            const maxDisplayedGenes = 10;
            const allGenes = geneWithCtLinks.concat(geneLinks);

            if (allGenes.length <= maxDisplayedGenes) {
                resultHtml = allGenes.join(",");
            } else {
                resultHtml = `
                    <div data-role="genes-list" data-variant-index="${index}">
                        ${allGenes.slice(0, maxDisplayedGenes).join(",")}
                        <span data-role="genes-list-extra" style="display:none">
                            ,${allGenes.slice(maxDisplayedGenes).join(",")}
                        </span>
                        <div style="margin-top:8px;">
                            <a data-role="genes-list-show" style="cursor:pointer;font-size:13px;font-weight:bold;display:block;">
                                ... show more genes (${(allGenes.length - maxDisplayedGenes)})
                            </a>
                            <a data-role="genes-list-hide" style="cursor:pointer;font-size:13px;font-weight:bold;display:none;">
                                show less genes
                            </a>
                        </div>
                    </div>
                `;
            }

            // First, print Genes with query CT
            // if (query?.ct) {
            //     for (let i = 0; i < geneWithCtLinks.length; i++) {
            //         resultHtml += geneWithCtLinks[i];
            //         if (i + 1 !== geneWithCtLinks.length) {
            //             resultHtml += ",";
            //         }
            //         genesCount++;
            //     }
            //     resultHtml += "<br>";
            // }

            // // Second, the other genes
            // for (let i = 0; i < geneLinks.length && genesCount < 10; i++) {
            //     resultHtml += geneLinks[i];
            //     if (i + 1 !== geneLinks.length) {
            //         if (i === 0) {
            //             resultHtml += ",";
            //         } else if ((i + 1) % 2 !== 0) {
            //             resultHtml += ",";
            //         } else {
            //             resultHtml += "<br>";
            //         }
            //     }
            //     genesCount++;
            // }
            return resultHtml;

        } else {
            return "-";
        }
    }

    static hgvsFormatter(variant, gridConfig) {
        BioinfoUtils.sort(variant.annotation?.consequenceTypes, v => v.geneName);
        const showArrayIndexes = VariantGridFormatter._consequenceTypeDetailFormatterFilter(variant.annotation?.consequenceTypes, gridConfig).indexes;

        if (showArrayIndexes?.length > 0 && variant.annotation.hgvs?.length > 0) {
            const results = [];
            for (const index of showArrayIndexes) {
                const consequenceType = variant.annotation.consequenceTypes[index];
                const hgvsTranscriptIndex = variant.annotation.hgvs.findIndex(hgvs => hgvs.startsWith(consequenceType.transcriptId));
                const hgvsProteingIndex = variant.annotation.hgvs.findIndex(hgvs => hgvs.startsWith(consequenceType.proteinVariantAnnotation?.proteinId));
                if (hgvsTranscriptIndex > -1 || hgvsProteingIndex > -1) {
                    results.push(`
                        <div style="margin: 5px 0">
                            ${VariantGridFormatter.getHgvsLink(consequenceType.transcriptId, variant.annotation.hgvs) || "-"}
                        </div>
                        <div style="margin: 5px 0">
                            ${VariantGridFormatter.getHgvsLink(consequenceType.proteinVariantAnnotation?.proteinId, variant.annotation.hgvs) || "-"}
                        </div>
                    `);
                }
            }
            return results.join("<hr style='margin: 5px'>");
        }
    }

    static vcfFormatter(value, row, field, type = "INFO") {
        if (type.toUpperCase() === "INFO") {
            return row.studies[0].files[0].data[field];
        } else {
            const index = row.studies[0].sampleDataKeys.findIndex(f => f === field);
            return row.studies[0].samples[0].data[index];
        }
    }

    static typeFormatter(value, row) {
        if (row) {
            let type = row.type;
            let color = "";
            switch (row.type) {
                case "SNP": // Deprecated
                    type = "SNV";
                    break;
                case "INDEL":
                case "CNV": // Deprecated
                case "COPY_NUMBER":
                case "COPY_NUMBER_GAIN":
                case "COPY_NUMBER_LOSS":
                case "MNV":
                    color = "darkorange";
                    break;
                case "SV":
                case "INSERTION":
                case "DELETION":
                case "DUPLICATION":
                case "TANDEM_DUPLICATION":
                case "BREAKEND":
                    color = "red";
                    break;
                default:
                    color = "black";
                    break;
            }
            return `<span style="color: ${color}">${type}</span>`;
        } else {
            return "-";
        }
    }

    static consequenceTypeFormatter(value, row, ctQuery, gridCtSettings) {
        if (row?.annotation && row.annotation.consequenceTypes?.length > 0) {
            let {selectedConsequenceTypes, notSelectedConsequenceTypes, indexes} =
                VariantGridFormatter._consequenceTypeDetailFormatterFilter(row.annotation.consequenceTypes, gridCtSettings);

            // If CT is passed in the query then we must make and AND with the selected transcript by the user.
            // This means that only the selectedConsequenceTypes that ARE ALSO IN THE CT QUERY are displayed.
            if (ctQuery) {
                const consequenceTypes = new Set();
                for (const ct of ctQuery.split(",")) {
                    consequenceTypes.add(ct);
                }

                const newSelectedConsequenceTypes = [];
                for (const ct of selectedConsequenceTypes) {
                    if (ct.sequenceOntologyTerms.some(so => consequenceTypes.has(so.name))) {
                        newSelectedConsequenceTypes.push(ct);
                    } else {
                        notSelectedConsequenceTypes.push(ct);
                    }
                }
                selectedConsequenceTypes = newSelectedConsequenceTypes;
            }

            const positiveConsequenceTypes = [];
            const negativeConsequenceTypes = [];
            const soVisited = new Set();
            for (const ct of selectedConsequenceTypes) {
                for (const so of ct.sequenceOntologyTerms) {
                    if (!soVisited.has(so?.name)) {
                        positiveConsequenceTypes.push(`<span style="color: ${CONSEQUENCE_TYPES.style[CONSEQUENCE_TYPES.impact[so.name]] || "black"}">${so.name}</span>`);
                        soVisited.add(so.name);
                    }
                }
            }

            // Print negative SO, if not printed as positive
            let negativeConsequenceTypesText = "";
            if (gridCtSettings.consequenceType.showNegativeConsequenceTypes) {
                for (const ct of notSelectedConsequenceTypes) {
                    for (const so of ct.sequenceOntologyTerms) {
                        if (!soVisited.has(so.name)) {
                            negativeConsequenceTypes.push(`<div style="color: ${CONSEQUENCE_TYPES.style[CONSEQUENCE_TYPES.impact[so.name]] || "black"}; margin: 5px">${so.name}</div>`);
                            soVisited.add(so.name);
                        }
                    }
                }

                if (negativeConsequenceTypes.length > 0) {
                    negativeConsequenceTypesText = `<a tooltip-title="Terms Filtered" tooltip-text='${negativeConsequenceTypes.join("")}'>
                                                        <span style="color: darkgray;font-style: italic">${negativeConsequenceTypes.length} terms filtered</span>
                                                    </a>`;
                }
            }

            return `
                <div>
                    ${positiveConsequenceTypes.join("<br>")}
                </div>
                <div>
                    ${negativeConsequenceTypesText}
                </div>`;
        }
        return "-";
    }

    /* Usage:
        columns: [
            {
                title: "", classes: "", style: "",
                columns: [      // nested column
                    {
                        title: "", classes: "", style: ""
                    }
                ]
            }
        ]

        rows: [
            {values: ["", ""], classes: "", style: ""}
        ]
     */
    static renderTable(id, columns, rows, config) {
        if (!rows || rows.length === 0) {
            return `<span>${config?.defaultMessage ? config.defaultMessage : "No data found"}</span>`;
        }

        let tr = "";
        const nestedColumnIndex = columns.findIndex(col => col.columns?.length > 0);
        if (nestedColumnIndex > -1) {
            let thTop = "";
            let thBottom = "";
            for (const column of columns) {
                if (column.columns?.length > 0) {
                    thTop += `<th rowspan="1" colspan="${column.columns.length}" class="${column.classes ?? ""}" style="text-align: center; ${column.style ?? ""}">${column.title}</th>`;
                    for (const bottomColumn of column.columns) {
                        thBottom += `<th rowspan="1">${bottomColumn.title}</th>`;
                    }
                } else {
                    thTop += `<th rowspan="2" class="${column.classes ?? ""}" style="${column.style ?? ""}">${column.title}</th>`;
                }
            }
            tr += `<tr>${thTop}</tr>`;
            tr += `<tr>${thBottom}</tr>`;
        } else {
            const th = columns.map(column => `<th>${column.title}</th>`).join("");
            tr = `<tr>${th}</tr>`;
        }

        let html = `<table id="${id ? id : null}" class="table ${config?.classes ? config.classes : "table-hover table-no-bordered"}">
                        <thead>
                            ${tr}
                        </thead>
                        <tbody>`;
        // Render rows
        for (const row of rows) {
            let td = "";
            for (const value of row.values) {
                td += `<td>${value}</td>`;
            }
            html += `<tr class="${row.classes ?? ""}" style="${row.style ?? ""}">${td}</tr>`;
        }
        html += "</tbody></table>";

        return html;
    }

    static _consequenceTypeDetailFormatterFilter(cts, filter) {
        const selectedConsequenceTypes = [];
        const notSelectedConsequenceTypes = [];
        const showArrayIndexes = [];

        const geneSet = filter?.geneSet ? filter.geneSet : {};
        for (let i = 0; i < cts.length; i++) {
            const ct = cts[i];

            // Check if gene source is valid
            let isSourceValid = false;
            if (geneSet["ensembl"] && (!ct.source || ct.source.toUpperCase() === "ENSEMBL")) { // FIXME: Ensembl regulatory CT do not have 'source'
                isSourceValid = true;
            } else {
                if (geneSet["refseq"] && ct.source?.toUpperCase() === "REFSEQ") {
                    isSourceValid = true;
                }
            }
            if (!isSourceValid) {
                // Not a valid source, let's continue to next ct
                continue;
            }

            // TODO Remove in IVA 2.3
            // To keep compatability with CellBase 4
            const transcriptFlags = ct.transcriptFlags ?? ct.transcriptAnnotationFlags;
            let isCtSelected = filter.consequenceType?.all || false;
            if (filter && isCtSelected === false) {
                if (filter.consequenceType.maneTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("MANE Select")|| transcriptFlags?.includes("MANE Plus Clinical");
                }
                if (filter.consequenceType.ensemblCanonicalTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("canonical");
                }
                if (filter.consequenceType.gencodeBasicTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("basic");
                }
                if (filter.consequenceType.ccdsTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("CCDS");
                }
                if (filter.consequenceType.lrgTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("LRG");
                }
                if (filter.consequenceType.ensemblTslTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("TSL:1");
                }
                if (filter.consequenceType.illuminaTSO500Transcript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("TSO500");
                }
                if (filter.consequenceType.eglhHaemoncTranscript) {
                    isCtSelected = isCtSelected || transcriptFlags?.includes("EGLH_HaemOnc");
                }
                if (filter.consequenceType.proteinCodingTranscript && ct.biotype === "protein_coding") {
                    isCtSelected = isCtSelected || ct.biotype === "protein_coding";
                }
                if (filter.consequenceType.highImpactConsequenceTypeTranscript) {
                    for (const so of ct.sequenceOntologyTerms) {
                        const impact = CONSEQUENCE_TYPES?.impact[so.name]?.toUpperCase();
                        isCtSelected = isCtSelected || impact === "HIGH" || impact === "MODERATE";
                    }
                }
            }
            // Check if the CT satisfy any condition
            if (isCtSelected) {
                showArrayIndexes.push(i);
                selectedConsequenceTypes.push(ct);
            } else {
                notSelectedConsequenceTypes.push(ct);
            }
        }
        return {
            selectedConsequenceTypes: selectedConsequenceTypes,
            notSelectedConsequenceTypes: notSelectedConsequenceTypes,
            indexes: showArrayIndexes
        };
    }

    static getHgvsLink(id, hgvsArray) {
        if (!id) {
            return;
        }

        let hgvs = hgvsArray?.find(hgvs => hgvs.startsWith(id));
        if (hgvs) {
            if (hgvs.includes("(")) {
                const split = hgvs.split(new RegExp("[()]"));
                hgvs = split[0] + split[2];
            }

            const split = hgvs.split(":");
            let link;
            if (hgvs.includes(":c.")) {
                link = BioinfoUtils.getTranscriptLink(split[0]);
            }
            if (hgvs.includes(":p.")) {
                link = BioinfoUtils.getProteinLink(split[0]);
            }

            return `<a href=${link} target="_blank">${split[0]}</a>:<span style="font-weight:bold">${split[1]}</span>`;
        } else {
            if (id.startsWith("ENST") || id.startsWith("NM_") || id.startsWith("NR_")) {
                return `<a href=${BioinfoUtils.getTranscriptLink(id)} target="_blank">${id}</a>`;
            } else {
                return `<a href=${BioinfoUtils.getProteinLink(id)} target="_blank">${id}</a>`;
            }
        }
    }

    static toggleDetailConsequenceType(e) {
        const id = e.target.dataset.id;
        const elements = document.getElementsByClassName(this._prefix + id + "Filtered");
        for (const element of elements) {
            if (element.style.display === "none") {
                element.style.display = "";
            } else {
                element.style.display = "none";
            }
        }
    }

    static consequenceTypeDetailFormatter(value, row, variantGrid, query, filter, assembly) {
        if (row?.annotation?.consequenceTypes && row.annotation.consequenceTypes.length > 0) {
            // Sort and group CTs by Gene name
            BioinfoUtils.sort(row.annotation.consequenceTypes, v => v.geneName);

            const showArrayIndexes = VariantGridFormatter._consequenceTypeDetailFormatterFilter(row.annotation.consequenceTypes, filter).indexes;
            let message = "";
            if (filter) {
                // Create two different divs to 'show all' or 'apply filter' title
                message = `<div class="${variantGrid._prefix}${row.id}Filtered">
                                Showing <span style="font-weight: bold; color: red">${showArrayIndexes.length}</span> of
                                <span style="font-weight: bold; color: red">${row.annotation.consequenceTypes.length}</span> consequence types,
                                <a id="${variantGrid._prefix}${row.id}ShowCt" data-id="${row.id}" style="cursor: pointer">show all...</a>
                            </div>
                            <div class="${variantGrid._prefix}${row.id}Filtered" style="display: none">
                                Showing <span style="font-weight: bold; color: red">${row.annotation.consequenceTypes.length}</span> of
                                <span style="font-weight: bold; color: red">${row.annotation.consequenceTypes.length}</span> consequence types,
                                <a id="${variantGrid._prefix}${row.id}HideCt" data-id="${row.id}" style="cursor: pointer">apply filters...</a>
                            </div>
                            `;
            }

            let ctHtml = `<div style="padding-bottom: 5px">
                              ${message}
                          </div>
                          <table id="ConsqTypeTable" class="table table-hover table-no-bordered">
                              <thead>
                                  <tr>
                                      <th rowspan="2">Gene</th>
                                      <th rowspan="2">Transcript</th>
                                      <th rowspan="2">Consequence Type</th>
                                      <th rowspan="2">Transcript Flags</th>
                                      <th rowspan="1" colspan="3" style="text-align: center; padding-top: 5px; padding-right: 2px">Transcript Variant Annotation</th>
                                      <th rowspan="1" colspan="4" style="text-align: center; padding-top: 5px">Protein Variant Annotation</th>
                                  </tr>
                                  <tr style="margin: 5px">
                                      <th rowspan="1" style="padding-top: 5px">cDNA / CDS</th>
                                      <th rowspan="1">Codon</th>
                                      <th rowspan="1" style="padding-right: 20px">Exon (%)</th>
                                      <th rowspan="1">UniProt Acc</th>
                                      <th rowspan="1">Position</th>
                                      <th rowspan="1">Ref/Alt</th>
                                      <th rowspan="1">Domains</th>
                                  </tr>
                              </thead>
                              <tbody>`;

            for (let i = 0; i < row.annotation.consequenceTypes.length; i++) {
                const ct = row.annotation.consequenceTypes[i];

                // Keep backward compatibility with old ensemblGeneId and ensemblTranscriptId
                const source = ct.source || "ensembl";
                const geneId = ct.geneId || ct.ensemblGeneId;
                const transcriptId = ct.transcriptId || ct.ensemblTranscriptId;
                const geneIdLink = `${BioinfoUtils.getGeneLink(geneId, source, assembly)}`;
                const ensemblTranscriptIdLink = `${BioinfoUtils.getTranscriptLink(transcriptId, source, assembly)}`;

                // Prepare data info for columns
                const geneName = ct.geneName ? `<a href="${BioinfoUtils.getGeneNameLink(ct.geneName)}" target="_blank">${ct.geneName}</a>` : "-";

                const geneIdLinkHtml = geneId ? `<a href="${geneIdLink}" target="_blank">${geneId}</a>` : "";
                const geneHtml = `
                    <div>${geneName}</div>
                    <div style="margin: 5px 0px">${geneIdLinkHtml}</div>
                `;

                const transcriptIdHtml = `
                    <div>
                        <span>${ct.biotype ? ct.biotype : "-"}</span>
                    </div>
                    <div style="margin: 5px 0px">
                        <span>
                            ${transcriptId ? `
                                <div style="margin: 5px 0px">
                                    ${VariantGridFormatter.getHgvsLink(transcriptId, row.annotation.hgvs) || ""}
                                </div>
                                <div style="margin: 5px 0px">
                                    ${VariantGridFormatter.getHgvsLink(ct?.proteinVariantAnnotation?.proteinId, row.annotation.hgvs) || ""}
                                </div>` : ""
                }
                        </span>
                    </div>`;

                const soArray = [];
                for (const so of ct.sequenceOntologyTerms) {
                    const color = CONSEQUENCE_TYPES.style[CONSEQUENCE_TYPES.impact[so.name]] || "black";
                    soArray.push(`<div style="color: ${color}; margin-bottom: 5px">
                                    <span style="padding-right: 5px">${so.name}</span>
                                    <a title="Go to Sequence Ontology ${so.accession} term"
                                            href="https://www.sequenceontology.org/browser/current_svn/term/${so.accession}" target="_blank">
                                        <i class="fas fa-external-link-alt"></i>
                                    </a>
                                  </div>`);
                }

                let transcriptFlags = ["-"];
                if (transcriptId && (ct.transcriptFlags?.length > 0 || ct.transcriptAnnotationFlags?.length > 0)) {
                    transcriptFlags = ct.transcriptFlags ?
                        ct.transcriptFlags.map(flag => `<div style="margin-bottom: 5px">${flag}</div>`) :
                        ct.transcriptAnnotationFlags.map(flag => `<div style="margin-bottom: 5px">${flag}</div>`);
                }

                let exons = ["-"];
                if (ct.exonOverlap && ct.exonOverlap.length > 0) {
                    exons = ct.exonOverlap.map(exon => `
                        <div>
                            <span>${exon.number}</span>
                        </div>
                        ${exon?.percentage ? `
                            <div>
                                <span class="help-block" style="margin: 2px 0px">${exon?.percentage.toFixed(2) ?? "-"}%</span>
                            </div>` :
                        ""}
                    `);
                }

                const pva = ct.proteinVariantAnnotation ? ct.proteinVariantAnnotation : {};
                let uniprotAccession = "-";
                if (pva.uniprotAccession) {
                    uniprotAccession = `
                        <div style="margin: 5px 0px">
                            <span><a href="${BioinfoUtils.getUniprotLink(pva.uniprotAccession)}" target="_blank">${pva.uniprotAccession}</a></span>
                        </div>
                        ${pva.uniprotVariantId ? `
                            <div>
                                <span class="help-block" style="margin: 0px">${pva.uniprotVariantId}</span>
                            </div>` :
                        ""}
                    `;
                }

                let domains = `<a class="ct-protein-domain-tooltip" tooltip-title='Info' tooltip-text='No protein domains found' tooltip-position-at="left bottom" tooltip-position-my="right top">
                                    <i class='fa fa-times' style='color: gray'></i>
                               </a>`;
                if (pva.features) {
                    let tooltipText = "";
                    const visited = new Set();
                    for (const feature of pva.features) {
                        if (feature.id && !visited.has(feature.id)) {
                            visited.add(feature.id);
                            tooltipText += `
                                <div>
                                    <span style="font-weight: bold; margin: 5px">${feature.id}</span><span class="help-block" style="margin: 5px">${feature.description}</span>
                                </div>
                            `;
                        }
                    }
                    domains = `<a class="ct-protein-domain-tooltip" tooltip-title='Links' tooltip-text='${tooltipText}' tooltip-position-at="left bottom" tooltip-position-my="right top">
                                    <i class='fa fa-check' style='color: green'></i>
                               </a>`;
                }

                // Create the table row
                const hideClass = showArrayIndexes.includes(i) ? "" : `${variantGrid._prefix}${row.id}Filtered`;
                const displayStyle = showArrayIndexes.includes(i) ? "" : "display: none";
                ctHtml += `<tr class="detail-view-row ${hideClass}" style="${displayStyle}">
                                <td>${geneHtml}</td>
                                <td>${transcriptIdHtml}</td>
                                <td>${soArray.join("")}</td>
                                <td>${transcriptFlags.join("")}</td>

                                <td>${ct.cdnaPosition || "-"} / ${ct.cdsPosition || "-"}</td>
                                <td>${ct.codon || "-"}</td>
                                <td>${exons.join("<br>")}</td>

                                <td>${uniprotAccession}</td>
                                <td>${pva.position !== undefined ? pva.position : "-"}</td>
                                <td>${pva.reference !== undefined ? pva.reference + "/" + pva.alternate : "-"}</td>
                                <td>${domains}</td>
                           </tr>`;
            }
            ctHtml += "</tbody></table>";
            return ctHtml;
        }
        return "-";
    }

    static populationFrequenciesInfoTooltipContent(populationFrequencies) {
        return `One coloured square is shown for each population. Frequencies are coded with colours which classify values
                into 'very rare', 'rare', 'average', 'common' or 'missing', see
                <a href='https://www.nature.com/scitable/topicpage/multifactorial-inheritance-and-genetic-disease-919' target='_blank'>
                    https://www.nature.com/scitable/topicpage/multifactorial-inheritance-and-genetic-disease-919
                </a>. Please, leave the cursor over each square to display the actual frequency values. <br>
                <span style='font-weight: bold'>Note that that all frequencies are percentages.</span>
                <div style='padding: 10px 0px 0px 0px'><label>Legend: </label></div>
                <div><span><i class='fa fa-square' style='color: ${populationFrequencies.style.veryRare}' aria-hidden='true'></i> Very rare:  freq < 0.1 %</span></div>
                <div><span><i class='fa fa-square' style='color: ${populationFrequencies.style.rare}' aria-hidden='true'></i> Rare:  freq < 0.5 %</span></div>
                <div><span><i class='fa fa-square' style='color: ${populationFrequencies.style.average}' aria-hidden='true'></i> Average:  freq < 5 %</span></div>
                <div><span><i class='fa fa-square' style='color: ${populationFrequencies.style.common}' aria-hidden='true'></i> Common:  freq >= 5 %</span></div>
                <div><span><i class='fa fa-square' style='color: black' aria-hidden='true'></i> Not observed</span></div>`;
    }

    // Creates the colored table with one row and as many columns as populations.
    static createCohortStatsTable(cohorts, cohortStats, populationFrequenciesColor) {
        // This is used by the tooltip function below to display all population frequencies
        const popFreqsArray = [];
        for (const cohort of cohorts) {
            const freq = (cohortStats.get(cohort.id) !== undefined) ? cohortStats.get(cohort.id) : 0;
            popFreqsArray.push(cohort.id + "::" + freq);
        }
        const popFreqsTooltip = popFreqsArray.join(",");

        // TODO block copied in createPopulationFrequenciesTable
        let tooltip = "";
        for (const popFreq of popFreqsArray) {
            const arr = popFreq.split("::");
            const color = VariantGridFormatter._getPopulationFrequencyColor(arr[1], populationFrequenciesColor);
            // const freq = (arr[1] !== 0 && arr[1] !== "0") ? arr[1] + " %" : "<span style='font-style: italic'>Not Observed</span>";
            let freq;
            if (arr[1] !== 0 && arr[1] !== "0") {
                freq = `${arr[1]} (${(Number(arr[1]) * 100).toPrecision(4)} %)`;
            } else {
                freq = "<span style='font-style: italic'>Not Observed</span>";
            }
            tooltip += `<div>
                            <span><i class='fa fa-xs fa-square' style='color: ${color}' aria-hidden='true'></i>
                                <label style='padding-left: 5px; width: 40px'>${arr[0]}:</label>
                            </span>
                            <span style='font-weight: bold'>${freq}</span>
                        </div>`;
        }

        // Create the table (with the tooltip info)
        const tableSize = cohorts.length * 15;
        let htmlPopFreqTable = `<a tooltip-title="Population Frequencies" tooltip-text="${tooltip}"><table style="width:${tableSize}px" class="cohortStatsTable" data-pop-freq="${popFreqsTooltip}"><tr>`;
        for (const cohort of cohorts) {
            let color = "black";
            if (typeof cohortStats.get(cohort.id) !== "undefined") {
                const freq = cohortStats.get(cohort.id);
                color = VariantGridFormatter._getPopulationFrequencyColor(freq, populationFrequenciesColor);
            }
            htmlPopFreqTable += `<td style="width: 15px; background: ${color}; border-right: 1px solid white;">&nbsp;</td>`;
        }
        htmlPopFreqTable += "</tr></table></a>";
        return htmlPopFreqTable;
    }

    // Creates the colored table with one row and as many columns as populations.
    static createPopulationFrequenciesTable(populations, populationFrequenciesMap, populationFrequenciesColor) {
        // This is used by the tooltip function below to display all population frequencies
        const popFreqsArray = [];
        for (const population of populations) {
            const freq = (populationFrequenciesMap.get(population) !== undefined) ? populationFrequenciesMap.get(population) : 0;
            popFreqsArray.push(population + "::" + freq);
        }
        const popFreqsTooltip = popFreqsArray.join(",");

        let tooltip = "";
        for (const popFreq of popFreqsArray) {
            const arr = popFreq.split("::");
            const color = VariantGridFormatter._getPopulationFrequencyColor(arr[1], populationFrequenciesColor);
            // const freq = (arr[1] !== 0 && arr[1] !== "0") ? arr[1] + " %" : "<span style='font-style: italic'>Not Observed</span>";
            let freq;
            if (arr[1] !== 0 && arr[1] !== "0") {
                freq = `${arr[1]} (${(Number(arr[1]) * 100).toPrecision(4)} %)`;
            } else {
                freq = "<span style='font-style: italic'>Not Observed</span>";
            }
            tooltip += `<div>
                            <span>
                                <i class='fa fa-xs fa-square' style='color: ${color}' aria-hidden='true'></i>
                                <label style='padding-left: 5px; width: 40px'>${arr[0]}:</label>
                            </span>
                            <span style='font-weight: bold'>${freq}</span>
                        </div>`;
        }

        // Create the table (with the tooltip info)
        const tableSize = populations.length * 15;
        let htmlPopFreqTable = `<a tooltip-title="Population Frequencies" tooltip-text="${tooltip}">
                                <table style="width:${tableSize}px" class="populationFrequenciesTable" data-pop-freq="${popFreqsTooltip}">
                                    <tr>`;
        for (const population of populations) {
            // This array contains "study:population"
            let color = "black";
            if (typeof populationFrequenciesMap.get(population) !== "undefined") {
                const freq = populationFrequenciesMap.get(population);
                color = VariantGridFormatter._getPopulationFrequencyColor(freq, populationFrequenciesColor);
            }
            htmlPopFreqTable += `<td style="width: 15px; background: ${color}; border-right: 1px solid white;">&nbsp;</td>`;
        }
        htmlPopFreqTable += "</tr></table></a>";
        return htmlPopFreqTable;
    }

    static _getPopulationFrequencyColor(freq, populationFrequenciesColor) {
        let color;
        if (freq === 0 || freq === "0") {
            color = populationFrequenciesColor.unobserved;
        } else if (freq < 0.001) {
            color = populationFrequenciesColor.veryRare;
        } else if (freq < 0.005) {
            color = populationFrequenciesColor.rare;
        } else if (freq < 0.05) {
            color = populationFrequenciesColor.average;
        } else {
            color = populationFrequenciesColor.common;
        }
        return color;
    }

    static clinicalPhenotypeFormatter(value, row, index) {
        const phenotypeHtml = "<span><i class='fa fa-times' style='color: red'></i></span>";
        if (row?.annotation?.traitAssociation) {
            // Filter the traits for this column and check the number of existing traits
            const traits = row.annotation.traitAssociation.filter(trait => trait.source.name.toUpperCase() === this.field.toUpperCase());
            if (traits.length === 0) {
                return "<span title='No clinical records found for this variant'><i class='fa fa-times' style='color: gray'></i></span>";
            }

            if (this.field === "clinvar") {
                const results = [];
                let tooltipText = "";
                const clinicalSignificanceVisited = new Set();
                for (const trait of traits) {
                    let clinicalSignificance,
                        drugResponseClassification;
                    if (trait?.variantClassification?.clinicalSignificance) {
                        clinicalSignificance = trait.variantClassification.clinicalSignificance;
                    } else {
                        if (trait?.variantClassification?.drugResponseClassification) {
                            clinicalSignificance = "drug_response";
                            drugResponseClassification = trait?.variantClassification?.drugResponseClassification;
                        } else {
                            clinicalSignificance = "unknown";
                        }
                    }
                    let code = "";
                    let color = "";
                    let tooltip = "";
                    switch (clinicalSignificance.toUpperCase()) {
                        case "BENIGN":
                            code = "B";
                            color = "green";
                            tooltip = "Classified as benign following ACMG/AMP recommendations for variants interpreted for Mendelian disorders";
                            break;
                        case "LIKELY_BENIGN":
                            code = "LB";
                            color = "brown";
                            tooltip = "Classified as likely benign following ACMG/AMP recommendations for variants interpreted for Mendelian disorders";
                            break;
                        case "VUS":
                        case "UNCERTAIN_SIGNIFICANCE":
                            code = "US";
                            color = "darkorange";
                            tooltip = "Classified as of uncertain significance following ACMG/AMP recommendations for variants interpreted for Mendelian disorders";
                            break;
                        case "LIKELY_PATHOGENIC":
                            code = "LP";
                            color = "darkred";
                            tooltip = "Classified as likely pathogenic following ACMG/AMP recommendations for variants interpreted for Mendelian disorders";
                            break;
                        case "PATHOGENIC":
                            code = "P";
                            color = "red";
                            tooltip = "Classified as pathogenic following ACMG/AMP recommendations for variants interpreted for Mendelian disorders";
                            break;
                        case "DRUG_RESPONSE":
                            code = "DR";
                            color = "darkred";
                            tooltip = "Classified as drug response following ACMG/AMP recommendations for variants interpreted for Mendelian disorders";
                            break;
                        case "UNKNOWN":
                            code = "NP";
                            color = "grey";
                            tooltip = "ClinVar submissions without an interpretation of clinical significance";
                            break;
                    }

                    if (code !== "NP" && !clinicalSignificanceVisited.has(code)) {
                        results.push(`<span style="color: ${color}">${code}</span>`);
                        clinicalSignificanceVisited.add(code);
                    }

                    // Prepare the tooltip links
                    if (!trait.id?.startsWith("SCV")) {
                        // We display the link plus the clinical significance and all the heritable trait descriptions
                        tooltipText += `
                            <div style="margin: 10px 5px">
                                <div>
                                    <a href="${trait.url}" target="_blank">${trait.id}</a>
                                    <span style="font-style: italic; color: ${color}; margin-left: 10px">
                                        ${clinicalSignificance} ${drugResponseClassification ? "(" + drugResponseClassification + ")" : ""}
                                    </span>
                                </div>
                                <div>
                                    ${trait?.heritableTraits?.length > 0 && trait.heritableTraits
                                        .filter(t => t.trait && t.trait !== "not specified" && t.trait !== "not provided")
                                        .map(t => `<span class="help-block" style="margin: 5px 1px">${t.trait}</span>`)
                                        .join("")
                                    }
                                </div>
                            </div>`;
                    }
                }

                // This can only be shown if nothing else exists
                if (results.length === 0) {
                    return "<span style=\"color: grey\" title=\"ClinVar submissions without an interpretation of clinical significance\">NP</span>";
                }

                return `<a class="clinvar-tooltip" tooltip-title='Links' tooltip-text='${tooltipText}' tooltip-position-at="left bottom" tooltip-position-my="right top">${results.join("<br>")}</a>`;
            } else {
                if (this.field === "cosmic") {
                    // Prepare the tooltip links
                    let tooltipText = "";
                    const cosmicMap = new Map();
                    traits.forEach(trait => {
                        if (trait?.somaticInformation?.primaryHistology) {
                            if (!cosmicMap.has(trait.id)) {
                                cosmicMap.set(trait.id, new Set());
                            }
                            cosmicMap.get(trait.id).add(trait.somaticInformation.primaryHistology);
                        }
                    });

                    for (const [traitId, histologies] of cosmicMap.entries()) {
                        tooltipText += `
                            <div style="margin: 10px 5px">
                                <div>
                                    <a href="${BioinfoUtils.getCosmicVariantLink(traitId)}" target="_blank">${traitId}</a>
                                </div>
                                <div>
                                    ${histologies?.size > 0 && Array.from(histologies.values())
                                        .filter(histology => histology && histology !== "null")
                                        .map(histology => `<span class="help-block" style="margin: 5px 1px">${histology}</span>`)
                                        .join("")
                                    }
                                </div>
                            </div>`;
                    }

                    return `<a class="cosmic-tooltip" tooltip-title='Links' tooltip-text='${tooltipText}' tooltip-position-at="left bottom" tooltip-position-my="right top">
                                <span style="color: green">${cosmicMap.size} ${cosmicMap.size > 1 ? "studies" : "study" }</span>
                            </a>`;
                } else {
                    console.error("Wrong clinical source : " + this.field);
                }
            }
        }
        return phenotypeHtml;
    }

    static clinicalTableDetail(value, row, index) {
        const clinvar = [];
        const cosmicIntermdiate = new Map();
        const cosmic = [];
        if (row.annotation.traitAssociation && row.annotation.traitAssociation.length > 0) {
            for (const trait of row.annotation.traitAssociation) {
                const values = [];
                const vcvId = trait.additionalProperties.find(p => p.name === "VCV ID");
                const genomicFeature = trait.genomicFeatures.find(f => f.featureType.toUpperCase() === "GENE");
                const reviewStatus = trait.additionalProperties.find(p => p.name === "ReviewStatus_in_source_file");
                if (trait.source.name.toUpperCase() === "CLINVAR") {
                    values.push(`<a href="${trait.url ?? BioinfoUtils.getClinvarVariationLink(trait.id)}" target="_blank">${trait.id}</a>`);
                    values.push(vcvId ? vcvId.value : trait.id);
                    values.push(genomicFeature?.xrefs ? genomicFeature.xrefs?.symbol : "-");
                    values.push(trait.variantClassification?.clinicalSignificance);
                    values.push(trait.consistencyStatus);
                    values.push(reviewStatus ? reviewStatus.value : "-");
                    values.push(trait.heritableTraits ? trait.heritableTraits.map(t => t.trait).join("<br>") : "-");
                    clinvar.push({
                        values: values
                    });
                } else { // COSMIC section
                    // Prepare data to group by histologySubtype field
                    const key = trait.id + ":" + trait.somaticInformation.primaryHistology + ":" + trait.somaticInformation.primaryHistology;
                    const reviewStatus = trait.additionalProperties.find(p => p.id === "MUTATION_SOMATIC_STATUS");
                    const zygosity = trait.additionalProperties.find(p => p.id === "MUTATION_ZYGOSITY");
                    if (!cosmicIntermdiate.has(key)) {
                        cosmicIntermdiate.set(key, {
                            id: trait.id,
                            url: trait.url,
                            primarySite: trait.somaticInformation.primarySite,
                            primaryHistology: trait.somaticInformation.primaryHistology,
                            histologySubtypes: [],
                            histologySubtypesCounter: new Map(),
                            reviewStatus: reviewStatus,
                            pubmed: new Set(),
                            zygosity: new Set()
                        });
                    }
                    // Only add the new terms for this key
                    if (trait.somaticInformation.histologySubtype) {
                        if (!cosmicIntermdiate.get(key).histologySubtypesCounter.get(trait.somaticInformation.histologySubtype)) {
                            cosmicIntermdiate.get(key).histologySubtypes.push(trait.somaticInformation.histologySubtype);
                        }
                        // Increment the counter always
                        cosmicIntermdiate.get(key).histologySubtypesCounter
                            .set(trait.somaticInformation.histologySubtype, cosmicIntermdiate.get(key).histologySubtypesCounter.size + 1);
                    }
                    if (trait?.bibliography?.length > 0) {
                        cosmicIntermdiate.get(key).pubmed.add(...trait.bibliography);
                    }
                    if (zygosity) {
                        cosmicIntermdiate.get(key).zygosity.add(zygosity.value);
                    }
                }
            }

            // Sort bu key and prepare column data
            for (const [key, c] of new Map([...cosmicIntermdiate.entries()].sort())) {
                const values = [];
                values.push(`<a href="${c.url ?? BioinfoUtils.getCosmicVariantLink(c.id)}" target="_blank">${c.id}</a>`);
                values.push(c.primarySite);
                values.push(c.primaryHistology);
                values.push(c.histologySubtypes
                    .map(value => {
                        if (cosmicIntermdiate.get(key).histologySubtypesCounter.get(value) > 1) {
                            return value + " (x" + cosmicIntermdiate.get(key).histologySubtypesCounter.get(value) + ")";
                        } else {
                            return "-";
                        }
                    })
                    .join("<br>") || "-");
                values.push(Array.from(c.zygosity?.values()).join(", ") || "-");
                values.push(c?.reviewStatus?.value || "-");
                values.push(Array.from(c.pubmed.values()).map(p => `<a href="${BioinfoUtils.getPubmedLink(p)}" target="_blank">${p}</a>`).join("<br>"));
                cosmic.push({
                    values: values
                });
            }
        }

        // Clinvar
        const clinvarColumns = [
            {title: "ID"},
            {title: "Variation ID"},
            {title: "Gene"},
            {title: "Clinical Significance"},
            {title: "Consistency Status"},
            {title: "Review Status"},
            {title: "Traits"}
        ];
        const clinvarTable = VariantGridFormatter.renderTable("", clinvarColumns, clinvar, {defaultMessage: "No ClinVar data found"});
        const clinvarTraits = `<div>
                                <label>ClinVar</label>
                                <div>${clinvarTable}</div>
                             </div>`;

        // Cosmic
        const cosmicColumns = [
            {title: "ID"},
            {title: "Primary Site"},
            {title: "Primary Histology"},
            {title: "Histology Subtype"},
            {title: "Zygosity"},
            {title: "Status"},
            {title: "Pubmed"}
        ];
        const cosmicTable = VariantGridFormatter.renderTable("", cosmicColumns, cosmic, {defaultMessage: "No Cosmic data found"});
        const cosmicTraits = `<div style="margin-top: 15px">
                                <label>Cosmic</label>
                                <div>${cosmicTable}</div>
                            </div>`;

        return clinvarTraits + cosmicTraits;
    }

    /*
     * Reported Variant formatters
     */
    static toggleDetailClinicalEvidence(e) {
        const id = e.target.dataset.id;
        const elements = document.getElementsByClassName(this._prefix + id + "EvidenceFiltered");
        for (const element of elements) {
            if (element.style.display === "none") {
                element.style.display = "";
            } else {
                element.style.display = "none";
            }
        }
    }

    // TODO Remove since it is DEPRECATED
    // addTooltip(selector, title, content, config) {
    //     $(selector).qtip({
    //         content: {
    //             title: title,
    //             text: function (event, api) {
    //                 if (UtilsNew.isNotEmpty(content)) {
    //                     return content;
    //                 } else {
    //                     return $(this).attr("data-tooltip-text");
    //                 }
    //             }
    //         },
    //         position: {target: "mouse", adjust: {x: 2, y: 2, mouse: false}},
    //         style: {classes: "qtip-light qtip-rounded qtip-shadow qtip-custom-class"},
    //         show: {delay: 200},
    //         hide: {fixed: true, delay: 300}
    //     });
    // }

}
