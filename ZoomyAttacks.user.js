// ==UserScript==
// @name         Zoomy Attacks
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      1.0.1
// @description  Make Attacks go Zoom
// @author       Lore
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @downloadURL  https://github.com/Coding-Lore/TornScripts/raw/main/ZoomyAttacks.user.js
// @updateURL    https://github.com/Coding-Lore/TornScripts/raw/main/ZoomyAttacks.user.js
// @license      MIT
// @grant        GM_addStyle
// ==/UserScript==

//1 = leave, 2 = mug, 3 = hosp
let attackType = 2;
const typeFromLocal = localStorage.getItem("torn-attack-type");

if (typeFromLocal) {
    attackType = Number(typeFromLocal);
}

let disabled = false;

(function() {
    'use strict';
    let topStyle = "0";

    if (!disabled) {
        GM_addStyle(`
            .modelWrap___j3kfA {
                max-width: 100%;
            }
            .player___wiE8R:nth-child(2) .playerWindow___aDeDI {
                overflow: visible;
            }
            .dialogButtons___nX4Bz {
                z-index: 1000;
                position: absolute;
                top: ${topStyle};
                display: flex;
                left: -300px;
                width: 420px;
                justify-content: center;
            }
            .btn___RxE8_ {
                margin: 0;
                padding: 225px 25px !important;
            }
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

    setTimeout(() => {
        const container = document.querySelector(".titleContainer___QrlWP");
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

            let attackType = 0;
            if (id === "leave") attackType = 1;
            else if (id === "mug") attackType = 2;
            else if (id === "hosp") attackType = 3;

            if (attackType > 0) {
                localStorage.setItem("torn-attack-type", attackType);
                location.reload();
            }
        });
    }, 1000);
})();
