const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const TAG_METADATA = {
    essential: { label: 'Essential', color: 'tag-essential' },
    housing: { label: 'Housing', color: 'tag-housing' },
    transport: { label: 'Transport', color: 'tag-transport' },
    health: { label: 'Health', color: 'tag-health' },
    lifestyle: { label: 'Lifestyle', color: 'tag-lifestyle' },
    savings: { label: 'Savings', color: 'tag-savings' },
    other: { label: 'Other', color: 'tag-other' }
};

const DEFAULT_DATA = {
    currency: 'BRL',
    taxRate: 27.5,
    budget: [
        { name: 'Rent', value: 3700, tag: 'housing' },
        { name: 'Condo', value: 1450, tag: 'housing' },
        { name: 'Food', value: 1000, tag: 'essential' },
        { name: 'Power', value: 120, tag: 'essential' },
        { name: 'Internet', value: 150, tag: 'essential' },
        { name: 'Cell Phone', value: 50, tag: 'essential' },
        { name: 'Pharmacy', value: 300, tag: 'health' },
        { name: 'Health Insurance', value: 600, tag: 'health' },
        { name: 'Car Insurance', value: 200, tag: 'transport' },
        { name: 'Fuel', value: 200, tag: 'transport' },
        { name: 'Leisure', value: 800, tag: 'lifestyle' },
        { name: 'Subscriptions', value: 150, tag: 'lifestyle' },
        { name: 'Gym', value: 400, tag: 'lifestyle' },
        { name: 'Clothes', value: 200, tag: 'lifestyle' },
        { name: 'Emergency Fund', value: 500, tag: 'savings' },
        { name: 'Desired Savings', value: 4000, tag: 'savings' }
    ]
};
const API_URL = 'https://open.er-api.com/v6/latest/';

let state = JSON.parse(localStorage.getItem('budget_state')) || DEFAULT_DATA;
// Ensure backward compatibility - add default tag to items without one
state.budget = state.budget.map(item => ({ ...item, tag: item.tag || 'other' }));
let exchangeRate = 0.18; // Fallback
let currentFilter = 'all';

const budgetListEl = $('#budgetList');
const detailedListEl = $('#detailedList');
const currencyEl = $('#currency');
const taxRateEl = $('#taxRate');
const totalBudgetEl = $('#totalBudget');
const totalTaxesEl = $('#totalTaxes');
const grossSalaryBaseEl = $('#grossSalaryBase');
const grossSalaryUSDEl = $('#grossSalaryUSD');
const exchangeStatusEl = $('#exchangeStatus');
const currLabels = $$('.curr-label');
const taxRateLabel = $('.tax-rate-label');
const tagFilterEl = $('#tagFilter');
const filteredTotalEl = $('#filteredTotal');
const filteredLabelEl = $('#filteredLabel');
const addExpenseModal = $('#addExpenseModal');
const addExpenseForm = $('#addExpenseForm');
const modalExpenseName = $('#modalExpenseName');
const modalExpenseValue = $('#modalExpenseValue');
const modalExpenseTag = $('#modalExpenseTag');
const cancelModalBtn = $('#cancelModal');

const formatCurrency = (value, currency, digits = 2, language = navigator.language) => {
    return new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value).replace(/(\D+)/, '$1 ');
};

const formatNumber = (value, digits = 2, language = navigator.language) => {
    return new Intl.NumberFormat(language, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value).replace(/(\D+)/, '$1 ');
};

function saveState() {
    localStorage.setItem('budget_state', JSON.stringify(state));
}

async function fetchExchangeRate() {
    try {
        exchangeStatusEl.textContent = `Fetching rate for ${state.currency}...`;
        const res = await fetch(`${API_URL}${state.currency}`);
        const data = await res.json();
        exchangeRate = data.rates.USD;
        exchangeStatusEl.innerHTML = `
          <p>${data.time_last_update_utc.slice(5,25)}</p>
          <p>1 USD = ${formatCurrency(1 / exchangeRate, state.currency, 4)}</p>
        `;
        calculate();
    } catch (err) {
        console.error('Exchange rate fetch failed', err);
        exchangeStatusEl.textContent = 'Using fallback exchange rate (0.18)';
    }
}

function createItemEl(item, index) {
    const template = $('#expense-item-template');
    const clone = template.content.cloneNode(true);
    
    const nameInput = clone.querySelector('.expense-name');
    nameInput.value = item.name;
    nameInput.onchange = (e) => updateItem(index, 'name', e.target.value);
    
    const tagSelect = clone.querySelector('.expense-tag');
    tagSelect.value = item.tag || 'other';
    tagSelect.onchange = (e) => updateItem(index, 'tag', e.target.value);
    
    const valueInput = clone.querySelector('.expense-value');
    valueInput.value = item.value;
    valueInput.onchange = (e) => updateItem(index, 'value', e.target.value);
    
    const removeBtn = clone.querySelector('.remove-item');
    removeBtn.onclick = () => removeItem(index);
    
    return clone;
}

function renderList() {
    budgetListEl.innerHTML = '';
    state.budget.forEach((item, index) => {
        budgetListEl.appendChild(createItemEl(item, index));
    });
    renderDetailedList();
}

function renderDetailedList() {
    const filteredItems = currentFilter === 'all' 
        ? state.budget 
        : state.budget.filter(item => item.tag === currentFilter);
    
    detailedListEl.innerHTML = '';
    
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        const tagMeta = TAG_METADATA[item.tag] || TAG_METADATA.other;
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td><span class="tag ${tagMeta.color}">${tagMeta.label}</span></td>
            <td style="text-align: right;">${formatCurrency(item.value, state.currency)}</td>
        `;
        detailedListEl.appendChild(row);
    });

    // Update filtered total
    const filteredTotal = filteredItems.reduce((acc, item) => acc + (item.value || 0), 0);
    filteredTotalEl.textContent = formatCurrency(filteredTotal, state.currency);
    
    if (currentFilter === 'all') {
        filteredLabelEl.textContent = 'Total (All Categories)';
    } else {
        const tagMeta = TAG_METADATA[currentFilter];
        filteredLabelEl.textContent = `Total (${tagMeta.label})`;
    }
}

window.updateItem = (index, key, val) => {
    if (key === 'value') {
        state.budget[index][key] = parseFloat(val) || 0;
    } else {
        state.budget[index][key] = val;
    }
    saveState();
    if (key === 'value') {
        calculate();
    } else {
        renderDetailedList();
    }
};

window.removeItem = (index) => {
    state.budget.splice(index, 1);
    saveState();
    renderList();
    calculate();
};

// Modal functionality
$('#addItem').onclick = () => {
    addExpenseModal.showModal();
    modalExpenseName.focus();
};

cancelModalBtn.onclick = () => {
    addExpenseModal.close();
    addExpenseForm.reset();
};

addExpenseForm.onsubmit = (e) => {
    e.preventDefault();
    const newExpense = {
        name: modalExpenseName.value,
        value: parseFloat(modalExpenseValue.value) || 0,
        tag: modalExpenseTag.value || 'other'
    };
    state.budget.push(newExpense);
    saveState();
    renderList();
    calculate();
    addExpenseModal.close();
    addExpenseForm.reset();
};

// Tag filter
tagFilterEl.onchange = (e) => {
    currentFilter = e.target.value;
    renderDetailedList();
};

currencyEl.onchange = (e) => {
    state.currency = e.target.value;
    currLabels.forEach(el => el.textContent = state.currency);
    saveState();
    fetchExchangeRate();
};

taxRateEl.onchange = (e) => {
    state.taxRate = parseFloat(e.target.value) || 0;
    saveState();
    calculate();
};

function calculate() {
    const total = state.budget.reduce((acc, item) => acc + (item.value || 0), 0);
    const taxFactor = 1 - (state.taxRate / 100);
    const grossBase = total / taxFactor;
    const totalTaxes = Math.min(Math.abs(total - grossBase), grossBase); // Clamp just in case
    const grossUSD = grossBase * exchangeRate;
    
    taxRateLabel.textContent = formatNumber(state.taxRate);
    totalBudgetEl.textContent = formatCurrency(total, state.currency);
    totalTaxesEl.textContent = formatCurrency(totalTaxes, state.currency);
    grossSalaryBaseEl.textContent = formatCurrency(grossBase, state.currency);
    grossSalaryUSDEl.textContent = formatCurrency(grossUSD, 'USD');
}

// Init
currencyEl.value = state.currency;
currLabels.forEach(el => el.textContent = state.currency);
taxRateEl.value = state.taxRate;
renderList();
fetchExchangeRate();
