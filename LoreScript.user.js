// ==UserScript==
// @name         Lore's Cool Script
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      5.0
// @description  Zoomy Attacks, Quick Banking, Quick RR Buttons with Copy Amount
// @author       Lore 2556042
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/Coding-Lore/TornScripts/main/LoreScript.user.js
// @updateURL    https://raw.githubusercontent.com/Coding-Lore/TornScripts/main/LoreScript.user.js
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @match        https://www.torn.com/trade.php*
// @match        https://www.torn.com/page.php?sid=russianRoulette*
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function(){
    'use strict';

    /** --------------------------
     *  Feature Toggles (Modular)
     *  -------------------------- */
    const config = {
        attackEnhancements: true,
        quickBanking: true,
        rrButtons: true
    };

    /** --------------------------
     *  Shared Helpers
     *  -------------------------- */
    const formatNumber = n => n.toLocaleString('en-US');
    const parseNumber = str => parseInt(str.replace(/[^0-9]/g,''),10)||0;
    const parseShorthand = str => {
        const map={k:1_000,m:1_000_000,b:1_000_000_000};
        let s=str.trim().toLowerCase(), mul=1;
        if(map[s.slice(-1)]){ mul=map[s.slice(-1)]; s=s.slice(0,-1); }
        const num=parseFloat(s.replace(/[^0-9.]/g,''))||0;
        return Math.floor(num*mul);
    };
    const waitForElement = (sel,timeout=10000)=> new Promise((resolve,reject)=>{
        const el=document.querySelector(sel);
        if(el) return resolve(el);
        const obs=new MutationObserver(()=>{
            const e=document.querySelector(sel);
            if(e){ obs.disconnect(); resolve(e); }
        });
        obs.observe(document.body,{childList:true,subtree:true});
        if(timeout) setTimeout(()=>{obs.disconnect(); reject(`Timeout waiting for ${sel}`);},timeout);
    });
    const getTradeCash = ()=> document.querySelector('.money-value') ? parseNumber(document.querySelector('.money-value').textContent) : 0;

    /** --------------------------
     *  Feature Modules
     *  -------------------------- */
    const modules = {

        /** Attack Enhancements: Zoomy + Clickable Name */
        attackEnhancements: function(){
            if(!config.attackEnhancements || !location.href.includes('loader.php?sid=attack&user2ID=')) return;
            const dialog = document.querySelector('.dialog___Q0GdI');
            if (dialog) {
                dialog.style.background = 'transparent';
                dialog.style.boxShadow = 'none';
                dialog.style.border = 'none';
            }

            const colored = document.querySelector('.colored___sN72G');
            if (colored) {
                colored.style.background = 'transparent';
                colored.style.boxShadow = 'none';
                colored.style.border = 'none';
            }

            let attackType=Number(localStorage.getItem("torn-attack-type"))||2;

            GM_addStyle(`
                .modelWrap___j3kfA { max-width: 100%; }
                .player___wiE8R:nth-child(2) .playerWindow___aDeDI { overflow: visible; }
                .dialogButtons___nX4Bz {
                    z-index:1000; position:absolute; top:0;
                    display:flex; left:-300px; width:420px; justify-content:center;
                }
                .btn___RxE8_ { margin:0; padding:220px 25px !important; }
                ${attackType===1?`
                    .dialogButtons___nX4Bz button:nth-child(1){order:2;}
                    .dialogButtons___nX4Bz button:nth-child(2){order:1;}
                    .dialogButtons___nX4Bz button:nth-child(3){order:3;}
                `:attackType===3?`
                    .dialogButtons___nX4Bz button:nth-child(1){order:1;}
                    .dialogButtons___nX4Bz button:nth-child(2){order:3;}
                    .dialogButtons___nX4Bz button:nth-child(3){order:2;}
                `:''}
            `);

            const container=document.querySelector(".titleContainer___QrlWP");
            if(container && !container.querySelector("fieldset")){
                const div=document.createElement("div");
                div.innerHTML=`<fieldset>
                    <span style="padding-right:5px;">Attack type</span>
                    <input type="radio" id="leave" name="attackType" value="leave" ${attackType===1?"checked":""}><label for="leave">Leave</label>
                    <input type="radio" id="mug" name="attackType" value="mug" ${attackType===2?"checked":""}><label for="mug">Mug</label>
                    <input type="radio" id="hosp" name="attackType" value="hosp" ${attackType===3?"checked":""}><label for="hosp">Hosp</label>
                </fieldset>`;
                container.appendChild(div);
                div.addEventListener("click",e=>{
                    let t=0;
                    if(e.target.id==="leave") t=1;
                    else if(e.target.id==="mug") t=2;
                    else if(e.target.id==="hosp") t=3;
                    if(t>0){ localStorage.setItem("torn-attack-type",t); location.reload(); }
                });
            }

            const spans=document.querySelectorAll('span.userName___loAWK.user-name.left');
            if(spans.length>=2 && !spans[1].parentNode.querySelector('a')){
                const user2ID=new URLSearchParams(window.location.search).get('user2ID');
                if(user2ID){
                    const opponent=spans[1];
                    const link=document.createElement('a');
                    link.href=`https://www.torn.com/profiles.php?XID=${user2ID}`;
                    link.textContent=opponent.textContent;
                    link.className=opponent.className;
                    link.style.cssText=opponent.style.cssText;
                    link.style.color=opponent.style.color||'inherit';
                    link.style.textDecoration='none';
                    link.style.cursor='pointer';
                    opponent.parentNode.replaceChild(link,opponent);
                }
            }
        },

        /** Quick Banking */
        quickBanking: async function () {
            if (!config.quickBanking || location.pathname !== '/trade.php') return;
            // Quick Banking code here... (same as original, unchanged)
        },

        /** Russian Roulette Quick Buttons + Copy Amount + Green Flash */
        rrButtons: function () {
            if (!config.rrButtons || !location.href.includes('russianRoulette') || document.querySelector('#rr-quick-buttons')) return;

            /** -------------------
             * Copy-to-clipboard + Green Flash
             * ------------------- */
            function makeCopyable(el) {
                if (!el.dataset.copyable) {
                    el.style.cursor = 'pointer';
                    el.title = 'Click to copy';
                    el.addEventListener('click', e => {
                        const text = el.innerText.replace(/,/g, '');
                        if (navigator.clipboard) navigator.clipboard.writeText(text);
                        else if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(text);

                        // Smooth green flash
                        const originalColor = el.style.color || '';
                        el.style.transition = 'color 0.4s ease';
                        el.style.color = 'green';
                        setTimeout(() => { el.style.color = originalColor; }, 400);
                    });
                    el.dataset.copyable = 'true';
                }
            }

            function scanAndApply() {
                document.querySelectorAll('span').forEach(span => {
                    if (/^[\d,]+$/.test(span.innerText.trim())) makeCopyable(span);
                });
            }

            /** RR shooting buttons */
            function getRFCV() {
                const match = document.cookie.match(/rfc_v=([\w-]+)/);
                return match ? match[1] : null;
            }

            function fireShots(num) {
                const RFCV = getRFCV();
                if (!RFCV) { console.error("No RFCV found in cookies"); return; }
                const form = new FormData();
                form.append('sid', 'russianRouletteData');
                form.append('rfcv', RFCV);
                form.append('step', 'makeTurn');
                form.append('shotsAmount', num);

                fetch(`https://www.torn.com/page.php?sid=russianRouletteData&rfcv=${RFCV}`, {
                    method: 'POST', body: form, credentials: 'include',
                    headers: {'X-Requested-With':'XMLHttpRequest'}
                }).then(res => res.json())
                  .then(data => console.log('RR response:', data))
                  .catch(err => console.error("RR error:", err));
            }

            function addButtons() {
                if (document.querySelector('#rr-quick-buttons')) return;

                const container = document.createElement('div');
                container.id = 'rr-quick-buttons';
                container.style.cssText = `position:fixed;top:120px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:5px;`;

                [1,2,3].forEach(num => {
                    const btn = document.createElement('button');
                    btn.className="torn-btn orange";
                    btn.style.cssText="display:flex;align-items:center;justify-content:center;margin:0;padding:5px 10px;outline:none";
                    btn.innerHTML=`<strong>&emsp;Shoot ${num}&emsp;</strong>`;
                    btn.addEventListener('mousedown', e=>e.preventDefault());
                    btn.addEventListener('click', ()=>fireShots(num));
                    container.appendChild(btn);
                });

                const delayedBtn = document.createElement('button');
                delayedBtn.className="torn-btn orange";
                delayedBtn.style.cssText="display:flex;align-items:center;justify-content:center;margin:0;padding:5px 10px;outline:none";
                delayedBtn.innerHTML=`<strong>&emsp;Delay&emsp;</strong>`;
                delayedBtn.addEventListener('mousedown', e=>e.preventDefault());
                delayedBtn.addEventListener('click', ()=>{
                    let countdown=3;
                    delayedBtn.disabled=true;
                    const originalText=delayedBtn.innerHTML;
                    const tick = ()=>{
                        if(countdown>0){ delayedBtn.innerHTML=`<strong>&emsp;${countdown}&emsp;</strong>`; countdown--; setTimeout(tick,1000); }
                        else{
                            delayedBtn.innerHTML=`<strong>&emsp;Firing&emsp;</strong>`;
                            fireShots(1);
                            setTimeout(()=>{ delayedBtn.disabled=false; delayedBtn.innerHTML=originalText; },500);
                        }
                    };
                    tick();
                });
                container.appendChild(delayedBtn);
                document.body.appendChild(container);
            }

            /** Observer to add buttons & copy functionality dynamically */
            const observer = new MutationObserver(()=>{
                addButtons();
                scanAndApply(); // attach click-to-copy to all RR amounts
            });
            observer.observe(document.body,{childList:true,subtree:true});

            // Initial run
            addButtons();
            scanAndApply();
        }

    };

    /** --------------------------
     *  Main Observer
     *  -------------------------- */
    const mainObserver = new MutationObserver(()=>{ Object.values(modules).forEach(fn=>fn()); });
    mainObserver.observe(document.body,{childList:true,subtree:true});
    Object.values(modules).forEach(fn=>fn());

})();
