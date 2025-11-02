document.addEventListener("DOMContentLoaded", () => {
    const searchList = document.getElementById("search-list");
    const addSearchForm = document.getElementById("add-search-form");
    const restoreDefaultsButton = document.getElementById("restore-defaults");

    const defaultSearches = [
        { id: "metacritic", name: "Metacritic", url: "https://www.metacritic.com/search/all/{query}/results", replaceSpaces: false },
        { id: "eneba", name: "Eneba", url: "https://www.eneba.com/store?text={query}", replaceSpaces: false },
        { id: "steam", name: "Steam", url: "https://store.steampowered.com/search/?term={query}", replaceSpaces: false },
        { id: "dlcompare", name: "DLCompare", url: "https://www.dlcompare.es/search?q={query}", replaceSpaces: true },
        { id: "youtube", name: "YouTube", url: "https://www.youtube.com/results?search_query={query}", replaceSpaces: false }
    ];

    const loadSearches = () => {
        chrome.storage.sync.get("searches", (data) => {
            const searches = data.searches || [];
            searchList.innerHTML = "";
            searches.forEach((search, index) => {
                const div = document.createElement("div");
                div.className = "search-item";
                div.dataset.index = index;

                div.innerHTML = `
                    <div class="search-content">
                        <div class="search-info">
                            <div class="search-name">${search.name}</div>
                            <div class="search-url">${search.url}</div>
                            ${search.replaceSpaces ? '<span class="search-badge">Replaces spaces</span>' : ''}
                        </div>
                        <div class="search-actions">
                            <button data-index="${index}" class="btn btn-icon btn-ghost edit-btn" aria-label="Edit search">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                            </button>
                            <button data-index="${index}" class="btn btn-icon btn-ghost delete delete-btn" aria-label="Delete search">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="edit-form">
                        <div class="form-group">
                            <input type="text" class="edit-name" value="${search.name}" placeholder="Search name">
                        </div>
                        <div class="form-group">
                            <input type="text" class="edit-url" value="${search.url}" placeholder="Search URL">
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" class="edit-replace" ${search.replaceSpaces ? 'checked' : ''}>
                                Replace spaces with "+"
                            </label>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-success save-btn" style="flex: 1;">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Save
                            </button>
                            <button class="btn btn-outline cancel-btn" style="flex: 1;">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Cancel
                            </button>
                        </div>
                    </div>
                `;
                searchList.appendChild(div);
            });

            // Edit button handlers
            document.querySelectorAll(".edit-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const index = e.target.closest('button').dataset.index;
                    const searchItem = document.querySelector(`.search-item[data-index="${index}"]`);
                    const editForm = searchItem.querySelector('.edit-form');
                    const searchContent = searchItem.querySelector('.search-content');

                    // Close any other open edit forms
                    document.querySelectorAll('.edit-form.active').forEach(form => {
                        form.classList.remove('active');
                        form.closest('.search-item').querySelector('.search-content').style.display = 'flex';
                        form.closest('.search-item').classList.remove('editing');
                    });

                    // Show edit form
                    searchContent.style.display = 'none';
                    editForm.classList.add('active');
                    searchItem.classList.add('editing');
                });
            });

            // Save button handlers
            document.querySelectorAll(".save-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const searchItem = e.target.closest('.search-item');
                    const index = searchItem.dataset.index;
                    const newName = searchItem.querySelector('.edit-name').value;
                    const newUrl = searchItem.querySelector('.edit-url').value;
                    const replaceSpaces = searchItem.querySelector('.edit-replace').checked;

                    if (newName && newUrl) {
                        // Preserve the ID if it exists
                        const existingId = searches[index].id;
                        searches[index] = {
                            id: existingId || `custom_${Date.now()}`,
                            name: newName,
                            url: newUrl,
                            replaceSpaces
                        };
                        chrome.storage.sync.set({ searches }, loadSearches);
                    }
                });
            });

            // Cancel button handlers
            document.querySelectorAll(".cancel-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const searchItem = e.target.closest('.search-item');
                    const editForm = searchItem.querySelector('.edit-form');
                    const searchContent = searchItem.querySelector('.search-content');

                    editForm.classList.remove('active');
                    searchContent.style.display = 'flex';
                    searchItem.classList.remove('editing');
                });
            });

            // Delete button handlers
            document.querySelectorAll(".delete-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const index = e.target.closest('button').dataset.index;
                    searches.splice(index, 1);
                    chrome.storage.sync.set({ searches }, loadSearches);
                });
            });
        });
    };

    addSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("search-name").value;
        const url = document.getElementById("search-url").value;
        const replaceSpaces = document.getElementById("replace-spaces").checked;
        chrome.storage.sync.get("searches", (data) => {
            const searches = data.searches || [];
            // Generate a unique ID for the new search
            const newSearch = {
                id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                url,
                replaceSpaces
            };
            searches.push(newSearch);
            chrome.storage.sync.set({ searches }, () => {
                addSearchForm.reset();
                loadSearches();
            });
        });
    });

    restoreDefaultsButton.addEventListener("click", () => {
        chrome.storage.sync.get("searches", (data) => {
            const searches = data.searches || [];
            defaultSearches.forEach((defaultSearch) => {
                if (!searches.some((search) => search.name === defaultSearch.name)) {
                    searches.push(defaultSearch);
                }
            });
            chrome.storage.sync.set({ searches }, loadSearches);
        });
    });

    loadSearches();
});