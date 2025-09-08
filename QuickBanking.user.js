// ==UserScript==
// @name         Quick Banking!
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      1.3.3
// @description  Bank all cash in trades + buttons to subtract preset/custom amounts - Mobile Friendly
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
     *  Helpers
     *  -------------------------- */
    const formatNumber = n => n.toLocaleString('en-US');
    const parseNumber = str => parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
    const parseShorthand = str => {
        const map = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
        let s = str.trim().toLowerCase();
        let mul = 1;
        if (map[s.slice(-1)]) {
            mul = map[s.slice(-1)];
            s = s.slice(0, -1);
        }
        const num = parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
        return Math.floor(num * mul);
    };
    const getTradePageCash = () => {
        const el = document.querySelector('.money-value');
        return el ? parseNumber(el.textContent) : 0;
    };
    const waitForElement = sel => new Promise(resolve => {
        const el = document.querySelector(sel);
        if (el) return resolve(el);
        const obs = new MutationObserver(() => {
            const el2 = document.querySelector(sel);
            if (el2) {
                obs.disconnect();
                resolve(el2);
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    });

    /** --------------------------
     *  Settings
     *  -------------------------- */
    const defaultSettings = {
        autoSync: true,
        presets: ['-100k','-500k','-1m','-10m','-100m','-1b']
    };
    let settings = JSON.parse(localStorage.getItem('quickBankingSettings') || '{}');
    settings = { ...defaultSettings, ...settings };
    const saveSettings = () => localStorage.setItem('quickBankingSettings', JSON.stringify(settings));

    /** --------------------------
     *  Quick Bank Button
     *  -------------------------- */
    async function addBankButton() {
        if (!location.hash.includes("step=view") && !location.hash.includes("sub_step=addmoney2")) {
            document.getElementById("customTradeBtn")?.remove();
            return;
        }
        const container = await waitForElement('[class*="color2"], .points-mobile___gpalH > :first-child');
        if (!container || document.getElementById("customTradeBtn")) return;

        const btn = document.createElement("button");
        btn.className = "torn-btn orange";
        btn.id = "customTradeBtn";
        btn.style.cssText = "top:3px;display:block";
        btn.innerHTML = "<strong>&emsp;Bank&emsp;</strong>";
        btn.addEventListener("click", () => {
            const tradeId = new URLSearchParams(location.hash.substring(1)).get('ID');
            if (!tradeId) return;
            const dollars = parseInt(document.querySelector("#user-money")?.dataset.money || "0");
            if (!dollars) return;
            let moneyInTrade = 0;
            const match = document.querySelector('.user.left .name.left')?.innerText.match(/\$([\d,]+)/);
            if (match) moneyInTrade = parseNumber(match[1]);
            location.href = `https://www.torn.com/trade.php#step=view&sub_step=addmoney2&ID=${tradeId}&amount=${dollars + moneyInTrade}`;
        });

        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;justify-content:center;margin:8px 0";
        wrap.appendChild(btn);
        container.before(wrap);
    }

    /** --------------------------
     *  Ghost Trade Buttons
     *  -------------------------- */
    function addGhostButtons(input, sync) {
        if (document.getElementById("ghost-trade-helper")) return;
        const container = document.createElement("div");
        container.id = "ghost-trade-helper";
        container.style.cssText = "margin-top:10px;display:flex;flex-wrap:wrap;gap:4px";

        const mkBtn = (label, action) => {
            const b = document.createElement("button");
            b.className = "torn-btn orange";
            b.style.cssText = "top:3px;display:block";
            b.innerHTML = `<strong> ${label} </strong>`;
            b.onclick = e => { e.preventDefault(); action(); };
            return b;
        };

        const renderPresets = () => {
            container.innerHTML = ''; // Clear first

            // Add selected preset buttons
            settings.presets.forEach(label => {
                const amt = parseShorthand(label.replace('-', ''));
                container.appendChild(mkBtn(label, () => {
                    const newVal = Math.max(0, parseNumber(input.value) + (label.startsWith('-') ? -amt : amt));
                    input.value = formatNumber(newVal);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    if (settings.autoSync) sync();
                }));
            });

            // Custom and Paste buttons (always there)
            container.appendChild(mkBtn('Custom', () => {
                const val = prompt('Enter amount (e.g. 45k, 7m, 5b):');
                if (val === null) return; // cancel pressed
                const sub = parseShorthand(val);
                const newVal = Math.max(0, parseNumber(input.value) - sub);
                input.value = formatNumber(newVal);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                if (settings.autoSync) sync();
            }));

            container.appendChild(mkBtn('Paste', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (!text) return;
                    const sub = parseShorthand(text);
                    const newVal = Math.max(0, parseNumber(input.value) - sub);
                    input.value = formatNumber(newVal);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    if (settings.autoSync) sync();
                } catch { alert('Clipboard access denied.'); }
            }));

            // Settings button
            container.appendChild(mkBtn('⚙️', () => {
                const toggle = confirm(`Auto-sync is currently ${settings.autoSync ? 'ON' : 'OFF'}. Toggle?`);
                if (toggle) { // Only change if OK pressed
                    settings.autoSync = !settings.autoSync;
                    saveSettings();
                }

                const selected = prompt(
                    'Enter preset buttons you want (comma separated, e.g., -100k,-500k,-1m,-10m,-100m,-1b). Leave empty for none:',
                    settings.presets.join(',')
                );

                if (selected === null) return; // cancel pressed
                settings.presets = selected.split(',').map(s => s.trim()).filter(s => s.length > 0);
                saveSettings();
                renderPresets();
            }));
        };

        renderPresets();
        input.parentElement.insertAdjacentElement('afterend', container);
    }

    /** --------------------------
     *  Wallet Sync
     *  -------------------------- */
    function observeWalletSync(input) {
        if (!settings.autoSync) return () => {};
        let lastWallet = getTradePageCash();
        let lastInput = parseNumber(input.value);

        const sync = () => { lastWallet = getTradePageCash(); lastInput = parseNumber(input.value); };
        const apply = () => {
            if (!settings.autoSync) return;
            const newWallet = getTradePageCash();
            if (newWallet === lastWallet) return;
            const delta = lastInput - lastWallet;
            const newVal = Math.max(0, newWallet + delta);
            input.value = formatNumber(newVal);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            lastWallet = newWallet;
            lastInput = newVal;
        };

        const node = document.querySelector('.money-value');
        if (node) new MutationObserver(apply).observe(node, { childList: true, subtree: true });
        setInterval(apply, 500);
        return sync;
    }

    function fixLineBreak() {
        const p = Array.from(document.querySelectorAll('p')).find(p =>
            p.textContent.includes('Enter in the amount of money you want to trade.') &&
            p.textContent.includes('You have $') &&
            !p.innerHTML.includes('<br>')
        );
        if (p) p.innerHTML = p.innerHTML.replace('. You have', '.<br>You have');
    }

    /** --------------------------
     *  Init
     *  -------------------------- */
    async function init() {
        await addBankButton();
        const input = document.querySelector('.user-id.input-money');
        if (!input) return;

        input.value = formatNumber(getTradePageCash() + parseNumber(input.value));
        input.dispatchEvent(new Event('input', { bubbles: true }));

        const sync = observeWalletSync(input);
        addGhostButtons(input, sync);
        sync?.();
        fixLineBreak();
    }

    new MutationObserver(() => { if (location.pathname === '/trade.php') init(); })
        .observe(document.body, { childList: true, subtree: true });

    window.addEventListener("hashchange", init);
    init();
})();
