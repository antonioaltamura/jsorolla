import UtilsNew from "../../core/utilsNew.js";
import {SVG} from "../../core/svg.js";
import FeatureTrack from "./feature-track.js";
import HistogramRenderer from "../renderers/histogram-renderer.js";
import VariantRenderer from "../renderers/variant-renderer.js";
import FeatureRenderer from "../renderers/feature-renderer.js";
import GenomeBrowserUtils from "../genome-browser-utils.js";

export default class OpenCGAVariantTrack extends FeatureTrack {

    constructor(config) {
        super(config);

        this.sampleNames = null;

        // Initialize Rendererers
        this.histogramRenderer = new HistogramRenderer(this.config.histogramRenderer);
        this.renderer = new FeatureRenderer({
            color: GenomeBrowserUtils.variantColorFormatter,
            label: GenomeBrowserUtils.variantLabelFormatter,
            tooltipTitle: GenomeBrowserUtils.variantTooltipTitleFormatter,
            tooltipText: GenomeBrowserUtils.variantTooltipTextFormatter,
            histogramColor: "#58f3f0",
            ...this.config.renderer,
        });

        // Check if samples has been provided in the query object
        if (this.config?.query?.sample) {
            this.sampleNames = this.config.query.sample.split(",")
                .map(item => item.split(":")[0])
                .filter(name => !!name);

            // Initialize samples DOM
            this.#initSamplesDOM();

            // Initialize variant renderer
            this.renderer = new VariantRenderer({
                sampleNames: this.sampleNames,
                sampleHeight: this.config.sampleHeight,
                sampleHeaderHeight: this.config.sampleHeaderHeight,
                sampleHeaderDividerHeight: this.config.sampleHeaderDividerHeight,
                ...this.config.renderer,
            });
        }
    }

    #initSamplesDOM() {
        const template = UtilsNew.renderHTML(`
            <div id="${this.prefix}SampleNames" style="position:absolute;top:0px;">
                ${this.sampleNames.map(name => `
                    <div style="font-size:0.75rem;height:${this.config.sampleHeight}px;">
                        <span style="font-weight:bold;vertical-align:middle;">${name}</span>
                    </div>
                `).join("")}
            </div>
            <div id="${this.prefix}SampleHeaderDivider" style="position:absolute;width:100%;"></div>
        `);

        // Sample names
        this.sampleNamesDiv = template.querySelector(`div#${this.prefix}SampleNames`);
        this.sampleNamesDiv.style.backgroundColor = "rgba(255,255,255,0.6)";
        this.sampleNamesDiv.style.paddingLeft = "8px";
        this.sampleNamesDiv.style.paddingRight = "8px";
        this.sampleNamesDiv.style.paddingTop = `${this.config.sampleHeight}px`;

        // Sample header divider
        this.sampleHeaderDividerDiv = template.querySelector(`div#${this.prefix}SampleHeaderDivider`);
        this.sampleHeaderDividerDiv.style.height = `${this.config.sampleHeaderDividerHeight}px`;
        this.sampleHeaderDividerDiv.style.backgroundColor = this.config.sampleHeaderDividerColor;
        this.sampleHeaderDividerDiv.style.top = `${this.config.sampleHeaderHeight - this.config.sampleHeaderDividerHeight - 2}px`;

        // Append elements
        this.content.appendChild(this.sampleNamesDiv);
        this.content.appendChild(this.sampleHeaderDividerDiv);
        // this.content.insertBefore(this.sampleBackgroundDiv, this.content.firstChild);
        // this.content.appendChild(this.sampleBackgroundDiv);

        // Append samples background
        const bgGroup = SVG.addChild(this.content.firstChild, "g", {}, 0);
        this.sampleNames.forEach((name, index) => {
            SVG.addChild(bgGroup, "rect", {
                x: "0px",
                y: `${this.config.sampleHeaderHeight + (index * this.config.sampleHeight)}px`,
                width: "100%",
                height: `${this.config.sampleHeaderHeight}px`,
                fill: index % 2 ? this.config.sampleBackgroundColorEven : this.config.sampleBackgroundColorOdd,
                style: `opacity:${this.config.sampleBackgroundOpacity}`,
            });
        });
    }

    getData(options) {
        if (options.dataType === "histogram" && !this.sampleNames) {
            // Fetch aggregation stats for the current region
            return this.config.opencgaClient.variants().aggregationStats({
                study: this.config.opencgaStudy,
                region: options.region.toString(),
                field: `start[${options.region.start}..${options.region.end}]:${this.config.histogramInterval}`,
            });
        } else {
            // Fetch variants
            return this.config.opencgaClient.variants().query({
                ...(this.config.query || {}),
                study: this.config.opencgaStudy,
                limit: 5000,
                region: options.region.toString(),
                include: "id,chromosome,start,end,strand,type,annotation.displayConsequenceType,studies",
            });
        }
    }

    // Get default config
    getDefaultConfig() {
        return {
            title: "",
            height: 200,
            maxHeight: 300,
            resizable: true,
            dataAdapter: null,
            opencgaClient: null,
            opencgaStudy: "",
            // opencgaSamples: [],
            // opencgaFiles: [],
            query: null,
            histogramMinRegionSize: 300000000,
            histogramInterval: 10000,
            labelMaxRegionSize: 10000000,
            renderer: {}, // Renderer configuration
            histogramRenderer: {}, // Histogram renderer configuration
            sampleHeight: 20,
            sampleBackgroundOpacity: 0.2,
            sampleBackgroundColorOdd: "#ffffff",
            sampleBackgroundColorEven: "#a4abb6",
            sampleHeaderHeight: 20,
            sampleHeaderDividerHeight: 2,
            sampleHeaderDividerColor: "#d4d8dd",
        };
    }

}
