// Mock API URL (JSONPlaceholder or any mock endpoint)
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Load quotes from localStorage or fallback
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Do what you can, with what you have, where you are.", category: "Motivation" }
];

let lastSelectedCategory = localStorage.getItem("selectedCategory") || "all";

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
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

// Add new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    const newQuote = { text, category };

    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    alert("Quote added successfully!");

    // Sync with server after adding
    syncQuotes(newQuote);

    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both a quote and a category!");
  }
}

// Create Add Quote Form
function createAddQuoteForm() {
  const container = document.getElementById("addQuoteContainer");
  container.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;
  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
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
      alert("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file!");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Fetch quotes from server (mock GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(API_URL);
    const serverData = await response.json();

    // Simulate server quotes
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    handleServerData(serverQuotes);
  } catch (err) {
    console.error("Error fetching from server:", err);
  }
}

// Sync quotes with server (POST new ones)
async function syncQuotes(newQuote = null) {
  if (newQuote) {
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(newQuote),
        headers: { "Content-Type": "application/json; charset=UTF-8" }
      });

      console.log("Quote synced:", newQuote);

      // Show UI notification for sync success
      const notification = document.getElementById("notification");
      notification.innerText = " Quotes synced with server!";
      setTimeout(() => (notification.innerText = ""), 4000);

    } catch (err) {
      console.error("Error posting to server:", err);
    }
  }

  // Also pull latest from server
  fetchQuotesFromServer();
}

// Handle server data with conflict resolution
function handleServerData(serverQuotes) {
  let conflict = false;

  serverQuotes.forEach(sq => {
    const exists = quotes.some(lq => lq.text === sq.text);
    if (!exists) {
      quotes.push(sq);
      conflict = true;
    }
  });

  if (conflict) {
    saveQuotes();
    populateCategories();
    const notification = document.getElementById("notification");
    notification.innerText = "⚠️ New quotes fetched from server. Local storage updated.";
    setTimeout(() => (notification.innerText = ""), 4000);
  }
}

// Periodic sync every 30 seconds
setInterval(fetchQuotesFromServer, 30000);

// --- Initialize ---
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
createAddQuoteForm();
populateCategories();
filterQuotes();
fetchQuotesFromServer();
