// Load quotes from localStorage or fallback default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Do what you can, with what you have, where you are.", category: "Motivation" }
];

// Last selected category
let lastSelectedCategory = localStorage.getItem("selectedCategory") || "all";

// Fake server URL (JSONPlaceholder simulation)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Replace with real API if available

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = type;
  notification.style.display = "block";
  setTimeout(() => (notification.style.display = "none"), 3000);
}

// Show random quote
function showRandomQuote() {
  let category = document.getElementById("categoryFilter").value;
  let filteredQuotes = (category === "all") ? quotes : quotes.filter(q => q.category === category);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerText = "No quotes in this category.";
    return;
  }

  const random = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  document.getElementById("quoteDisplay").innerText = `"${random.text}" — [${random.category}]`;
}

// Add new quote (and sync to server)
async function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    const newQuote = { text, category };

    quotes.push(newQuote);
    saveQuotes();
    populateCategories();

    // Push to server
    try {
      await fetch(SERVER_URL, {
        method: "POST",
        body: JSON.stringify(newQuote),
        headers: { "Content-Type": "application/json" }
      });
      showNotification("Quote added and synced to server!", "success");
    } catch {
      showNotification("Quote saved locally but failed to sync to server.", "error");
    }

    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    showNotification("Please enter both a quote and a category!", "error");
  }
}

// Populate category dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === lastSelectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  lastSelectedCategory = selectedCategory;
  showRandomQuote();
}

// Export quotes
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      showNotification("Quotes imported successfully!", "success");
    } catch {
      showNotification("Invalid JSON file!", "error");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ---------------- Server Sync ----------------
async function syncWithServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    // Map server data to quote format
    const serverQuotes = serverData.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    // Conflict resolution: server overwrites local duplicates
    const localTexts = new Set(quotes.map(q => q.text));
    const merged = [...quotes, ...serverQuotes.filter(q => !localTexts.has(q.text))];

    if (merged.length !== quotes.length) {
      quotes = merged;
      saveQuotes();
      populateCategories();
      showNotification("Quotes synced with server (server data took precedence).", "info");
    }
  } catch {
    showNotification("Failed to sync with server.", "error");
  }
}

// Auto-sync every 15 seconds
setInterval(syncWithServer, 15000);

// ---------------- Init ----------------
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
populateCategories();
filterQuotes();
syncWithServer(); // initial sync
