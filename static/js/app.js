// Vanilla JavaScript for QuoteVault Application
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Hero
  const quoteCard = document.getElementById('quoteCard');
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const quoteCategory = document.getElementById('quoteCategory');
  const newQuoteBtn = document.getElementById('newQuoteBtn');
  const copyBtn = document.getElementById('copyBtn');
  const copyTooltip = document.getElementById('copyTooltip');

  // DOM Elements - Search & Filters
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const quotesGrid = document.getElementById('quotesGrid');
  const emptyState = document.getElementById('emptyState');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  let currentHeroQuote = null;
  let searchDebounceTimeout = null;

  // Initialize
  initApp();

  async function initApp() {
    await loadCategories();
    await fetchRandomQuote();
    await searchQuotes('', 'all');
    setupEventListeners();
  }

  // 1. Fetch categories for dropdown
  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to load categories');
      const categories = await response.json();

      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.toLowerCase();
        option.textContent = cat;
        categoryFilter.appendChild(option);
      });
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  // 2. Fetch random quote
  async function fetchRandomQuote(category = '') {
    try {
      quoteCard.classList.add('animating');

      let url = '/api/quotes/random';
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch quote');
      const data = await response.json();

      setTimeout(() => {
        currentHeroQuote = data;
        quoteText.textContent = data.quote;
        quoteAuthor.textContent = `— ${data.author}`;
        quoteCategory.textContent = data.category;
        quoteCard.classList.remove('animating');
      }, 150);
    } catch (err) {
      console.error('Error fetching random quote:', err);
      quoteCard.classList.remove('animating');
    }
  }

  // 3. Search and filter quotes
  async function searchQuotes(query = '', category = 'all') {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('search', query.trim());
      if (category && category !== 'all') params.append('category', category);

      const url = `/api/quotes?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to search quotes');
      const data = await response.json();

      renderQuotesGrid(data.quotes, query, category);
    } catch (err) {
      console.error('Error searching quotes:', err);
    }
  }

  // 4. Render quotes grid
  function renderQuotesGrid(quotes, query, category) {
    quotesGrid.innerHTML = '';
    const total = quotes.length;

    // Update headers
    resultsCount.textContent = `${total} ${total === 1 ? 'quote' : 'quotes'}`;
    if (query) {
      resultsTitle.textContent = `Results for "${query}"`;
    } else if (category && category !== 'all') {
      const catName = category.charAt(0).toUpperCase() + category.slice(1);
      resultsTitle.textContent = `${catName} Quotes`;
    } else {
      resultsTitle.textContent = 'All Quotes';
    }

    if (total === 0) {
      quotesGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    quotesGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    quotes.forEach(quote => {
      const card = document.createElement('div');
      card.className = 'grid-quote-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View quote by ${quote.author}`);

      card.innerHTML = `
        <span class="grid-card-category">${escapeHtml(quote.category)}</span>
        <p class="grid-card-quote">“${escapeHtml(quote.quote)}”</p>
        <cite class="grid-card-author">— ${escapeHtml(quote.author)}</cite>
      `;

      // Clicking a grid card promotes it to the hero card
      card.addEventListener('click', () => {
        promoteToHero(quote);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          promoteToHero(quote);
        }
      });

      quotesGrid.appendChild(card);
    });
  }

  // Promote selected quote to hero display
  function promoteToHero(quote) {
    quoteCard.classList.add('animating');
    setTimeout(() => {
      currentHeroQuote = quote;
      quoteText.textContent = quote.quote;
      quoteAuthor.textContent = `— ${quote.author}`;
      quoteCategory.textContent = quote.category;
      quoteCard.classList.remove('animating');
      quoteCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }

  // Event Listeners
  function setupEventListeners() {
    // New Random Quote button
    newQuoteBtn.addEventListener('click', () => {
      const selectedCategory = categoryFilter.value;
      fetchRandomQuote(selectedCategory);
    });

    // Copy quote to clipboard
    copyBtn.addEventListener('click', () => {
      if (!currentHeroQuote) return;
      const textToCopy = `"${currentHeroQuote.quote}" — ${currentHeroQuote.author}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyTooltip.classList.add('show');
        setTimeout(() => copyTooltip.classList.remove('show'), 1500);
      }).catch(err => {
        console.error('Clipboard copy failed:', err);
      });
    });

    // Search input typing with debounce
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      clearSearchBtn.style.display = query ? 'block' : 'none';

      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        searchQuotes(query, categoryFilter.value);
      }, 250);
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchQuotes('', categoryFilter.value);
      searchInput.focus();
    });

    // Category filter dropdown
    categoryFilter.addEventListener('change', (e) => {
      const cat = e.target.value;
      searchQuotes(searchInput.value, cat);
    });

    // Reset filters
    resetFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      categoryFilter.value = 'all';
      searchQuotes('', 'all');
    });

    // Keyboard shortcut (Space / 'R' for new quote when not focused in input)
    document.addEventListener('keydown', (e) => {
      if (document.activeElement === searchInput) return;
      if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchRandomQuote(categoryFilter.value);
      }
    });
  }

  // Utility to prevent XSS
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
