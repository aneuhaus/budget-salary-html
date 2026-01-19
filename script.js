/**
 * Bridge - Budget & Salary Calculator
 * Optimized & Modularized Version
 */

const App = {
  // Constants
  API_URL: "https://open.er-api.com/v6/latest/",
  TAG_METADATA: {
    essential: { label: "Essential", color: "tag-essential" },
    housing: { label: "Housing", color: "tag-housing" },
    transport: { label: "Transport", color: "tag-transport" },
    health: { label: "Health", color: "tag-health" },
    lifestyle: { label: "Lifestyle", color: "tag-lifestyle" },
    savings: { label: "Savings", color: "tag-savings" },
    other: { label: "Other", color: "tag-other" },
  },
  DEFAULT_DATA: {
    currency: "BRL",
    taxRate: 27.5,
    budget: [
      { name: "Rent", value: 3700, tag: "housing" },
      { name: "Condo", value: 1450, tag: "housing" },
      { name: "Food", value: 1000, tag: "essential" },
      { name: "Power", value: 120, tag: "essential" },
      { name: "Internet", value: 150, tag: "essential" },
      { name: "Cell Phone", value: 50, tag: "essential" },
      { name: "Pharmacy", value: 300, tag: "health" },
      { name: "Health Insurance", value: 600, tag: "health" },
      { name: "Car Insurance", value: 200, tag: "transport" },
      { name: "Fuel", value: 200, tag: "transport" },
      { name: "Leisure", value: 800, tag: "lifestyle" },
      { name: "Subscriptions", value: 150, tag: "lifestyle" },
      { name: "Gym", value: 400, tag: "lifestyle" },
      { name: "Clothes", value: 200, tag: "lifestyle" },
      { name: "Emergency Fund", value: 500, tag: "savings" },
      { name: "Desired Savings", value: 4000, tag: "savings" },
    ],
  },

  // State
  state: {
    currency: "BRL",
    taxRate: 27.5,
    budget: [],
    exchangeRate: 0.18,
    currentFilter: "all",
    isLoadingRate: false,
  },

  // Formatters Cache
  formatters: new Map(),

  init() {
    this.cacheDOM();
    this.loadState();
    this.bindEvents();
    this.render();
    this.fetchExchangeRate();
  },

  cacheDOM() {
    this.dom = {
      budgetList: document.getElementById("budgetList"),
      detailedList: document.getElementById("detailedList"),
      currency: document.getElementById("currency"),
      taxRate: document.getElementById("taxRate"),
      totalBudget: document.getElementById("totalBudget"),
      totalTaxes: document.getElementById("totalTaxes"),
      grossSalaryBase: document.getElementById("grossSalaryBase"),
      grossSalaryUSD: document.getElementById("grossSalaryUSD"),
      exchangeStatus: document.getElementById("exchangeStatus"),
      tagFilter: document.getElementById("tagFilter"),
      filteredTotal: document.getElementById("filteredTotal"),
      filteredLabel: document.getElementById("filteredLabel"),
      addModal: document.getElementById("addExpenseModal"),
      addForm: document.getElementById("addExpenseForm"),
      modalName: document.getElementById("modalExpenseName"),
      modalValue: document.getElementById("modalExpenseValue"),
      modalTag: document.getElementById("modalExpenseTag"),
      cancelModal: document.getElementById("cancelModal"),
      addItemBtn: document.getElementById("addItem"),
      template: document.getElementById("expense-item-template"),
    };
  },

  loadState() {
    const saved = localStorage.getItem("budget_state");
    const data = saved ? JSON.parse(saved) : this.DEFAULT_DATA;
    this.state.currency = data.currency;
    this.state.taxRate = data.taxRate;
    this.state.budget = data.budget.map((item) => ({
      ...item,
      tag: item.tag || "other",
    }));

    // Update UI to match loaded state
    this.dom.currency.value = this.state.currency;
    this.dom.taxRate.value = this.state.taxRate;
    this.updateLabels();
  },

  saveState() {
    const { currency, taxRate, budget } = this.state;
    localStorage.setItem(
      "budget_state",
      JSON.stringify({ currency, taxRate, budget }),
    );
  },

  bindEvents() {
    this.dom.addItemBtn.onclick = () => {
      this.dom.addModal.showModal();
      this.dom.modalName.focus();
    };

    this.dom.cancelModal.onclick = () => {
      this.dom.addModal.close();
      this.dom.addForm.reset();
    };

    this.dom.addForm.onsubmit = (e) => {
      e.preventDefault();
      this.addExpense();
    };

    this.dom.tagFilter.onchange = (e) => {
      this.state.currentFilter = e.target.value;
      this.renderDetailedList();
    };

    this.dom.currency.onchange = (e) => {
      this.state.currency = e.target.value;
      this.updateLabels();
      this.saveState();
      this.fetchExchangeRate();
    };

    this.dom.taxRate.onchange = (e) => {
      this.state.taxRate = parseFloat(e.target.value) || 0;
      this.saveState();
      this.calculate();
    };
  },

  updateLabels() {
    document.querySelectorAll(".curr-label").forEach((el) => {
      el.textContent = this.state.currency;
    });
  },

  async fetchExchangeRate() {
    if (this.state.isLoadingRate) return;

    try {
      this.state.isLoadingRate = true;
      this.dom.exchangeStatus.innerHTML = `<span class="loading">Updating rates for ${this.state.currency}...</span>`;

      const res = await fetch(`${this.API_URL}${this.state.currency}`);
      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      this.state.exchangeRate = data.rates.USD;

      this.dom.exchangeStatus.innerHTML = `
                <p>Last updated: ${data.time_last_update_utc.slice(5, 25)}</p>
                <p>1 USD = ${this.formatCurrency(1 / this.state.exchangeRate, this.state.currency, 4)}</p>
            `;
      this.calculate();
    } catch (err) {
      console.error("Exchange rate fetch failed:", err);
      this.dom.exchangeStatus.innerHTML = `<span class="error">Rate update failed. Using fallback.</span>`;
    } finally {
      this.state.isLoadingRate = false;
    }
  },

  getFormatter(currency, digits = 2) {
    const key = `${currency}-${digits}-${navigator.language}`;
    if (!this.formatters.has(key)) {
      this.formatters.set(
        key,
        new Intl.NumberFormat(navigator.language, {
          style: "currency",
          currency: currency,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }),
      );
    }
    return this.formatters.get(key);
  },

  getNumberFormatter(digits = 2) {
    const key = `num-${digits}-${navigator.language}`;
    if (!this.formatters.has(key)) {
      this.formatters.set(
        key,
        new Intl.NumberFormat(navigator.language, {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }),
      );
    }
    return this.formatters.get(key);
  },

  formatCurrency(value, currency, digits = 2) {
    return this.getFormatter(currency, digits)
      .format(value)
      .replace(/(\D+)/, "$1 ");
  },

  formatNumber(value, digits = 2) {
    return this.getNumberFormatter(digits)
      .format(value)
      .replace(/(\D+)/, "$1 ");
  },

  addExpense() {
    const newExpense = {
      name: this.dom.modalName.value,
      value: parseFloat(this.dom.modalValue.value) || 0,
      tag: this.dom.modalTag.value || "other",
    };

    this.state.budget.push(newExpense);
    this.saveState();
    this.render();
    this.calculate();

    this.dom.addModal.close();
    this.dom.addForm.reset();
  },

  updateItem(index, key, val) {
    if (key === "value") {
      this.state.budget[index][key] = parseFloat(val) || 0;
      this.calculate();
    } else {
      this.state.budget[index][key] = val;
      this.renderDetailedList();
    }
    this.saveState();
  },

  removeItem(index) {
    this.state.budget.splice(index, 1);
    this.saveState();
    this.render();
    this.calculate();
  },

  calculate() {
    const total = this.state.budget.reduce(
      (acc, item) => acc + (item.value || 0),
      0,
    );
    const taxRate = this.state.taxRate;
    const taxFactor = 1 - taxRate / 100;

    // Handle Edge Case: 100% tax rate
    const grossBase = taxRate >= 100 ? 0 : total / taxFactor;
    const totalTaxes = Math.max(0, grossBase - total);
    const grossUSD = grossBase * this.state.exchangeRate;

    // Update DOM
    document.querySelector(".tax-rate-label").textContent =
      this.formatNumber(taxRate);
    this.dom.totalBudget.textContent = this.formatCurrency(
      total,
      this.state.currency,
    );
    this.dom.totalTaxes.textContent = this.formatCurrency(
      totalTaxes,
      this.state.currency,
    );
    this.dom.grossSalaryBase.textContent = this.formatCurrency(
      grossBase,
      this.state.currency,
    );
    this.dom.grossSalaryUSD.textContent = this.formatCurrency(grossUSD, "USD");
  },

  createItemEl(item, index) {
    const clone = this.dom.template.content.cloneNode(true);
    const itemEl = clone.querySelector(".budget-item");

    const nameInput = itemEl.querySelector(".expense-name");
    nameInput.value = item.name;
    nameInput.onchange = (e) => this.updateItem(index, "name", e.target.value);

    const tagSelect = itemEl.querySelector(".expense-tag");
    tagSelect.value = item.tag;
    tagSelect.onchange = (e) => this.updateItem(index, "tag", e.target.value);

    const valueInput = itemEl.querySelector(".expense-value");
    valueInput.value = item.value;
    valueInput.onchange = (e) =>
      this.updateItem(index, "value", e.target.value);

    const removeBtn = itemEl.querySelector(".remove-item");
    removeBtn.onclick = () => this.removeItem(index);

    return clone;
  },

  render() {
    this.dom.budgetList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    this.state.budget.forEach((item, index) => {
      fragment.appendChild(this.createItemEl(item, index));
    });

    this.dom.budgetList.appendChild(fragment);
    this.renderDetailedList();
  },

  renderDetailedList() {
    const { currentFilter, budget, currency } = this.state;
    const filteredItems =
      currentFilter === "all"
        ? budget
        : budget.filter((item) => item.tag === currentFilter);

    this.dom.detailedList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    filteredItems.forEach((item) => {
      const row = document.createElement("tr");
      const tagMeta = this.TAG_METADATA[item.tag] || this.TAG_METADATA.other;

      row.innerHTML = `
                <td>${item.name}</td>
                <td><span class="tag ${tagMeta.color}">${tagMeta.label}</span></td>
                <td style="text-align: right;">${this.formatCurrency(item.value, currency)}</td>
            `;
      fragment.appendChild(row);
    });

    this.dom.detailedList.appendChild(fragment);

    // Update filtered total
    const filteredTotalValue = filteredItems.reduce(
      (acc, item) => acc + (item.value || 0),
      0,
    );
    this.dom.filteredTotal.textContent = this.formatCurrency(
      filteredTotalValue,
      currency,
    );

    if (currentFilter === "all") {
      this.dom.filteredLabel.textContent = "Total (All Categories)";
    } else {
      const tagMeta = this.TAG_METADATA[currentFilter];
      this.dom.filteredLabel.textContent = `Total (${tagMeta.label})`;
    }
  },
};

// Start the application
document.addEventListener("DOMContentLoaded", () => App.init());
