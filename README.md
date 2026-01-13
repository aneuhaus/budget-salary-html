# Bridge — Budget & Salary Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> **Bridge: The elegant way to calculate what you actually need to earn.**

A clean, high-performance single-page application to calculate your required gross salary based on your monthly expenses, tax rates, and real-time exchange rates.

## Live Demo

Check out the live version here: **[budget.neuhaus.co](https://budget.neuhaus.co/)**

## Features

- **Dynamic Expense List**: Add, edit, or remove expenses on the fly.
- **Tax Calculation**: Automatically calculates the necessary gross salary to cover your net expenses after taxes.
- **Real-time Exchange Rates**: Fetches the latest USD exchange rates via [ExchangeRate-API](https://www.exchangerate-api.com/).
- **Local Persistence**: Your data stays in your browser's local storage—no database required.
- **Premium Design**: Modern UI featuring a Glassmorphism aesthetic, responsive layout, and smooth micro-animations.
- **Template-based**: Clean DOM manipulation using the `<template>` element for better performance and maintainability.

## How to Use

1.  **Configure**: Set your base currency and your local tax rate.
2.  **Enter Expenses**: List out all your monthly costs.
3.  **View Results**: Instantly see your total monthly budget, required gross salary in local currency, and its USD equivalent.

## Local Development

No complex setup or dependencies required. Just clone and open!

```bash
# Clone the repository
git clone https://github.com/aneuhaus/budget-salary-html.git

# Open in your browser
open index.html
```

## Credits

Inspired by the original [`bdgt.sh`](https://github.com/aneuhaus/budget-salary) shell script. Built to bring terminal-level efficiency to the web with premium aesthetics.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for the full text.

Made by [aneuhaus](https://github.com/aneuhaus)
