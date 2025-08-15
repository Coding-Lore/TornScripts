// ==UserScript==
// @name         Zoomy Attacks + Clickable Name
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      1.1
// @description  Optimises layout of attack age, and adds link to profile
// @author       Lore
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @downloadURL  https://github.com/Coding-Lore/TornScripts/raw/main/ZoomyAttacks.user.js
// @updateURL    https://github.com/Coding-Lore/TornScripts/raw/main/ZoomyAttacks.user.js
// @license      MIT
// @grant        GM_addStyle
// ==/UserScript==

// 1 = leave, 2 = mug, 3 = hosp
let attackType = 2;
const typeFromLocal = localStorage.getItem("torn-attack-type");
if (typeFromLocal) attackType = Number(typeFromLocal);

let disabled = false;

(function() {
    'use strict';
    let topStyle = "0";

    if (!disabled) {
        GM_addStyle(`
            .modelWrap___j3kfA { max-width: 100%; }
            .player___wiE8R:nth-child(2) .playerWindow___aDeDI { overflow: visible; }
            .dialogButtons___nX4Bz {
                z-index: 1000;
                position: absolute;
                top: ${topStyle};
                display: flex;
                left: -300px;
                width: 420px;
                justify-content: center;
            }
            .btn___RxE8_ { margin: 0; padding: 225px 25px !important; }
            ${attackType === 1 ? `
                .dialogButtons___nX4Bz button:nth-child(1) { order: 2; }
                .dialogButtons___nX4Bz button:nth-child(2) { order: 1; }
                .dialogButtons___nX4Bz button:nth-child(3) { order: 3; }
            ` : attackType === 3 ? `
                .dialogButtons___nX4Bz button:nth-child(1) { order: 1; }
                .dialogButtons___nX4Bz button:nth-child(2) { order: 3; }
                .dialogButtons___nX4Bz button:nth-child(3) { order: 2; }
            ` : ``}
        `);
    }

    // -----------------------------
    // Attack Type Selector
    // -----------------------------
    setTimeout(() => {
        const container = document.querySelector(".titleContainer___QrlWP");
        if (!container) return;

        const buttonContainer = document.createElement("div");
        const attackTypeHTML = `<span style="padding-right: 5px;">Attack type</span>
            <input type="radio" id="leave" name="attackType" value="leave" ${attackType === 1 ? "checked" : ""}>
            <label for="leave">Leave</label>
            <input type="radio" id="mug" name="attackType" value="mug" ${attackType === 2 ? "checked" : ""}>
            <label for="mug">Mug</label>
            <input type="radio" id="hosp" name="attackType" value="hosp" ${attackType === 3 ? "checked" : ""}>
            <label for="hosp">Hosp</label>`;
        buttonContainer.innerHTML = `<fieldset>${attackTypeHTML}</fieldset>`;
        container.appendChild(buttonContainer);

        buttonContainer.addEventListener("click", (e) => {
            const id = e.target.id;
            let type = 0;
            if (id === "leave") type = 1;
            else if (id === "mug") type = 2;
            else if (id === "hosp") type = 3;

            if (type > 0) {
                localStorage.setItem("torn-attack-type", type);
                location.reload();
            }
        });
    }, 1000);

    // -----------------------------
    // Clickable Opponent Name
    // -----------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const user2ID = urlParams.get('user2ID');
    if (user2ID) {
        function waitForOpponentSpan() {
            const spans = document.querySelectorAll('span.userName___loAWK.user-name.left');
            if (spans.length >= 2) {
                const opponentSpan = spans[1];
                const link = document.createElement('a');
                link.href = `https://www.torn.com/profiles.php?XID=${user2ID}`;
                link.textContent = opponentSpan.textContent;
                link.className = opponentSpan.className;
                link.style.cssText = opponentSpan.style.cssText;
                link.style.color = opponentSpan.style.color || 'inherit';
                link.style.textDecoration = 'none';
                link.style.cursor = 'pointer';
                opponentSpan.parentNode.replaceChild(link, opponentSpan);
            } else {
                setTimeout(waitForOpponentSpan, 100);
            }
        }
        waitForOpponentSpan();
    }
})();
