import UtilsNew from "../../core/utilsNew.js";
import Renderer from "./renderer.js";
import {SVG} from "../../core/svg.js";
import FeatureBinarySearchTree from "../feature-binary-search-tree.js";


export default class GeneRenderer extends Renderer {

    constructor(args) {
        super(args);
        //Extend and add Backbone Events
        Object.assign(this, Backbone.Events);

        this.fontClass = "ocb-font-roboto ocb-font-size-11";
        this.toolTipfontClass = "ocb-tooltip-font";

        if (_.isObject(args)) {
            Object.assign(this, args);
        }

        this.on(this.handlers);
    }

    setFeatureConfig(configObject) {
        Object.assign(this, configObject);
    }

    render(features, args) {
        let _this = this;
        let draw = function (feature) {
            // get feature render configuration
            _this.setFeatureConfig(_this.getDefaultConfigGene().gene);
            let color = _.isFunction(_this.color) ? _this.color(feature) : _this.color;
            let label = _.isFunction(_this.label) ? _this.label(feature) : _this.label;
            let height = _.isFunction(_this.height) ? _this.height(feature) : _this.height;
            let tooltipTitle = _.isFunction(_this.tooltipTitle) ? _this.tooltipTitle(feature) : _this.tooltipTitle;
            let tooltipText = _.isFunction(_this.tooltipText) ? _this.tooltipText(feature) : _this.tooltipText;
            let infoWidgetId = _.isFunction(_this.infoWidgetId) ? _this.infoWidgetId(feature) : _this.infoWidgetId;

            // get feature genomic information
            let start = feature.start;
            let end = feature.end;
            let length = (end - start) + 1;

            // transform to pixel position
            let width = length * args.pixelBase;

            // var svgLabelWidth = _this.getLabelWidth(label, args);
            let svgLabelWidth = label.length * 6.4;

            // calculate x to draw svg rect
            let x = _this.getFeatureX(start, args);

            let maxWidth = Math.max(width, 2);
            let textHeight = 0;
            if (args.maxLabelRegionSize > args.regionSize) {
                textHeight = 9;
                maxWidth = Math.max(width, svgLabelWidth);
            }

            let rowY = 0;
            let textY = textHeight + height + 1;
            let rowHeight = textHeight + height + 5;

            while (true) {
                if (!(rowY in args.renderedArea)) {
                    args.renderedArea[rowY] = new FeatureBinarySearchTree();
                }

                let foundArea;//if true, i can paint

                // check if gene transcripts can be painted
                let checkRowY = rowY;
                let foundTranscriptsArea = true;
                if (!_.isEmpty(feature.transcripts)) {
                    for (let i = 0, leni = feature.transcripts.length + 1; i < leni; i++) {
                        if (!(checkRowY in args.renderedArea)) {
                            args.renderedArea[checkRowY] = new FeatureBinarySearchTree();
                        }
                        if (args.renderedArea[checkRowY].contains({start: x, end: x + maxWidth - 1})) {
                            foundTranscriptsArea = false;
                            break;
                        }
                        checkRowY += rowHeight;
                    }
                    if (foundTranscriptsArea === true) {
                        foundArea = args.renderedArea[rowY].add({start: x, end: x + maxWidth - 1});
                    }
                } else {
                    foundArea = args.renderedArea[rowY].add({start: x, end: x + maxWidth - 1});
                }

                // paint genes
                if (foundArea) {
                    let featureGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
                        "feature_id": feature.id
                    });
                    let rect = SVG.addChild(featureGroup, "rect", {
                        "x": x,
                        "y": rowY,
                        "width": width,
                        "height": height,
                        "stroke": "#3B0B0B",
                        "stroke-width": 0.5,
                        "fill": color,
                        "cursor": "pointer"
                    });

                    if (args.maxLabelRegionSize > args.regionSize) {
                        let text = SVG.addChild(featureGroup, "text", {
                            "i": i,
                            "x": x,
                            "y": textY,
                            "fill": "black",
                            "cursor": "pointer",
                            "class": _this.fontClass
                        });
                        text.textContent = label;
                    }

                    $(featureGroup).qtip({
                        content: {text: tooltipText, title: tooltipTitle},
                        // position: {target: "mouse", adjust: {x: 15, y: 0}, viewport: $(window), effect: false},
                        position: {target: "mouse", adjust: {x: 25, y: 15}},
                        style: {width: true, classes: _this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"},
                        show: {delay: 300},
                        hide: {delay: 300}
                    });


                    featureGroup.addEventListener("click", function (e) {
                        _this.trigger("feature:click", {
                            query: feature[infoWidgetId],
                            feature: feature,
                            featureType: "gene",
                            clickEvent: e
                        });
                    });

                    //paint transcripts
                    let checkRowY = rowY + rowHeight;
                    let checkTextY = textY + rowHeight;
                    if (!_.isEmpty(feature.transcripts)) {
                        /* warning not change var i */
                        for (var i = 0, leni = feature.transcripts.length; i < leni; i++) { /*Loop over transcripts*/
                            if (!(checkRowY in args.renderedArea)) {
                                args.renderedArea[checkRowY] = new FeatureBinarySearchTree();
                            }
                            let transcript = feature.transcripts[i];
                            let transcriptX = _this.getFeatureX(transcript.start, args);
                            let transcriptWidth = (transcript.end - transcript.start + 1) * ( args.pixelBase);

                            //get type settings object
                            _this.setFeatureConfig(_this.getDefaultConfigGene().transcript);
                            let transcriptColor = _.isFunction(_this.color) ? _this.color(transcript) : _this.color;
                            let label = _.isFunction(_this.label) ? _this.label(transcript) : _this.label;
                            let height = _.isFunction(_this.height) ? _this.height(transcript) : _this.height;
                            let tooltipTitle = _.isFunction(_this.tooltipTitle) ? _this.tooltipTitle(transcript) : _this.tooltipTitle;
                            let tooltipText = _.isFunction(_this.tooltipText) ? _this.tooltipText(transcript) : _this.tooltipText;
                            let infoWidgetId = _.isFunction(_this.infoWidgetId) ? _this.infoWidgetId(transcript) : _this.infoWidgetId;

                            //the length of the end of the gene is subtracted to the beginning of the transcript and is added the text of the transcript

                            let svgLabelWidth = label.length * 6.4;
                            let maxWidth = Math.max(width, width - ((feature.end - transcript.start) * ( args.pixelBase)) + svgLabelWidth);


                            //add to the tree the transcripts size
                            args.renderedArea[checkRowY].add({start: x, end: x + maxWidth - 1});


                            let transcriptGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
                                "data-widget-id": transcript[infoWidgetId],
                                "data-transcript-idx": i
                            });


                            let rect = SVG.addChild(transcriptGroup, "rect", {//this rect its like a line
                                "x": transcriptX,
                                "y": checkRowY + 1,
                                "width": transcriptWidth,
                                "height": height,
                                "fill": "gray",
                                "cursor": "pointer",
                                "feature_id": transcript.id
                            });
                            let text = SVG.addChild(transcriptGroup, "text", {
                                "x": transcriptX,
                                "y": checkTextY,
                                "fill": "black",
                                "cursor": "pointer",
                                "class": _this.fontClass
                            });
                            text.textContent = label;


                            $(transcriptGroup).qtip({
                                content: {text: tooltipText, title: tooltipTitle},
                                // position: {target: 'mouse', adjust: {x: 15, y: 0}, viewport: $(window), effect: false},
                                position: {target: "mouse", adjust: {x: 25, y: 15}},
                                style: {width: true, classes: _this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"},
                                show: {delay: 300},
                                hide: {delay: 300}
                            });

                            transcriptGroup.addEventListener("click", function (e) {
                                // var query = this.getAttribute('data-widget-id');
                                // var idx = this.getAttribute("data-transcript-idx");
                                // _this.trigger('feature:click', {
                                //     query: query,
                                //     feature: feature.transcripts[idx],
                                //     featureType: 'transcript',
                                //     clickEvent: event
                                // });
                            });


                            //paint exons
                            for (let e = 0, lene = feature.transcripts[i].exons.length; e < lene; e++) {
                                let exon = feature.transcripts[i].exons[e];
                                let exonStart = parseInt(exon.start);
                                let exonEnd = parseInt(exon.end);
                                let middle = args.width / 2;

                                let exonX = args.pixelPosition + middle - ((args.position - exonStart) * args.pixelBase);
                                let exonWidth = (exonEnd - exonStart + 1) * ( args.pixelBase);


                                _this.setFeatureConfig(_this.getDefaultConfigGene().exon);
                                let color = _.isFunction(_this.color) ? _this.color(exon) : _this.color;
                                let label = _.isFunction(_this.label) ? _this.label(exon) : _this.label;
                                let height = _.isFunction(_this.height) ? _this.height(exon) : _this.height;
                                let tooltipTitle = _.isFunction(_this.tooltipTitle) ? _this.tooltipTitle(exon) : _this.tooltipTitle;
                                let tooltipText = _.isFunction(_this.tooltipText) ? _this.tooltipText(exon, transcript) : _this.tooltipText;
                                let infoWidgetId = _.isFunction(_this.infoWidgetId) ? _this.infoWidgetId(exon) : _this.infoWidgetId;

                                let exonGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
                                    "class": "ocb-coding",
                                    "data-id": exon.id
                                });

                                $(exonGroup).qtip({
                                    content: {text: tooltipText, title: tooltipTitle},
                                    // position: {target: 'mouse', adjust: {x: 15, y: 0}, viewport: $(window), effect: false},
                                    position: {target: "mouse", adjust: {x: 25, y: 15}},
                                    style: {
                                        width: true,
                                        classes: _this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"
                                    },
                                    show: {delay: 300},
                                    hide: {delay: 300}
                                });

                                exonGroup.addEventListener("click", function (e) {
                                    // console.log(this.dataset.id);
                                    // var query = this.getAttribute('data-widget-id');
                                    // var idx = this.getAttribute("data-transcript-idx");
                                    // _this.trigger('feature:click', {
                                    //     query: query,
                                    //     feature: feature.transcripts[idx],
                                    //     featureType: 'transcript',
                                    //     clickEvent: event
                                    // });
                                });


                                // Paint exons in white without coding region
                                let eRect = SVG.addChild(exonGroup, "rect", {
                                    "i": i,
                                    "x": exonX,
                                    "y": checkRowY - 1,
                                    "width": exonWidth,
                                    "height": height,
                                    "stroke": "gray",
                                    "stroke-width": 1,
                                    "fill": "white",
                                    "cursor": "pointer"
                                });

                                let codingLength = exon.genomicCodingEnd - exon.genomicCodingStart;
                                let codingX = args.pixelPosition + middle - ((args.position - exon.genomicCodingStart) * args.pixelBase);
                                let codingReverseX = args.pixelPosition + middle - ((args.position - exon.genomicCodingEnd) * args.pixelBase);
                                let codingWidth = (codingLength + 1) * (args.pixelBase);
                                if (codingLength > 0) {
                                    let cRect = SVG.addChild(exonGroup, "rect", {
                                        "i": i,
                                        "x": codingX,
                                        "y": checkRowY - 1,
                                        "width": codingWidth,
                                        "height": height,
                                        "stroke": transcriptColor,
                                        "stroke-width": 1,
                                        "fill": transcriptColor,
                                        "cursor": "pointer"
                                    });
                                    if (args.pixelBase > 9.5 && transcript.proteinSequence !== null && exon.phase !== null) {
                                        // FIXME This fixes a Cellbase bug, phase=0 are not returned, we have to remove this when fixed
                                        if (typeof exon.phase === "undefined") {
                                            exon.phase = 0;
                                        }

                                        if (exon.strand === "+") {
                                            /* not change var x let*/
                                            var proteinString = transcript.proteinSequence.substring(Math.floor(exon.cdsStart / 3), Math.floor(exon.cdsEnd / 3));
                                            var proteinPhaseOffset = codingX - (((3 - exon.phase) % 3) * args.pixelBase);
                                            var sign = 1;

                                        } else if (exon.strand === "-") {
                                            var proteinString = transcript.proteinSequence.substring(Math.floor(exon.cdsStart / 3), Math.ceil(exon.cdsEnd / 3));
                                            var proteinPhaseOffset = codingReverseX - (args.pixelBase * 2) - (exon.phase * args.pixelBase);
                                            var sign = -1;
                                        }

                                        for (let j = 0; j < proteinString.length; j++) {
                                            let codonRect = SVG.addChild(exonGroup, "rect", {
                                                "x": proteinPhaseOffset + (sign * args.pixelBase * 3 * j ),
                                                "y": checkRowY - 1,
                                                "width": (args.pixelBase * 3),
                                                "height": height,
                                                "stroke": "#3B0B0B",
                                                "stroke-width": 0.5,
                                                "fill": CODON_CONFIG[proteinString.charAt(j)].color,
                                                "class": "ocb-codon"
                                            });
                                            let codonText = SVG.addChild(exonGroup, "text", {
                                                "x": proteinPhaseOffset + (sign * args.pixelBase * j * 3) + args.pixelBase / 3,
                                                "y": checkRowY - 3,
                                                "width": (args.pixelBase * 3),
                                                "class": "ocb-font-ubuntumono ocb-font-size-16 ocb-codon"
                                            });
                                            codonText.textContent = CODON_CONFIG[proteinString.charAt(j)].text;
                                        }
                                    }

                                    // Draw phase only at zoom 100, where this.pixelBase < 11
                                    //if (args.pixelBase < 11 && exon.phase != null && exon.phase != -1) {
                                    //    for (var p = 0, lenp = 3 - exon.phase; p < lenp; p++) {
                                    //        SVG.addChild(exonGroup, "rect", {
                                    //            "i": i,
                                    //            "x": codingX + (p * args.pixelBase),
                                    //            "y": checkRowY - 1,
                                    //            "width": args.pixelBase,
                                    //            "height": height,
                                    //            "stroke": color,
                                    //            "stroke-width": 1,
                                    //            "fill": 'white',
                                    //            "cursor": "pointer"
                                    //        });
                                    //    }
                                    //}
                                }
                            }
                            checkRowY += rowHeight;
                            checkTextY += rowHeight;
                        }
                    }// if transcrips != null
                    break;
                }
                rowY += rowHeight;
                textY += rowHeight;
            }
        };

        //process features
        for (let i = 0, leni = features.length; i < leni; i++) {
            draw(features[i]);
        }
    }

    getDefaultConfigGene() {
        return {
            gene: {
                label(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var str = "";
                    str += (f.strand < 0 || f.strand == '-') ? "<" : "";
                    str += " " + name + " ";
                    str += (f.strand > 0 || f.strand == '+') ? ">" : "";
                    if (f.biotype != null && f.biotype != '') {
                        str += " [" + f.biotype + "]";
                    }
                    return str;
                },
                tooltipTitle(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var formatTitle = 'Gene';
                    if (formatTitle) {
                        formatTitle.replace(/_/gi, " ");
                        formatTitle = formatTitle.charAt(0).toUpperCase() + formatTitle.slice(1);
                    }

                    return formatTitle + ' - <span class="ok">' + name + '</span>';
                },
                tooltipText(f) {
                    var color = GENE_BIOTYPE_COLORS[f.biotype];
                    var strand = (f.strand != null) ? f.strand : "NA";
                    const region = `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                    return 'id:&nbsp;<span class="ssel">' + f.id + '</span><br>' +
                        'biotype:&nbsp;<span class="emph" style="color:' + color + ';">' + f.biotype + '</span><br>' +
                        region +
                        'source:&nbsp;<span class="ssel">' + f.source + '</span><br><br>' +
                        'description:&nbsp;<span class="emph">' + f.description + '</span><br>';
                },
                color(f) {
                    return GENE_BIOTYPE_COLORS[f.biotype];
                },
                infoWidgetId: "id",
                height: 4,
                histogramColor: "lightblue",
            },
            transcript: {
                label(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var str = "";
                    str += (f.strand < 0) ? "<" : "";
                    str += " " + name + " ";
                    str += (f.strand > 0) ? ">" : "";
                    if (f.biotype != null && f.biotype != '') {
                        str += " [" + f.biotype + "]";
                    }
                    return str;
                },
                tooltipTitle(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var formatTitle = 'Transcript';
                    if (formatTitle) {
                        formatTitle.replace(/_/gi, " ");
                        formatTitle = formatTitle.charAt(0).toUpperCase() + formatTitle.slice(1);
                    }
                    return formatTitle +
                        ' - <span class="ok">' + name + '</span>';
                },
                tooltipText(f) {
                    var color = GENE_BIOTYPE_COLORS[f.biotype];
                    var strand = (f.strand != null) ? f.strand : "NA";
                    const region = `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                    return 'id:&nbsp;<span class="ssel">' + f.id + '</span><br>' +
                        'biotype:&nbsp;<span class="emph" style="color:' + color + ';">' + f.biotype + '</span><br>' +
                        'description:&nbsp;<span class="emph">' + f.description + '</span><br>' +
                        region;
                },
                color(f) {
                    return GENE_BIOTYPE_COLORS[f.biotype];
                },
                infoWidgetId: "id",
                height: 1,
                histogramColor: "lightblue",
            },
            exon: {
                label(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    return name;
                },
                tooltipTitle(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    if (name == null) {
                        name = '';
                    }
                    var formatTitle = 'Exon';
                    if (formatTitle) {
                        formatTitle.replace(/_/gi, " ");
                        formatTitle = formatTitle.charAt(0).toUpperCase() + formatTitle.slice(1);
                    }
                    return formatTitle + ' - <span class="ok">' + name + '</span>';
                },
                tooltipText(e, t) {
                    // return FEATURE_TYPES.getTipCommons(e) + FEATURE_TYPES._getSimpleKeys(e);
                    let color = GENE_BIOTYPE_COLORS[t.biotype];
                    var strandE = (e.strand != null) ? e.strand : "NA";
                    const region = `start-end:&nbsp;<span style="font-weight: bold">${e.start}-${e.end} (${strandE})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(e.end - e.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                    var strandT = (t.strand != null) ? t.strand : "NA";
                    const regionT = `start-end:&nbsp;<span style="font-weight: bold">${t.start}-${t.end} (${strandT})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(t.end - t.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;

                    var simpleKey = '';
                    for (let key in e) {
                        if (key == 'start' || key == 'end' || key == 'id' || key == 'name' || key == 'length') {
                            continue;
                        }
                        if (_.isNumber(e[key]) || _.isString(e[key])) {
                            simpleKey += key + ':&nbsp;<span style="font-weight: bold">' + e[key] + '</span><br>'
                        }
                    }

                    return `Transcript:<br>
                    <div style="padding-left: 10px">
                        id:&nbsp;<span class="ssel">${t.id}</span><br>
                        biotype:&nbsp;<span class="emph" style="color:${color};">${t.biotype}</span><br>
                        description:&nbsp;<span class="emph">${t.description}</span><br>
                        ${regionT}<br>
                    </div>
                    Exon:<br>
                    <div style="padding-left: 10px">
                        ${region}${simpleKey}
                    </div>
                    `;
                },
                color(f) {
                    return "black";
                },
                infoWidgetId: "id",
                height: 7,
                histogramColor: "lightblue"
            },
        };
    }
}
