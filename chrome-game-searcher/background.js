chrome.runtime.onInstalled.addListener((details) => {
    const defaultSearches = [
        { id: "metacritic", name: "Metacritic", url: "https://www.metacritic.com/search/{query}/?category=13", replaceSpaces: false },
        { id: "eneba", name: "Eneba", url: "https://www.eneba.com/store?text={query}", replaceSpaces: false },
        { id: "steam", name: "Steam", url: "https://store.steampowered.com/search/?term={query}", replaceSpaces: false },
        { id: "dlcompare", name: "DLCompare", url: "https://www.dlcompare.es/search?q={query}", replaceSpaces: true },
        { id: "youtube", name: "YouTube", url: "https://www.youtube.com/results?search_query={query}", replaceSpaces: false }
    ];

    chrome.storage.sync.get("searches", (data) => {
        let searches = data.searches || [];

        // Update existing searches to ensure they have IDs
        searches = searches.map(search => {
            if (!search.id) {
                // Try to match with a default search
                const defaultSearch = defaultSearches.find(ds => ds.name === search.name);
                if (defaultSearch) {
                    return { ...search, id: defaultSearch.id, replaceSpaces: search.replaceSpaces !== undefined ? search.replaceSpaces : defaultSearch.replaceSpaces };
                }
                // Generate a custom ID if no match found
                return { ...search, id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
            }

            // Update replaceSpaces if missing
            const defaultSearch = defaultSearches.find(ds => ds.id === search.id || ds.name === search.name);
            if (defaultSearch && search.replaceSpaces === undefined) {
                return { ...search, replaceSpaces: defaultSearch.replaceSpaces };
            }
            return search;
        });

        // Add missing default searches
        defaultSearches.forEach((defaultSearch) => {
            if (!searches.some((search) => search.id === defaultSearch.id)) {
                searches.push(defaultSearch);
            }
        });

        chrome.storage.sync.set({ searches }, updateContextMenu);
    });
});

const updateContextMenu = () => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "checkGame",
            title: "Check game",
            contexts: ["selection"]
        });

        chrome.storage.sync.get("searches", (data) => {
            let searches = data.searches || [];
            let needsUpdate = false;

            // Ensure each search has a unique ID and save it
            searches = searches.map((search, index) => {
                if (!search.id) {
                    needsUpdate = true;
                    return { ...search, id: `search_${index}_${Date.now()}` };
                }
                return search;
            });

            // Update storage if any search was missing an ID
            if (needsUpdate) {
                chrome.storage.sync.set({ searches });
            }

            searches.forEach((search) => {
                chrome.contextMenus.create({
                    id: search.id,
                    parentId: "checkGame",
                    title: search.name,
                    contexts: ["selection"]
                });
            });
        });
    });
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkGame") return; // Ignore parent menu clicks

    console.log("Menu clicked:", info.menuItemId);

    chrome.storage.sync.get("searches", (data) => {
        const searches = data.searches || [];
        console.log("Available searches:", searches.map(s => ({ id: s.id, name: s.name })));

        const search = searches.find((s) => s.id === info.menuItemId);

        console.log("Found search:", search);

        if (search) {
            let query = encodeURIComponent(info.selectionText);
            if (search.replaceSpaces) {
                query = query.replace(/%20/g, "+");
            }
            const url = search.url.replace("{query}", query);
            console.log("Opening URL:", url);
            chrome.tabs.create({ url, index: tab.index + 1 });
        } else {
            console.error("Search not found for menuItemId:", info.menuItemId);
        }
    });
});