// ==UserScript==
// @name         Lore's Cool Script
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      5.1
// @description  Zoomy Attacks, Quick Banking, Quick RR Buttons with Copy Amount & Super-Lightweight 12hr Expiration Times
// @author       Lore
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/Coding-Lore/TornScripts/main/LoreScript.user.js
// @updateURL    https://raw.githubusercontent.com/Coding-Lore/TornScripts/main/LoreScript.user.js
// @match        https://www.torn.com/page.php?sid=attack*
// @match        https://www.torn.com/page.php*sid=attack*
// @match        https://www.torn.com/trade.php*
// @match        https://www.torn.com/page.php?sid=RussianRoulette*
// @match        https://www.torn.com/page.php?sid=russianRoulette*
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function(){
    'use strict';

    /** --------------------------
     * Feature Toggles (Modular)
     * -------------------------- */
    const config = {
        attackEnhancements: true,
        quickBanking: true,
        rrButtons: true,
        rrTimers: true,             // Expiration timestamps active
        rrVisibleButtons: [1,2,3,4] // 1=Shoot1, 2=Shoot2, 3=Shoot3, 4=Delay
    };

    /** --------------------------
     * Shared Helpers
     * -------------------------- */
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

    /** --------------------------
     * Feature Modules
     * -------------------------- */
    const modules = {

        /** Attack Enhancements */
        attackEnhancements: function(){
            if(!config.attackEnhancements || !location.href.includes('sid=attack')) return;

            let attackType = Number(localStorage.getItem("torn-attack-type")) || 2;

            // Shifted left offset slightly into negative space to snap perfectly over weapon cards
            GM_addStyle(`
                div[class*="dialog___"], div[class*="colored___"] { background: transparent !important; box-shadow: none !important; border: none !important; }
                div[class*="modelWrap___"] { max-width: 100%; }
                div[class*="player___"]:nth-child(2) div[class*="playerWindow___"] { overflow: visible; }

                /* Centered positioning over the standard 3-weapon display area */
                div[class*="dialogButtons___"] {
                    z-index: 1000; position: absolute; top: 0;
                    display: flex; left: -140px; width: 440px; justify-content: center;
                }
                div[class*="dialogButtons___"] button { margin: 0; padding: 220px 25px !important; }

                /* Keeps initial fight launch button cleanly presented */
                div[class*="dialogButtons___"] button[class*="startFight___"] {
                    padding: 12px 20px !important;
                    margin: auto;
                }

                ${attackType===1?`
                    div[class*="dialogButtons___"] button:not([class*="startFight___"]):nth-child(1){order:2;}
                    div[class*="dialogButtons___"] button:not([class*="startFight___"]):nth-child(2){order:1;}
                    div[class*="dialogButtons___"] button:not([class*="startFight___"]):nth-child(3){order:3;}
                `:attackType===3?`
                    div[class*="dialogButtons___"] button:not([class*="startFight___"]):nth-child(1){order:1;}
                    div[class*="dialogButtons___"] button:not([class*="startFight___"]):nth-child(2){order:3;}
                    div[class*="dialogButtons___"] button:not([class*="startFight___"]):nth-child(3){order:2;}
                `:''}
            `);

            // Kept toggle menu cleanly separated into the far upper left corner
            waitForElement('div[class*="titleContainer___"], div[class*="header___"]').then(container => {
                if(!container.querySelector(".lore-attack-order-settings")){
                    const div=document.createElement("div");
                    div.className = "lore-attack-order-settings";
                    div.style.cssText = "position: absolute; top: 5px; right: 5px; z-index: 99999; background: rgba(0,0,0,0.75); padding: 6px 10px; border-radius: 5px; border: 1px solid #444; font-size: 12px; color: #fff;";
                    div.innerHTML=`<fieldset style="border:none; padding:0; margin:0;">
                        <span style="padding-right:6px; font-weight:bold; color:#aaa;">Order:</span>
                        <input type="radio" id="leave" name="attackType" value="leave" ${attackType===1?"checked":""} style="vertical-align:middle; cursor:pointer;"><label for="leave" style="margin-right:6px; cursor:pointer; vertical-align:middle;">Leave</label>
                        <input type="radio" id="mug" name="attackType" value="mug" ${attackType===2?"checked":""} style="vertical-align:middle; cursor:pointer;"><label for="mug" style="margin-right:6px; cursor:pointer; vertical-align:middle;">Mug</label>
                        <input type="radio" id="hosp" name="attackType" value="hosp" ${attackType===3?"checked":""} style="vertical-align:middle; cursor:pointer;"><label for="hosp" style="cursor:pointer; vertical-align:middle;">Hosp</label>
                    </fieldset>`;
                    container.style.position = "relative";
                    container.appendChild(div);
                    div.addEventListener("click",e=>{
                        let t=0;
                        if(e.target.id==="leave") t=1;
                        else if(e.target.id==="mug") t=2;
                        else if(e.target.id==="hosp") t=3;
                        if(t>0){ localStorage.setItem("torn-attack-type",t); location.reload(); }
                    });
                }
            }).catch(e => console.log("Attack Header Error:", e));

            waitForElement('span[class*="userName___"], div[class*="headerText___"]').then(() => {
                const spans = document.querySelectorAll('span[class*="userName___"], div[class*="playerName___"]');
                if(spans.length >= 2 && !spans[1].parentNode.querySelector('a')){
                    const user2ID = new URLSearchParams(window.location.search).get('user2ID');
                    if(user2ID){
                        const opponent = spans[1];
                        const link = document.createElement('a');
                        link.href = `https://www.torn.com/profiles.php?XID=${user2ID}`;
                        link.textContent = opponent.textContent;
                        link.className = opponent.className;
                        link.style.cssText = opponent.style.cssText;
                        link.style.color = '#fff';
                        link.style.textDecoration = 'underline';
                        link.style.cursor = 'pointer';
                        opponent.parentNode.replaceChild(link, opponent);
                    }
                }
            }).catch(e => console.log("Attack Username Link Error:", e));
        },

        /** Quick Banking */
        quickBanking: function () {
            if (!config.quickBanking || location.pathname !== '/trade.php') return;

            const defaultSettings = {
                autoSync: true,
                presets: ['-100k','-500k','-1m','-10m','-100m','-1b']
            };
            let settings = JSON.parse(localStorage.getItem('quickBankingSettings') || '{}');
            settings = { ...defaultSettings, ...settings };
            const saveSettings = () => localStorage.setItem('quickBankingSettings', JSON.stringify(settings));

            const getTradePageCash = () => {
                const el = document.querySelector('.money-value');
                return el ? parseNumber(el.textContent) : 0;
            };

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

            function addGhostButtons(input, sync) {
                if (document.getElementById("ghost-trade-helper")) return;
                const container = document.createElement("div");
                container.id = "ghost-trade-helper";
                container.style.cssText = "margin-top:10px;display:flex;flex-wrap:wrap;gap:4px";

                const mkBtn = (label, action) => {
                    const b = document.createElement("button");
                    b.className = "torn-btn orange";
                    b.style.cssText = "top:3px;display:block";
                    b.innerHTML = `<strong>&emsp;${label}&emsp;</strong>`;
                    b.onclick = e => { e.preventDefault(); action(); };
                    return b;
                };

                const renderPresets = () => {
                    container.innerHTML = '';
                    settings.presets.forEach(label => {
                        const amt = parseShorthand(label.replace('-', ''));
                        container.appendChild(mkBtn(label, () => {
                            const newVal = Math.max(0, parseNumber(input.value) + (label.startsWith('-') ? -amt : amt));
                            input.value = formatNumber(newVal);
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            if (settings.autoSync) sync();
                        }));
                    });

                    container.appendChild(mkBtn('Custom', () => {
                        const val = prompt('Enter amount (e.g. 45k, 7m, 5b):');
                        if (val === null) return;
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

                    container.appendChild(mkBtn('⚙️', () => {
                        const toggle = confirm(`Auto-sync is currently ${settings.autoSync ? 'ON' : 'OFF'}. Toggle?`);
                        if (toggle) {
                            settings.autoSync = !settings.autoSync;
                            saveSettings();
                        }
                        const selected = prompt(
                            'Enter preset buttons you want (comma separated, e.g., -100k,-500k,-1m,-10m,-100m,-1b). Leave empty for none:',
                            settings.presets.join(',')
                        );
                        if (selected === null) return;
                        settings.presets = selected.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        saveSettings();
                        renderPresets();
                    }));
                };

                renderPresets();
                input.parentElement.insertAdjacentElement('afterend', container);
            }

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

            async function initBanking() {
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

            if (!document.dataset || !document.dataset.bankingObserved) {
                const bankObserver = new MutationObserver(() => { if (location.pathname === '/trade.php') initBanking(); });
                bankObserver.observe(document.body, { childList: true, subtree: true });
                window.addEventListener("hashchange", initBanking);
                document.dataset = { bankingObserved: "true" };
            }
            initBanking();
        },

        /** Russian Roulette Quick Buttons + Copy Amount + Static 12hr Expiration Times */
        rrButtons: function () {
            if (!config.rrButtons || !location.href.toLowerCase().includes('russianroulette')) return;

            function makeCopyable(el) {
                if (!el.dataset.copyable) {
                    el.style.cursor = 'pointer';
                    el.title = 'Click to copy';
                    el.addEventListener('click', e => {
                        const text = el.innerText.replace(/,/g, '');
                        if (navigator.clipboard) navigator.clipboard.writeText(text);
                        else if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(text);
                        const originalColor = el.style.color || '';
                        el.style.transition = 'color 0.4s ease';
                        el.style.color = 'green';
                        setTimeout(() => { el.style.color = originalColor; }, 400);
                    });
                    el.dataset.copyable = 'true';
                }
            }

            function attachStaticExpiration(gameRow) {
                if (!config.rrTimers || gameRow.querySelector('.rr-timer-box')) return;

                const timerBox = document.createElement('div');
                timerBox.className = 'rr-timer-box';
                timerBox.style.cssText = `margin-left: 10px; display: inline-block; padding: 2px 6px; border-radius: 4px; background: #222; color: #fff; font-size: 12px; font-weight: bold; vertical-align: middle;`;

                const expiryTime = new Date(Date.now() + 43200000);

                let hours = expiryTime.getHours();
                const minutes = expiryTime.toString().slice(17, 21);
                hours = hours % 12;
                hours = hours ? hours : 12;

                timerBox.textContent = `${hours}:${minutes}`;
                gameRow.appendChild(timerBox);
            }

            function scanAndApply() {
                const activeGames = document.querySelectorAll('li[class*="game_"], .table-row');

                activeGames.forEach(gameRow => {
                    const textElements = gameRow.querySelectorAll('span, div, p');

                    textElements.forEach(el => {
                        if (el.children.length === 0 && /^[\d,]+$/.test(el.innerText.trim()) && el.innerText.trim().length >= 4) {
                            makeCopyable(el);
                        }
                    });

                    if (!gameRow.hasAttribute('data-rr-game-id')) {
                        const uniqueId = 'rr-match-' + Math.random().toString(36).substring(2, 9);
                        gameRow.setAttribute('data-rr-game-id', uniqueId);
                        attachStaticExpiration(gameRow);
                    }
                });
            }

            function getRFCV(){ const match=document.cookie.match(/rfc_v=([\w-]+)/); return match?match[1]:null; }
            function fireShots(num){
                const RFCV=getRFCV();
                if(!RFCV){ console.error("No RFCV found"); return; }
                const form=new FormData();
                form.append('sid','russianRouletteData');
                form.append('rfcv',RFCV);
                form.append('step','makeTurn');
                form.append('shotsAmount',num);
                fetch(`https://www.torn.com/page.php?sid=russianRouletteData&rfcv=${RFCV}`, {
                    method:'POST', body:form, credentials:'include',
                    headers:{'X-Requested-With':'XMLHttpRequest'}
                }).then(res=>res.json()).then(data=>console.log('RR response:',data)).catch(err=>console.error(err));
            }

            function addButtons(){
                if(document.querySelector('#rr-quick-buttons')) return;
                const container=document.createElement('div');
                container.id='rr-quick-buttons';
                container.style.cssText=`position:fixed;top:120px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:5px;`;

                const buttonDefs = {
                    1:{ label:"Shoot 1", action:()=>fireShots(1) },
                    2:{ label:"Shoot 2", action:()=>fireShots(2) },
                    3:{ label:"Shoot 3", action:()=>fireShots(3) },
                    4:{ label:"Delay", action:(btn)=>{
                        let countdown=3;
                        btn.disabled=true;
                        const originalText=btn.innerHTML;
                        const tick = ()=>{
                            if(countdown>0){ btn.innerHTML=`<strong>&emsp;${countdown}&emsp;</strong>`; countdown--; setTimeout(tick,1000); }
                            else { btn.innerHTML=`<strong>&emsp;Firing&emsp;</strong>`; fireShots(1); setTimeout(()=>{ btn.disabled=false; btn.innerHTML=originalText; },500); }
                        };
                        tick();
                    }}
                };

                config.rrVisibleButtons.forEach(num=>{
                    const def = buttonDefs[num];
                    if(!def) return;
                    const btn=document.createElement('button');
                    btn.className="torn-btn orange";
                    btn.style.cssText="display:flex;align-items:center;justify-content:center;margin:0;padding:5px 10px;outline:none";
                    btn.innerHTML=`<strong>&emsp;${def.label}&emsp;</strong>`;
                    btn.addEventListener('mousedown', e=>e.preventDefault());
                    btn.addEventListener('click', ()=>def.action(btn));
                    container.appendChild(btn);
                });

                document.body.appendChild(container);
            }

            const rrObserver = new MutationObserver(()=>{
                addButtons();
                scanAndApply();
            });
            rrObserver.observe(document.body, {childList:true, subtree:true});

            addButtons();
            scanAndApply();
        }
    };

    // Initialize modules cleanly on load
    Object.values(modules).forEach(fn=>fn());

})();
