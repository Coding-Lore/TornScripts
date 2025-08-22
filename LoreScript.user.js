// ==UserScript==
// @name         Lore's Cool Script
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      4.9.41
// @description  Zoomy Attacks, Quick Banking, Ghost Trade Buttons, Quick RR Buttons
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
        ghostTradeButtons: true,
        rrButtons: true,
        tradeAutoSync: true
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
                dialog.style.background = 'transparent';      // remove black
                dialog.style.boxShadow = 'none';             // remove shadows
                dialog.style.border = 'none';                // remove borders
            }

            const colored = document.querySelector('.colored___sN72G');
            if (colored) {
                colored.style.background = 'transparent';    // remove green
                colored.style.boxShadow = 'none';            // remove shadows
                colored.style.border = 'none';               // remove borders
            }


            const topStyle="0";
            let attackType=Number(localStorage.getItem("torn-attack-type"))||2;

            // Zoomy attack button style
            GM_addStyle(`
                .modelWrap___j3kfA { max-width: 100%; }
                .player___wiE8R:nth-child(2) .playerWindow___aDeDI { overflow: visible; }
                .dialogButtons___nX4Bz {
                    z-index:1000; position:absolute; top:${topStyle};
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

            // Attack type selector
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

            // Clickable name (only once)
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

        /** Quick Banking Button */
        quickBanking: async function(){
            if(!config.quickBanking || location.pathname!=='/trade.php') return;
            if(document.getElementById("customTradeBtn")) return;

            if((location.hash.includes("step=view") || location.hash.includes("sub_step=addmoney2"))){
                const container=await waitForElement('[class*="color2"], .points-mobile___gpalH > :first-child');
                if(!container || document.getElementById("customTradeBtn")) return;

                const btn=document.createElement("button");
                btn.className="torn-btn orange"; btn.id="customTradeBtn"; btn.style.cssText="top:3px;display:block";
                btn.innerHTML="<strong>&emsp;Bank&emsp;</strong>";
                btn.addEventListener("click",()=>{
                    const tradeId=new URLSearchParams(location.hash.substring(1)).get('ID');
                    if(!tradeId) return;
                    const dollars=parseInt(document.querySelector("#user-money")?.dataset.money||"0");
                    if(!dollars) return;
                    let moneyInTrade=0;
                    const match=document.querySelector('.user.left .name.left')?.innerText.match(/\$([\d,]+)/);
                    if(match) moneyInTrade=parseNumber(match[1]);
                    location.href=`https://www.torn.com/trade.php#step=view&sub_step=addmoney2&ID=${tradeId}&amount=${dollars+moneyInTrade}`;
                });
                const wrap=document.createElement("div");
                wrap.style.cssText="display:flex;justify-content:center;margin:8px 0";
                wrap.appendChild(btn);
                container.before(wrap);
            }
        },

        /** Ghost Trade Buttons */
        ghostTradeButtons: async function(){
            if(!config.ghostTradeButtons || location.pathname!=='/trade.php') return;
            const input=document.querySelector('.user-id.input-money');
            if(!input || document.getElementById("ghost-trade-helper")) return;

            const mkBtn=(label,action)=>{
                const b=document.createElement("button"); b.className="torn-btn orange"; b.style.cssText="top:3px;display:block";
                b.innerHTML=`<strong> ${label} </strong>`; b.onclick=e=>{ e.preventDefault(); action(); };
                return b;
            };

            const container=document.createElement("div"); container.id="ghost-trade-helper"; container.style.cssText="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px";
            [['-100k',-100_000],['-1m',-1_000_000],['-10m',-10_000_000],['-100m',-100_000_000],['-1b',-1_000_000_000]]
            .forEach(([label,amt])=>{ container.appendChild(mkBtn(label,()=>{ input.value=formatNumber(Math.max(0,parseNumber(input.value)+amt)); input.dispatchEvent(new Event('input',{bubbles:true})); })); });

            container.appendChild(mkBtn('Custom',()=>{
                const val=prompt('Enter amount to subtract:'); if(!val) return;
                const sub=parseShorthand(val);
                input.value=formatNumber(Math.max(0,parseNumber(input.value)-sub));
                input.dispatchEvent(new Event('input',{bubbles:true}));
            }));

            container.appendChild(mkBtn('Paste',async()=>{
                try{ const text=await navigator.clipboard.readText(); const sub=parseShorthand(text);
                    input.value=formatNumber(Math.max(0,parseNumber(input.value)-sub));
                    input.dispatchEvent(new Event('input',{bubbles:true}));
                }catch{alert('Clipboard access denied.');}
            }));

            input.parentElement.insertAdjacentElement('afterend',container);
        },

        /** Auto-Sync Wallet Input */
        tradeAutoSync: function(){
            if(!config.tradeAutoSync || location.pathname!=='/trade.php') return;
            const input=document.querySelector('.user-id.input-money');
            if(!input) return;
            let lastWallet=getTradeCash(), lastInput=parseNumber(input.value);

            const apply=()=>{
                const newWallet=getTradeCash();
                if(newWallet===lastWallet) return;
                const delta=lastInput-lastWallet;
                const newVal=Math.max(0,newWallet+delta);
                input.value=formatNumber(newVal);
                input.dispatchEvent(new Event('input',{bubbles:true}));
                lastWallet=newWallet; lastInput=newVal;
            };

            const node=document.querySelector('.money-value');
            if(node) new MutationObserver(apply).observe(node,{childList:true,subtree:true});
            setInterval(apply,500);
        },

        /** Russian Roulette Quick Buttons */
        rrButtons: function(){
            if(!config.rrButtons || !location.href.includes('russianRoulette') || document.getElementById('rr-quick-buttons')) return;

            // --- Get RFCV from cookies ---
            function getRFCVFromCookie() {
                const match = document.cookie.match(/(?:rfc_v|rfc_id)=([a-f0-9]+)/);
                return match ? match[1] : null;
            }

            // --- Fire shots ---
            async function fireShots(num, btn){
                try {
                    if(btn) btn.disabled = true;
                    const RFCV = getRFCVFromCookie();
                    if(!RFCV) throw new Error("RFCV not found in cookies");

                    const form = new FormData();
                    form.append("sid","russianRouletteData");
                    form.append("rfcv", RFCV);
                    form.append("step","makeTurn");
                    form.append("shotsAmount", num);

                    const resp = await fetch(`https://www.torn.com/page.php?sid=russianRouletteData&rfcv=${RFCV}`,{
                        method:"POST",
                        body: form,
                        credentials:"include",
                        headers:{ "X-Requested-With":"XMLHttpRequest" }
                    });

                    const data = await resp.json().catch(()=>({}));
                    console.log("RR response:", data);

                } catch(err){
                    console.error("RR error:", err);
                } finally {
                    if(btn) btn.disabled = false;
                }
            }

            // --- UI container ---
            const container=document.createElement('div');
            container.id='rr-quick-buttons';
            container.style.cssText='position:fixed;top:120px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:5px;';

            // --- Shoot buttons ---
            [1,2,3].forEach(num=>{
                const btn=document.createElement('button');
                btn.className='torn-btn orange';
                btn.style.cssText='display:flex;align-items:center;justify-content:center;margin:0;padding:5px 10px;outline:none';
                btn.innerHTML=`<strong>&emsp;Shoot ${num}&emsp;</strong>`;
                btn.addEventListener('mousedown',e=>e.preventDefault());
                btn.addEventListener('click',()=>fireShots(num,btn));
                container.appendChild(btn);
            });

            // --- Delay button ---
            const delayedBtn=document.createElement('button');
            delayedBtn.className='torn-btn orange';
            delayedBtn.style.cssText='display:flex;align-items:center;justify-content:center;margin:0;padding:5px 10px;outline:none';
            delayedBtn.innerHTML=`<strong>&emsp;Delay&emsp;</strong>`;
            delayedBtn.addEventListener('mousedown',e=>e.preventDefault());
            delayedBtn.addEventListener('click',()=>{
                let countdown=3;
                delayedBtn.disabled=true;
                const original=delayedBtn.innerHTML;
                const tick=()=>{
                    if(countdown>0){
                        delayedBtn.innerHTML=`<strong>&emsp;${countdown}&emsp;</strong>`;
                        countdown--;
                        setTimeout(tick,1000);
                    } else {
                        delayedBtn.innerHTML=`<strong>&emsp;Firing&emsp;</strong>`;
                        fireShots(1,delayedBtn);
                        setTimeout(()=>{
                            delayedBtn.disabled=false;
                            delayedBtn.innerHTML=original;
                        },500);
                    }
                };
                tick();
            });
            container.appendChild(delayedBtn);

            document.body.appendChild(container);
        }
    };

    /** --------------------------
     *  Single Observer Trigger
     *  -------------------------- */
    const mainObserver=new MutationObserver(()=>{
        Object.values(modules).forEach(fn=>fn());
    });
    mainObserver.observe(document.body,{childList:true,subtree:true});

    // Run once immediately
    Object.values(modules).forEach(fn=>fn());

})();
