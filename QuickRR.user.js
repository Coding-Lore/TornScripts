// ==UserScript==
// @name         Quick RR buttons
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      1.7
// @description  Buttons to quickly play RR, including a delayed shot (3 sec)
// @author       Lore
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://github.com/Coding-Lore/TornScripts/raw/main/QuickRR.user.js
// @updateURL    https://github.com/Coding-Lore/TornScripts/raw/main/QuickRR.user.js


// @match        https://www.torn.com/page.php?sid=russianRoulette*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const RFCV = '689e7d891504d'; // Known working RFCV

    function addButtons() {
        if(document.querySelector('#rr-quick-buttons')) return;

        const container = document.createElement('div');
        container.id = 'rr-quick-buttons';
        container.style.position = 'fixed';
        container.style.top = '120px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '5px';

        // Normal buttons 1,2,3 shots
        [1, 2, 3].forEach(num => {
            const btn = document.createElement('button');
            btn.className = "torn-btn orange";
            btn.id = `rrShootBtn${num}`;
            btn.style.top = "3px";
            btn.style.display = "flex";
            btn.style.alignItems = "center";      // vertical centering
            btn.style.justifyContent = "center";  // horizontal centering
            btn.style.margin = "0";
            btn.style.padding = "5px 10px";
            btn.style.outline = "none";
            btn.innerHTML = `<strong>&emsp;Shoot ${num}&emsp;</strong>`;

            btn.addEventListener('mousedown', e => e.preventDefault());
            btn.addEventListener('click', () => fireShots(num));

            container.appendChild(btn);
        });

        // Delayed 1-shot button
        const delayedBtn = document.createElement('button');
        delayedBtn.className = "torn-btn orange";
        delayedBtn.id = 'rrDelayedShot';
        delayedBtn.style.top = "3px";
        delayedBtn.style.display = "flex";
        delayedBtn.style.alignItems = "center";      // vertical centering
        delayedBtn.style.justifyContent = "center";  // horizontal centering
        delayedBtn.style.margin = "0";
        delayedBtn.style.padding = "5px 10px";
        delayedBtn.style.outline = "none";
        delayedBtn.innerHTML = `<strong>&emsp;Delay&emsp;</strong>`;

        delayedBtn.addEventListener('mousedown', e => e.preventDefault());
        delayedBtn.addEventListener('click', () => {
            let countdown = 3;
            delayedBtn.disabled = true;
            const originalText = delayedBtn.innerHTML;

            const tick = () => {
                if(countdown > 0) {
                    delayedBtn.innerHTML = `<strong>&emsp;${countdown}&emsp;</strong>`;
                    countdown--;
                    setTimeout(tick, 1000);
                } else {
                    delayedBtn.innerHTML = `<strong>&emsp;Firing&emsp;</strong>`;
                    fireShots(1);
                    setTimeout(() => {
                        delayedBtn.disabled = false;
                        delayedBtn.innerHTML = originalText;
                    }, 500);
                }
            };

            tick();
        });

        container.appendChild(delayedBtn);

        document.body.appendChild(container);
    }

    function fireShots(num) {
        const form = new FormData();
        form.append('sid','russianRouletteData');
        form.append('rfcv', RFCV);
        form.append('step','makeTurn');
        form.append('shotsAmount', num);

        fetch(`https://www.torn.com/page.php?sid=russianRouletteData&rfcv=${RFCV}`, {
            method: 'POST',
            body: form,
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(res => res.json())
        .then(data => console.log('RR response:', data))
        .catch(err => console.error(err));
    }

    const observer = new MutationObserver(() => addButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    addButtons();
})();
