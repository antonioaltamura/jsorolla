import Region from "../../core/bioinfo/region.js";
import UtilsNew from "../../core/utilsNew.js";


export default class NavigationBar {

    constructor(target, config) {
        // eslint-disable-next-line no-undef
        Object.assign(this, Backbone.Events);

        this.target = target;
        this.config = {
            ...this.getDefaultConfig(),
            ...config,
        };

        this.#init();
    }

    #init() {
        this.prefix = UtilsNew.randomString(8);
        this.region = new Region(this.config.region);
        this.zoom = this.config.zoom || 50;

        this.elements = {};
        this.currentChromosomesList = [];
        this.zoomChanging = false;
        this.regionChanging = false;
        this.quickSearchDataset = {};

        this.#initDom();
        this.#initEvents();
    }

    #initDom() {
        const template = UtilsNew.renderHTML(`
            <div id="${this.prefix}" class="ocb-gv-navigation-bar unselectable">
                <div id="${this.prefix}LeftSideButton" title="Restore previous region" style="margin-right:5px;" class="ocb-ctrl">
                    <i class="fa fa-bars"></i>
                </div>
                <div id="${this.prefix}RestoreDefaultRegionButton" class="ocb-ctrl">
                    <i class="fa fa-redo"></i>
                </div>
                <div title="Region history" class="ocb-dropdown" style="margin-left: 5px">
                    <div id="${this.prefix}RegionHistoryButton" class="ocb-ctrl" tabindex="-1">
                        <i class="fa fa-history"></i>
                        <i class="fa fa-caret-down"></i>
                    </div>
                    <ul id="${this.prefix}RegionHistoryMenu"></ul>
                </div>
                <div title="Species menu" class="ocb-dropdown" style="margin-left: 5px">
                    <div id="${this.prefix}SpeciesButton" class="ocb-ctrl" tabindex="-1">
                        <span id="${this.prefix}SpeciesText"></span>
                        <i class="fa fa-caret-down"></i>
                    </div>
                    <ul id="${this.prefix}SpeciesMenu"></ul>
                </div>
                <div title="Chromosomes menu" class="ocb-dropdown" style="margin-left: 5px">
                    <div id="${this.prefix}ChromosomesButton" class="ocb-ctrl" tabindex="-1">
                        <span id="${this.prefix}ChromosomesText"></span>
                        <i class="fa fa-caret-down"></i>
                    </div>
                    <ul id="${this.prefix}ChromosomesMenu" style="height: 200px; overflow-y: auto;"></ul>
                </div>
                <div style="margin-left:5px;float:left;">
                    <label title="Toggle karyotype panel" class="ocb-ctrl" id="${this.prefix}KaryotypeButtonLabel">
                        <input id="${this.prefix}KaryotypeButton" type="checkbox" />
                        <span style="border-right:none">
                            <span class="ocb-icon ocb-icon-karyotype"></span>
                        </span>
                    </label>
                    <label title="Toggle chromosome panel" class="ocb-ctrl" id="${this.prefix}ChromosomeButtonLabel">
                        <input id="${this.prefix}ChromosomeButton" type="checkbox" />
                        <span style="border-right:none">
                            <span class="ocb-icon ocb-icon-chromosome"></span>
                        </span>
                    </label>
                    <label title="Toggle overview panel" class="ocb-ctrl" id="${this.prefix}RegionButtonLabel">
                        <input id="${this.prefix}RegionButton" type="checkbox" />
                        <span>
                            <span class="ocb-icon ocb-icon-region"></span>
                        </span>
                    </label>
                </div>

                <!-- Zoom control -->
                <div id="${this.prefix}ZoomControl" style="float:left;">
                    <div title="Minimum window size" id="${this.prefix}ZoomMinButton" class="ocb-ctrl" style="">Min</div>
                    <div title="Decrease window size" id="${this.prefix}ZoomOutButton" class="ocb-ctrl">
                        <span class="fa fa-minus"></span>
                    </div>
                    <div id="${this.prefix}ProgressBarCont" class="ocb-zoom-bar">
                        <div id="${this.prefix}ProgressBarBack" class="back"></div>
                        <div id="${this.prefix}ProgressBar" class="rect" style="width:${this.zoom}%"></div>
                        <div id="${this.prefix}ProgressBarBall" class="ball" style="left:${this.zoom}%"></div>
                    </div>
                    <div title="Increase window size" id="${this.prefix}ZoomInButton" class="ocb-ctrl" style="border-right:none;">
                        <span class="fa fa-plus"></span>
                    </div>
                    <div title="Maximum window size" id="${this.prefix}ZoomMaxButton" class="ocb-ctrl">Max</div>
                </div>

                <div title="Window size (Nucleotides)" id="${this.prefix}WindowSizeControl" style="float:left;margin-left:5px;">
                    <input id="${this.prefix}WindowSizeField" class="ocb-ctrl" type="text" style="width:70px;" />
                </div>

                <div title="Position" id="${this.prefix}PositionControl" style="float:left;margin-left:5px">
                    <input id="${this.prefix}RegionField" class="ocb-ctrl" placeholder="1:10000-20000" type="text" style="width:170px;">
                    <div id="${this.prefix}GoButton" class="ocb-ctrl" style="border-left: none;">Go!</div>
                </div>

                <div id="${this.prefix}MoveControl" style="float:left;font-size:18px;">
                    <div id="${this.prefix}MoveFurtherLeftButton" class="ocb-ctrl" style="border-right:none;margin-left:5px;">
                        <i class="fa fa-angle-double-left"></i>
                    </div>
                    <div id="${this.prefix}MoveLeftButton" class="ocb-ctrl" style="border-right:none;">
                        <i class="fa fa-angle-left"></i>
                    </div>
                    <div id="${this.prefix}MoveRightButton" class="ocb-ctrl" style="border-right:none;">
                        <i class="fa fa-angle-right"></i>
                    </div>
                    <div id="${this.prefix}MoveFurtherRightButton" class="ocb-ctrl">
                        <i class="fa fa-angle-double-right"></i>
                    </div>
                </div>

                <label class="ocb-ctrl">
                    <input type="checkbox" id="${this.prefix}AutoheightButton" />
                    <span style="margin-left:5px;font-size:18px;">
                        <i class="fa fa-compress"></i>
                    </span>
                </label>

                <div id="${this.prefix}SearchControl" style="float:left;">
                    <input
                        type="text"
                        id="${this.prefix}SearchField"
                        list="${this.prefix}SearchDataList"
                        class="ocb-ctrl"
                        placeholder="gene"
                        style="width:90px;margin-left:5px;"
                    />
                    <datalist id="${this.prefix}SearchDataList"></datalist>
                    <div id="${this.prefix}SearchButton" class="ocb-ctrl" style="border-left:none;">
                        <i class="fa fa-search"></i>
                    </div>
                </div>

                <div style="float:right;margin-right:10px;" id="${this.prefix}MenuButton" class="ocb-ctrl">
                    <i class="fa fa-navicon"></i> Configure
                </div>
            </div>
        `);

        this.div = template.querySelector(`div#${this.prefix}`);

        // Initialize elements
        this.elements.karyotypeButton = this.div.querySelector(`input#${this.prefix}KaryotypeButton`);
        this.elements.chromosomeButton = this.div.querySelector(`input#${this.prefix}ChromosomeButton`);
        this.elements.regionButton = this.div.querySelector(`input#${this.prefix}RegionButton`);

        this.elements.leftSideButton = this.div.querySelector(`div#${this.prefix}LeftSideButton`);
        this.elements.restoreDefaultRegionButton = this.div.querySelector(`div#${this.prefix}RestoreDefaultRegionButton`);
        this.elements.menuButton = this.div.querySelector(`div#${this.prefix}MenuButton`);

        this.elements.chromosomesText = this.div.querySelector(`span#${this.prefix}ChromosomesText`);
        this.elements.chromosomesMenu = this.div.querySelector(`ul#${this.prefix}ChromosomesMenu`);

        this.elements.zoomOutButton = this.div.querySelector(`div#${this.prefix}ZoomOutButton`);
        this.elements.zoomInButton = this.div.querySelector(`div#${this.prefix}ZoomInButton`);
        this.elements.zoomMaxButton = this.div.querySelector(`div#${this.prefix}ZoomMaxButton`);
        this.elements.zoomMinButton = this.div.querySelector(`div#${this.prefix}ZoomMinButton`);

        this.elements.progressBarCont = this.div.querySelector(`div#${this.prefix}ProgressBarCont`);
        this.elements.progressBarBall = this.div.querySelector(`div#${this.prefix}ProgressBarBall`);
        this.elements.progressBar = this.div.querySelector(`div#${this.prefix}ProgressBar`);

        this.elements.regionField = this.div.querySelector(`input#${this.prefix}RegionField`);
        this.elements.goButton = this.div.querySelector(`div#${this.prefix}GoButton`);

        this.elements.regionHistoryMenu = this.div.querySelector(`ul#${this.prefix}RegionHistoryMenu`);
        this.elements.regionHistoryButton = this.div.querySelector(`div#${this.prefix}RegionHistoryButton`);

        this.elements.moveFurtherLeftButton = this.div.querySelector(`div#${this.prefix}MoveFurtherLeftButton`);
        this.elements.moveFurtherRightButton = this.div.querySelector(`div#${this.prefix}MoveFurtherRightButton`);
        this.elements.moveLeftButton = this.div.querySelector(`div#${this.prefix}MoveLeftButton`);
        this.elements.moveRightButton = this.div.querySelector(`div#${this.prefix}MoveRightButton`);

        this.elements.autoheightButton = this.div.querySelector(`input#${this.prefix}AutoheightButton`);

        this.elements.searchField = this.div.querySelector(`input#${this.prefix}SearchField`);
        this.elements.searchButton = this.div.querySelector(`div#${this.prefix}SearchButton`);
        this.elements.searchDataList = this.div.querySelector(`datalist#${this.prefix}SearchDataList`);

        this.elements.speciesButton = this.div.querySelector(`div#${this.prefix}SpeciesButton`);
        this.elements.speciesMenu = this.div.querySelector(`ul#${this.prefix}SpeciesMenu`);
        this.elements.speciesText = this.div.querySelector(`span#${this.prefix}SpeciesText`);

        this.elements.windowSizeField = this.div.querySelector(`input#${this.prefix}WindowSizeField`);

        // let els = this.div.querySelectorAll('[id]');
        // for (let i = 0; i < els.length; i++) {
        //     let elid = els[i].getAttribute('id');
        //     if (elid) {
        //         this.els[elid] = els[i];
        //     }
        // }

        // Hide components using config.componentsConfig field
        // for (let key in this.componentsConfig) {
        //     if (!this.componentsConfig[key]) {
        //         this.els[key].classList.add('hidden');
        //     }
        // }

        this.elements.karyotypeButton.checked = !this.config.karyotypePanelConfig?.hidden;
        this.elements.chromosomeButton.checked = !this.config.chromosomePanelConfig?.hidden;
        this.elements.regionButton.checked = !this.config.regionPanelConfig?.hidden;

        this.target.appendChild(this.div);
    }

    // Initialize events
    #initEvents() {
        this.elements.menuButton.addEventListener("click", event => {
            this.trigger("menuButton:click", {
                clickEvent: event,
                sender: {},
            });
        });

        this.elements.leftSideButton.addEventListener("click", event => {
            this.trigger("leftSideButton:click", {
                clickEvent: event,
                sender: {},
            });
        });

        this.elements.restoreDefaultRegionButton.addEventListener("click", event => {
            this.trigger("restoreDefaultRegion:click", {
                clickEvent: event,
                sender: {},
            });
        });

        this.#addRegionHistoryMenuItem(this.region);
        this.#setChromosomeMenu();
        this.#setSpeciesMenu();

        this.elements.chromosomesText.textContent = this.region.chromosome;
        this.elements.speciesText.textContent = this.config.species?.scientificName || "-";

        this.elements.karyotypeButton.addEventListener("click", event => {
            this.trigger("karyotype-button:change", {
                selected: event.target.checked,
                sender: this,
            });
        });
        this.elements.chromosomeButton.addEventListener("click", event => {
            this.trigger("chromosome-button:change", {
                selected: event.target.checked,
                sender: this,
            });
        });
        this.elements.regionButton.addEventListener("click", event => {
            this.trigger("region-button:change", {
                selected: event.target.checked,
                sender: this,
            });
        });

        // Zooming events
        this.elements.zoomOutButton.addEventListener("click", () => this.#handleZoomOutButton());
        this.elements.zoomInButton.addEventListener("click", () => this.#handleZoomInButton());
        this.elements.zoomMaxButton.addEventListener("click", () => this.#handleZoomSlider(100));
        this.elements.zoomMinButton.addEventListener("click", () => this.#handleZoomSlider(0));

        const zoomBarMove = event => {
            const width = window.getComputedStyle(this.elements.progressBarCont).width;
            const left = this.elements.progressBarCont.getBoundingClientRect().left;
            const zoom = 100 / parseInt(width) * (event.clientX - left);
            if (zoom > 0 && zoom < 100) {
                this.elements.progressBarBall.style.left = `${zoom}%`;
            }
        };

        this.elements.progressBarCont.addEventListener("click", event => {
            const width = window.getComputedStyle(this.elements.progressBarCont).width;
            const left = this.elements.progressBarCont.getBoundingClientRect().left;
            const zoom = 100 / parseInt(width) * (event.clientX - left);
            this.#handleZoomSlider(zoom);

            this.elements.progressBarCont.removeEventListener("mousemove", zoomBarMove);
        });
        this.elements.progressBarBall.addEventListener("mousedown", () => {
            this.elements.progressBarCont.addEventListener("mousemove", zoomBarMove);
        });
        this.elements.progressBarBall.addEventListener("mouseleave", () => {
            this.elements.progressBarCont.removeEventListener("mousemove", zoomBarMove);
            this.elements.progressBarBall.style.left = `${this.zoom}%`;
        });

        this.elements.regionField.value = this.region.toString();
        this.elements.regionField.addEventListener("keyup", event => {
            const value = event.target.value;
            if (value && this.#checkRegion(value) && event.which === 13) {
                this.#triggerRegionChange({
                    region: new Region(value),
                    sender: event.target,
                });
            }
        });
        this.elements.goButton.addEventListener("click", event => {
            const value = this.elements.regionField.value;
            if (this.#checkRegion(value)) {
                this.#triggerRegionChange({
                    region: new Region(value),
                    sender: event.target,
                });
            }
        });

        this.elements.moveFurtherLeftButton.addEventListener("click", () => this.#handleMoveRegion(10));
        this.elements.moveFurtherRightButton.addEventListener("click", () => this.#handleMoveRegion(-10));

        this.elements.moveLeftButton.addEventListener("click", () => this.#handleMoveRegion(1));
        this.elements.moveRightButton.addEventListener("click", () => this.#handleMoveRegion(-1));

        this.elements.autoheightButton.addEventListener("click", event => {
            this.trigger("autoHeight-button:change", {
                selected: event.target.checked,
                sender: this,
            });
        });

        let lastQuery = "";
        this.elements.searchField.addEventListener("keyup", event => {
            event.target.classList.remove("error");
            const query = event.target.value || "";
            if (query.length > 2 && lastQuery !== query && event.which !== 13) {
                this.#setQuickSearchMenu(query);
                lastQuery = query;
            }
            if (event.which === 13) {
                if (query && this.quickSearchDataset[query]) {
                    this.trigger("quickSearch:select", {
                        item: this.quickSearchDataset[query],
                        sender: this,
                    });
                } else {
                    event.target.classList.add("error");
                }
            }
        });

        this.elements.searchButton.addEventListener("click", () => {
            this.elements.searchField.classList.remove("error");
            const query = this.elements.searchField.value || "";
            if (query && this.quickSearchDataset[query]) {
                this.trigger("quickSearch:go", {
                    item: this.quickSearchDataset[query],
                    sender: this,
                });
            } else {
                this.elements.searchField.classList.add("error");
            }
        });

        this.elements.windowSizeField.value = this.region.length();
        this.elements.windowSizeField.addEventListener("keyup", event => {
            const value = event.target.value || "";
            if ((/^([0-9])+$/).test(value)) {
                event.target.classList.remove("error");
                if (event.which === 13) {
                    const regionSize = parseInt(value);
                    const haflRegionSize = Math.floor(regionSize / 2);
                    this.#triggerRegionChange({
                        region: new Region({
                            chromosome: this.region.chromosome,
                            start: this.region.center() - haflRegionSize,
                            end: this.region.center() + haflRegionSize,
                        }),
                        sender: this,
                    });
                }
            } else {
                event.target.classList.add("error");
            }
        });
    }

    draw() {
        // Nothing to do
    }

    #addRegionHistoryMenuItem(region) {
        const menuEntry = document.createElement("li");
        menuEntry.textContent = region.toString();
        menuEntry.addEventListener("click", event => {
            this.#triggerRegionChange({
                region: new Region(event.target.textContent),
                sender: this,
            });
        });

        this.elements.regionHistoryMenu.appendChild(menuEntry);
    }

    #setQuickSearchMenu(query) {
        if (typeof this.config.quickSearchResultFn === "function") {
            while (this.elements.searchDataList.firstChild) {
                this.elements.searchDataList.removeChild(this.elements.searchDataList.firstChild);
            }

            this.quickSearchDataset = {};
            this.config.quickSearchResultFn(query).then(data => {
                (data.response[0].result || []).forEach(item => {
                    const menuEntry = document.createElement("option");
                    menuEntry.setAttribute("value", item.name);
                    this.elements.searchDataList.appendChild(menuEntry);
                    this.quickSearchDataset[item.name] = item;
                });
            });
        } else {
            console.warn("the quickSearchResultFn function is not valid");
        }
    }

    #setChromosomeMenu() {

        while (this.elements.chromosomesMenu.firstChild) {
            this.elements.chromosomesMenu.removeChild(this.elements.chromosomesMenu.firstChild);
        }

        this.currentChromosomesList = Object.keys(this.config.species?.chromosomes || {}).map(name => {
            // const chr = this.confif.species.chromosomes[name];
            const menuEntry = document.createElement("li");
            menuEntry.textContent = name;
            menuEntry.addEventListener("click", event => {
                return this.#triggerRegionChange({
                    region: new Region({
                        chromosome: event.target.textContent,
                        start: this.region.start,
                        end: this.region.end,
                    }),
                    sender: this,
                });
            });
            this.elements.chromosomesMenu.appendChild(menuEntry);

            return name;
        });
    }

    #setSpeciesMenu() {
        const createSpeciesEntry = (species, parent) => {
            const menuEntry = document.createElement("li");
            menuEntry.textContent = `${species.scientificName} (${species.assembly.name})`;
            menuEntry.addEventListener("click", () => {
                this.trigger("species:change", {
                    species: species,
                    sender: this,
                });
            });

            // Append specie
            parent.appendChild(menuEntry);
        };

        const createTaxonomy = taxonomy => {
            const menuEntry = document.createElement("li");
            const menuList = document.createElement("ul");
            menuEntry.setAttribute("data-sub", true);
            menuEntry.textContent = taxonomy;
            menuEntry.appendChild(menuList);

            this.elements.speciesMenu.appendChild(menuEntry);

            return menuList;
        };

        // Generate species list
        Object.keys(this.config.availableSpecies || {}).forEach(taxonomyName => {
            const taxonomyList = createTaxonomy(taxonomyName);
            this.config.availableSpecies[taxonomyName].forEach(species => {
                createSpeciesEntry(species, taxonomyList);
            });
        });
    }

    #checkRegion(value) {
        const region = new Region(value);
        if (!region.parse(value) || region.start < 0 || region.end < 0 || this.currentChromosomesList.indexOf(region.chromosome) === -1) {
            this.elements.regionField.classList.add("error");
            return false;
        } else {
            this.elements.regionField.classList.remove("error");
            return true;
        }
    }

    #handleZoomSlider(value) {
        if (!this.zoomChanging) {
            this.zoomChanging = true;
            this.zoom = 5 * (Math.round(value / 5));

            this.trigger("zoom:change", {
                zoom: this.zoom,
                sender: this,
            });

            // TODO: review this hack...
            setTimeout(() => {
                this.zoomChanging = false;
            }, 700);
        }
    }

    #handleZoomOutButton() {
        this.#handleZoomSlider(Math.max(0, this.zoom - 5));
    }

    #handleZoomInButton() {
        this.#handleZoomSlider(Math.min(100, this.zoom + 5));
    }

    #handleMoveRegion(positions) {
        // const pixelBase = (this.width - this.svgCanvasWidthOffset) / this.region.length();
        const pixelBase = (this.config.width - this.config.svgCanvasWidthOffset) / this.region.length();
        const disp = Math.round((positions * 10) / pixelBase);

        this.region.start -= disp;
        this.region.end -= disp;
        this.elements.regionField.value = this.region.toString();

        // Trigger region move
        this.trigger("region:move", {
            region: this.region,
            disp: disp,
            sender: this,
        });
    }

    setVisible(obj) {
        const els = this.elements;
        Object.keys(obj).forEach(key => {
            obj[key] ? els[key].classList.remove("hidden") : els[key].classList.add("hidden");
        });
    }

    setRegion(region, zoom) {
        this.region.load(region);
        if (zoom) {
            this.zoom = 5 * (Math.round(zoom / 5));
        }
        this.updateRegionControls();
        this.#addRegionHistoryMenuItem(region);
    }

    moveRegion(region) {
        this.region.load(region);
        this.elements.chromosomesText.textContent = this.region.chromosome;
        this.elements.regionField.value = this.region.toString();
    }

    setSpecies(species) {
        this.species = species;
        this.elements.speciesText.textContent = this.species.scientificName;
        this.#setChromosomeMenu();
    }

    setWidth(width) {
        this.width = width;
    }

    #triggerRegionChange(event) {
        if (!this.regionChanging) {
            this.regionChanging = true;
            this.trigger("region:change", event);

            // TODO: review this hack...
            setTimeout(() => {
                this.regionChanging = false;
            }, 700);
        } else {
            this.updateRegionControls();
        }
    }

    updateRegionControls() {
        this.elements.chromosomesText.textContent = this.region.chromosome;
        this.elements.regionField.value = this.region.toString();
        this.elements.windowSizeField.value = this.region.length();
        this.elements.regionField.classList.remove("error");
        this.elements.progressBar.style.width = this.zoom + "%";
        this.elements.progressBarBall.style.left = this.zoom + "%";
    }

    setCellBaseHost(host) {
        this.cellBaseHost = host;
    }

    // Get default config for navigation bar
    getDefaultConfig() {
        return {
            species: "Homo sapiens",
            increment: 3,
            componentsConfig: {
                menuButton: false,
                leftSideButton: false,
                restoreDefaultRegionButton: true,
                regionHistoryButton: true,
                speciesButton: true,
                chromosomesButton: true,
                karyotypeButtonLabel: true,
                chromosomeButtonLabel: true,
                regionButtonLabel: true,
                zoomControl: true,
                windowSizeControl: true,
                positionControl: true,
                moveControl: true,
                autoheightButton: true,
                compactButton: true,
                searchControl: true
            },
            region: null,
            quickSearchDisplayKey: "name",
            zoom: 50,
            width: 1,
            svgCanvasWidthOffset: 0,
            availableSpecies: [],
        };
    }

}
