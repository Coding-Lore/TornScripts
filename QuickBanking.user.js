// ==UserScript==
// @name         Quick Banking!
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      1.2.1
// @description  Bank all cash in trades + buttons to subtract preset/custom amounts
// @author       Lore
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://github.com/Coding-Lore/TornScripts/raw/main/QuickBanking.user.js
// @updateURL    https://github.com/Coding-Lore/TornScripts/raw/main/QuickBanking.user.js
// @match        https://www.torn.com/trade.php*
// @license      MIT
// ==/UserScript==

(async function() {
    'use strict';

    /** --------------------------
     *  Shared Utility Functions
     *  -------------------------- */
    async function waitForElement(querySelector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(querySelector);
            if (element) return resolve(element);

            const observer = new MutationObserver(() => {
                const el = document.querySelector(querySelector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            if (timeout) {
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for element: ${querySelector}`));
                }, timeout);
            }
        });
    }

    const formatNumber = (n) => n.toLocaleString('en-US');
    const parseNumber = (str) => parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;

    const parseShorthand = (str) => {
        const multiplierMap = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
        let inputStr = str.trim().toLowerCase();
        let multiplier = 1;
        const lastChar = inputStr.slice(-1);
        if (multiplierMap[lastChar]) {
            multiplier = multiplierMap[lastChar];
            inputStr = inputStr.slice(0, -1);
        }
        const numeric = parseFloat(inputStr.replace(/[^0-9.]/g, '')) || 0;
        return Math.floor(numeric * multiplier);
    };

    const getTradePageCash = () => {
        const el = document.querySelector('.money-value');
        return el ? parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) : 0;
    };

    const waitForInput = () => new Promise((resolve) => {
        const check = () => {
            const inputs = document.querySelectorAll('.user-id.input-money');
            if (inputs.length >= 1) return resolve(inputs);
            requestAnimationFrame(check);
        };
        check();
    });

    /** --------------------------
     *  Quick Banking Button Logic
     *  -------------------------- */
    async function addBankButton() {
        const hash = window.location.hash;
        if (!hash.includes("step=view") && !hash.includes("sub_step=addmoney2")) {
            const existingBtn = document.getElementById("customTradeBtn");
            if (existingBtn) existingBtn.remove();
            return;
        }

        let container;
        try {
            container = await waitForElement('[class*="color2"]');
        } catch {
            container = document.querySelector(`[class="points-mobile___gpalH"]`)?.children[0];
        }
        if (!container) return;

        if (document.getElementById("customTradeBtn")) return;

        const bankAllButton = document.createElement("button");
        bankAllButton.className = "torn-btn orange";
        bankAllButton.id = "customTradeBtn";
        bankAllButton.style.top = "3px";
        bankAllButton.style.display = "block";
        bankAllButton.innerHTML = "<strong>&emsp;Bank&emsp;</strong>";

        bankAllButton.addEventListener("click", () => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const tradeId = hashParams.get('ID');
            if (!tradeId) return;

            const userMoneyElem = document.querySelector("#user-money");
            if (!userMoneyElem) return;

            const dollars = parseInt(userMoneyElem.getAttribute('data-money'));
            if (!dollars || dollars === 0) return;

            let leftUser = document.querySelector(`[class="user left"]`) || document.querySelector(`[class="user left tt-modified"]`);
            if (!leftUser) return;

            let tradeElem = leftUser.querySelector(`[class="name left"]`);
            let moneyInTrade = 0;
            if (tradeElem) {
                const txt = tradeElem.innerText;
                const match = txt.match(/\$([\d,]+)/);
                if (match && match[1]) {
                    moneyInTrade = parseInt(match[1].replace(/,/g, ""));
                }
            }
            window.location.href = `https://www.torn.com/trade.php#step=view&sub_step=addmoney2&ID=${tradeId}&amount=${dollars + moneyInTrade}`;
        });

        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.margin = "8px 0";
        wrapper.appendChild(bankAllButton);
        container.before(wrapper);
    }

    /** --------------------------
     *  Ghost Trade Remover Logic
     *  -------------------------- */
    function insertGhostButtons(input, sync) {
        if (document.querySelector('#ghost-trade-helper')) return;

        const container = document.createElement('div');
        container.id = 'ghost-trade-helper';
        container.style.marginTop = '10px';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '4px';

        const createStyledButton = (label, onClick) => {
            const btn = document.createElement('button');
            btn.className = 'torn-btn orange';
            btn.style.top = '3px';
            btn.style.display = 'block';
            btn.innerHTML = `<strong> ${label} </strong>`;
            btn.onclick = (e) => {
                e.preventDefault();
                onClick();
            };
            return btn;
        };

        const PRESET_BUTTONS = [
            ['-100k', -100_000],
            ['-500k', -500_000],
            ['-1m', -1_000_000],
            ['-10m', -10_000_000],
            ['-100m', -100_000_000],
            ['-1b', -1_000_000_000],
        ];

        PRESET_BUTTONS.forEach(([label, amount]) => {
            const btn = createStyledButton(label, () => {
                const current = parseNumber(input.value);
                const newValue = Math.max(0, current + amount);
                input.value = formatNumber(newValue);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                sync();
            });
            container.appendChild(btn);
        });

        const custom = createStyledButton('Custom', () => {
            const val = prompt('Enter amount to subtract');
            if (!val) return;
            const sub = parseShorthand(val);
            const current = parseNumber(input.value);
            const newValue = Math.max(0, current - sub);
            input.value = formatNumber(newValue);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            sync();
        });
        container.appendChild(custom);

        const paste = createStyledButton('Paste', async () => {
            try {
                const text = await navigator.clipboard.readText();
                const sub = parseShorthand(text);
                const current = parseNumber(input.value);
                const newValue = Math.max(0, current - sub);
                input.value = formatNumber(newValue);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                sync();
            } catch {
                alert('Clipboard access denied.');
            }
        });
        container.appendChild(paste);

        input.parentElement.insertAdjacentElement('afterend', container);
    }

    function observeTradeCash(input) {
        let lastWallet = getTradePageCash();
        let lastInput = parseNumber(input.value);

        const sync = () => {
            lastWallet = getTradePageCash();
            lastInput = parseNumber(input.value);
        };

        const applyNewValue = () => {
            const newWallet = getTradePageCash();
            if (newWallet === lastWallet) return;
            const delta = lastInput - lastWallet;
            const newValue = Math.max(0, newWallet + delta);
            input.value = formatNumber(newValue);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            lastWallet = newWallet;
            lastInput = newValue;
        };

        const node = document.querySelector('.money-value');
        if (!node) return;

        const observer = new MutationObserver(applyNewValue);
        observer.observe(node, { childList: true, characterData: true, subtree: true });

        setInterval(applyNewValue, 500);
        return sync;
    }

    function waitForLineBreakTarget() {
        const check = () => {
            const p = Array.from(document.querySelectorAll('p')).find(p =>
                p.textContent.includes('Enter in the amount of money you want to trade.') &&
                p.textContent.includes('You have $') &&
                !p.innerHTML.includes('<br>') &&
                !p.dataset.lineBreakFixed
            );
            if (p) {
                p.innerHTML = p.innerHTML.replace('. You have', '.<br>You have');
                p.dataset.lineBreakFixed = 'true';
            } else {
                requestAnimationFrame(check);
            }
        };
        requestAnimationFrame(check);
    }

    /** --------------------------
     *  Main Init
     *  -------------------------- */
    async function initTradeEnhancer() {
        await addBankButton();

        const [input] = await waitForInput();
        if (!input) return;

        const wallet = getTradePageCash();
        const current = parseNumber(input.value);
        input.value = formatNumber(wallet + current);
        input.dispatchEvent(new Event('input', { bubbles: true }));

        const sync = observeTradeCash(input);
        insertGhostButtons(input, sync);
        sync();
        waitForLineBreakTarget();
    }

    const observer = new MutationObserver(() => {
        if (location.pathname === '/trade.php') {
            initTradeEnhancer();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("hashchange", () => {
        initTradeEnhancer();
    });

    initTradeEnhancer();
})();
