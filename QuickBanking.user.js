// ==UserScript==
// @name         Quick Banking!
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Inserts a Bank button in trades that deposits all money on hand, and reappears when a deposit is made
// @author       Lore
// @match        https://www.torn.com/trade.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://github.com/Coding-Lore/TornScripts/raw/main/QuickBanking.user.js
// @updateURL    https://github.com/Coding-Lore/TornScripts/raw/main/QuickBanking.user.js
// @license      MIT
// ==/UserScript==


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

(function() {
    // Main function to add the bank button if on correct pages
    async function init() {
        const hash = window.location.hash;
        if (!hash.includes("step=view") && !hash.includes("sub_step=addmoney2")) {
            // Not on relevant trade page, remove button if any and stop
            const existingBtn = document.getElementById("customTradeBtn");
            if (existingBtn) existingBtn.remove();
            return;
        }

        // Wait for container to be available
        let container;
        try {
            container = await waitForElement('[class*="color2"]');
        } catch {
            // fallback for mobile or alternate layout
            container = document.querySelector(`[class="points-mobile___gpalH"]`)?.children[0];
        }
        if (!container) {
            console.warn("Trade container not found. Bank button not added.");
            return;
        }

        // If button already exists, no need to add again
        if (document.getElementById("customTradeBtn")) return;

        // Create the button
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

            // Redirect to add money with combined amount
            window.location.href = `https://www.torn.com/trade.php#step=view&sub_step=addmoney2&ID=${tradeId}&amount=${dollars + moneyInTrade}`;
        });

        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.margin = "8px 0";
        wrapper.appendChild(bankAllButton);
        container.before(wrapper);

    }

    // Add button initially
    init();

    // Observe body mutations to re-add button if removed
    const observer = new MutationObserver(() => {
        init();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Listen for URL hash changes (for SPA-like behavior)
    window.addEventListener("hashchange", () => {
        init();
    });

})();
