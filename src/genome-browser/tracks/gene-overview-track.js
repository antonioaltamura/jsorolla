import FeatureTrack from "./feature-track";
import CellBaseAdapter from "../../core/data-adapter/cellbase-adapter";
import FeatureRenderer from "../renderers/feature-renderer";

/* **************************************************/
/* Create a GeneOverTrack for genome-browser        */
/* @author Asunción Gallego                         */
/* @param cellbaseClient       required             */
/* **************************************************/
export default class GeneOverviewTrack extends FeatureTrack {

    constructor(args) {
        super(args);
        Object.assign(this, this.getDefaultConfig(), args);
        this._init();
        this.resource = this.dataAdapter.resource;
        this.species = this.dataAdapter.species;
    }

    getDefaultConfig() {
        return {
            title: "Gene overview",
            height: 80,
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000
        };
    }

    _init() {
        this.renderer = new FeatureRenderer(FEATURE_TYPES.gene);
        this.dataAdapter = new CellBaseAdapter(this.cellbaseClient, "genomic", "region", "gene", {
            exclude: "transcripts,chunkIds"
        }, {
            chunkSize: 100000
        });
    }

}
