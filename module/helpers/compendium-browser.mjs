export class CompendiumBrowser extends Application {
    constructor(options = {}) {
        super(options);
        this.items = {
            paths: [],
            origins: [],
            items: [],
            traits: [],
            perks: [],
            tags: [],
            adversaries: [],
            adversaryTraits: []
        };
        this.filters = {
            paths: ["Basic", "Arcane", "Physical"],
            traits: ["Path", "Ancestry", "Other"],
            items: ["Accessory", "Armor", "Consumable", "Core", "Item", "Shield", "Weapon", "Other"],
            rarity: ["★", "★★", "★★★", "★★★★", "★★★★★", "★★★★★★"],
            tags: ["Positive", "Negative"],
            adversaryTraits: ["Positive", "Negative", "Form", "Basic", "Rearguard"],
            source: []
        };
        this.activeFilters = {
            paths: new Set(),
            traits: new Set(),
            items: new Set(),
            rarity: new Set(),
            tags: new Set(),
            adversaryTraits: new Set(),
            source: new Set(),
        };
        this.searchQuery = "";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "compendium-browser",
            title: "Compendium Browser",
            template: "systems/storyforge/templates/compendium-browser/compendium-browser.hbs",
            width: 650,
            height: 600,
            classes: ['storyforge', 'sheet', 'compendium-browser', 'actorV2'],
            tabs: [
                {
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-main',
                group: 'primary',
                initial: 'paths',
                },
            ],
            dragDrop: [{dragSelector: 'compemdium-item', dropSelector: ".compendium-browser"}]
        });
    }

    async getData() {
        if (!this.itemsLoaded) {
            await this._loadCompendiumItems();
            this.itemsLoaded = true;
        }
        this._applyFiltersAndSearch();
        return { 
            items: this.filteredItems,
            filters: this.filters,
            activeFilters: this.activeFilters,
            searchQuery: this.searchQuery,
            isGM: game.user.isGM
        };
    }

    async _loadCompendiumItems() {
        this.items = {
            paths: [],
            origins: [],
            items: [],
            traits: [],
            perks: [],
            tags: [],
            adversaries: [],
            adversaryTraits: []
        };

        const sources = new Set(); // Collect unique sources

        for (const pack of game.packs) {

            const content = await pack.getDocuments();
            for (const doc of content) {
                if (doc instanceof Item) {
                    if (doc.system.bookSource) {
                        sources.add(doc.system.bookSource);
                    }
                    switch (doc.type) {
                        case "path": this.items.paths.push(doc); break;
                        case "origin": this.items.origins.push(doc); break;
                        case "item": this.items.items.push(doc); break;
                        case "trait": 
                            if (doc.system.type === "Adversary"){
                                this.items.adversaryTraits.push(doc);
                            } else {
                                this.items.traits.push(doc);
                            }  
                            break;
                        case "perk": this.items.perks.push(doc); break;
                        case "tag": 
                            if (doc.system.type === "Core"){
                                this.items.items.push(doc);
                            } else {
                                this.items.tags.push(doc);
                            }  
                            break;
                    }
                } else if (doc instanceof Actor && doc.type === "npc") {
                    if (doc.system.bookSource) {
                        sources.add(doc.system.bookSource);
                    }
                    this.items.adversaries.push(doc);
                }
            }
        }

        // Sort sources: "SFHB" first, then alphabetical order
        this.filters.source = Array.from(sources).sort((a, b) => {
            if (a === "SFHB") return -1;
            if (b === "SFHB") return 1;
            return a.localeCompare(b);
        });
        this._sortItems();
    }

    _sortItems() {
        for (let key in this.items) {
            this.items[key].sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    _applyFiltersAndSearch() {
        this.filteredItems = deepClone(this.items);

        // Apply Trait Filters
        if (this.activeFilters.paths.size > 0) {
            this.filteredItems.paths = this.filteredItems.paths.filter(item =>
                this.activeFilters.paths.has(item.system.type)
            );
        }
    
        // Apply Trait Filters
        if (this.activeFilters.traits.size > 0) {
            this.filteredItems.traits = this.filteredItems.traits.filter(item =>
                this.activeFilters.traits.has(item.system.type)
            );
        }
    
        // Apply Item Filters
        if (this.activeFilters.items.size > 0) {
            this.filteredItems.items = this.filteredItems.items.filter(item =>
                this.activeFilters.items.has(item.system.type)
            );
        }

        // Apply Item Rarity Filters
        if (this.activeFilters.rarity.size > 0) {
            this.filteredItems.items = this.filteredItems.items.filter(item =>
                this.activeFilters.rarity.has(item.system.rarity)
            );
        }

        // Apply Adversary Traits Filters
        if (this.activeFilters.adversaryTraits.size > 0) {
            this.filteredItems.adversaryTraits = this.filteredItems.adversaryTraits.filter(item =>
                this.activeFilters.adversaryTraits.has(item.system.source)
            );
        }

        // Apply Tag Filters
        if (this.activeFilters.tags.size > 0) {
            this.filteredItems.tags = this.filteredItems.tags.filter(item => {
                const mod = item.system?.mod ?? 0;
                return (
                    (this.activeFilters.tags.has("Positive") && mod > 0) ||
                    (this.activeFilters.tags.has("Negative") && mod < 0)
                );
            });
        }

        // Apply Source Filters
        if (this.activeFilters.source.size > 0) {
            for (let key in this.filteredItems) {
                this.filteredItems[key] = this.filteredItems[key].filter(item =>
                    this.activeFilters.source.has(item.system.bookSource)
                );
            }
        }
    
        // Apply Search Query
        if (this.searchQuery) {
            for (let key in this.filteredItems) {
                this.filteredItems[key] = this.filteredItems[key].filter(item =>
                    item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
        }
    }
    

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".compendium-item").on("click", this._onEntryClick.bind(this));
        html.find(".filter-checkbox").on("change", this._onFilterChange.bind(this));
        html.find(".search-input").on("change", this._onSearchChange.bind(this));

        // Prevent Enter from refreshing Foundry
        html.find(".search-input").on("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default Enter behavior
                event.stopPropagation(); // Stop event from bubbling
            }
        });

        // Enable Dragging for Compendium Items
        html.find(".compendium-item").each((_, item) => {
            item.setAttribute("draggable", true);
            item.addEventListener("dragstart", this._onDragStart.bind(this));
        });
    }

    _onEntryClick(event) {
        console.log("TRIGGERED", event)
        const li = $(event.currentTarget);
        const item = li.data("item");
        const uuid = li.data("itemId");
        console.log(item, uuid)
        fromUuid(uuid).then(doc => doc?.sheet?.render(true));
    }

    _onFilterChange(event) {
        const checkbox = event.currentTarget;
        const category = checkbox.dataset.category;
        const value = checkbox.value;
    
        if (checkbox.checked) {
            this.activeFilters[category].add(value);
        } else {
            this.activeFilters[category].delete(value);
        }
    
        console.log("Active Filters:", this.activeFilters); // Debugging output
    
        this._applyFiltersAndSearch();
        this.render(false);
    }
    

    _onSearchChange(event) {
        event.preventDefault(); // Prevent form submission
        event.stopPropagation(); // Stop the event from bubbling up
        this.searchQuery = event.currentTarget.value;
        this.render(false);
        event.currentTarget.focus(); // Keep focus on the input field

        // Preserve search bar focus after rendering
        setTimeout(() => {
            const searchInput = document.querySelector(".search-input");
            if (searchInput) {
                searchInput.focus();
                searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
            }
        }, 0);
    }

    _onDragStart(event) {
        const li = event.currentTarget;
        const itemId = li.dataset.itemId;
        if (!itemId) return;
    
        // Retrieve the Item document
        fromUuid(itemId).then((doc) => {
            if (!doc) return;
            
            const dragData = {
                type: doc.documentName, // Can be 'Item', 'Actor', etc.
                uuid: doc.uuid
            };
    
            event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        });
    }
}

Hooks.on("renderCompendiumDirectory", (app, html) => {
    const header = html.find(".directory-header .header-actions");
    if (header.length === 0) return; // Ensure header actions exist

    // Check if button already exists to prevent duplicates
    if (header.find(".compendium-browser-btn").length === 0) {
        const button = $(`
            <button class="compendium-browser-btn">
                <i class="fas fa-book"></i> Compendium Browser
            </button>
        `);

        button.on("click", () => game.storyforge.compendiumBrowser.render(true));
        header.append(button);
    }
});

Handlebars.registerHelper("includes", function(set, value) {
    return set && set.has(value);
});