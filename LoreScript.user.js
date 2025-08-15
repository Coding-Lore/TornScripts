// ==UserScript==
// @name         Lore's Cool Script
// @namespace    https://github.com/Coding-Lore/TornScripts
// @version      4.1
// @description  Zoomy Attacks, Quick Banking, Clickable name in loader, Quick RR buttons
// @author       Lore
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @match        https://www.torn.com/trade.php*
// @match        https://www.torn.com/page.php?sid=russianRoulette*
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    /*** Utility: Wait for element ***/
    async function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            if (timeout) setTimeout(() => { observer.disconnect(); reject(`Timeout waiting for ${selector}`); }, timeout);
        });
    }

    /*** Attack Page Enhancements (Zoomy + Opponent Name Link) ***/
    if (window.location.href.includes('loader.php?sid=attack&user2ID=')) {
        const topStyle = "0";
        let attackType = Number(localStorage.getItem("torn-attack-type")) || 2;

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

        const observer = new MutationObserver(() => {
            const container = document.querySelector(".titleContainer___QrlWP");
            if (container && !container.querySelector("fieldset")) {
                const buttonContainer = document.createElement("div");
                buttonContainer.innerHTML = `<fieldset>
                    <span style="padding-right:5px;">Attack type</span>
                    <input type="radio" id="leave" name="attackType" value="leave" ${attackType===1?"checked":""}><label for="leave">Leave</label>
                    <input type="radio" id="mug" name="attackType" value="mug" ${attackType===2?"checked":""}><label for="mug">Mug</label>
                    <input type="radio" id="hosp" name="attackType" value="hosp" ${attackType===3?"checked":""}><label for="hosp">Hosp</label>
                </fieldset>`;
                container.appendChild(buttonContainer);

                buttonContainer.addEventListener("click", e => {
                    let type = 0;
                    if (e.target.id==="leave") type=1;
                    else if (e.target.id==="mug") type=2;
                    else if (e.target.id==="hosp") type=3;
                    if(type>0){ localStorage.setItem("torn-attack-type", type); location.reload(); }
                });
            }

            // Link attacked player name
            const spans = document.querySelectorAll('span.userName___loAWK.user-name.left');
            if (spans.length>=2 && !spans[1].parentNode.querySelector('a')) {
                const user2ID = new URLSearchParams(window.location.search).get('user2ID');
                if(user2ID){
                    const opponent = spans[1];
                    const link = document.createElement('a');
                    link.href = `https://www.torn.com/profiles.php?XID=${user2ID}`;
                    link.textContent = opponent.textContent;
                    link.className = opponent.className;
                    link.style.cssText = opponent.style.cssText;
                    link.style.color = opponent.style.color || 'inherit';
                    link.style.textDecoration = 'none';
                    link.style.cursor = 'pointer';
                    opponent.parentNode.replaceChild(link, opponent);
                }
            }
        });

        observer.observe(document.body,{childList:true,subtree:true});
    }

    /*** Quick Banking ***/
    if (window.location.href.includes('trade.php')) {
        async function initBank() {
            const hash = window.location.hash;
            if (!hash.includes("step=view") && !hash.includes("sub_step=addmoney2")) {
                document.getElementById("customTradeBtn")?.remove();
                return;
            }

            let container;
            try { container = await waitForElement('[class*="color2"]'); }
            catch { container = document.querySelector(`[class="points-mobile___gpalH"]`)?.children[0]; }
            if (!container || document.getElementById("customTradeBtn")) return;

            const btn = document.createElement("button");
            btn.className="torn-btn orange"; btn.id="customTradeBtn"; btn.style.top="3px"; btn.style.display="block"; btn.innerHTML="<strong>&emsp;Bank&emsp;</strong>";

            btn.addEventListener("click", () => {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const tradeId = hashParams.get('ID'); if(!tradeId) return;
                const userMoneyElem = document.querySelector("#user-money"); if(!userMoneyElem) return;
                const dollars = parseInt(userMoneyElem.getAttribute('data-money')); if(!dollars||dollars===0) return;
                let leftUser = document.querySelector(`[class="user left"]`)||document.querySelector(`[class="user left tt-modified"]`);
                if(!leftUser) return;
                let tradeElem = leftUser.querySelector(`[class="name left"]`);
                let moneyInTrade = 0;
                if(tradeElem){
                    const txt=tradeElem.innerText;
                    const match = txt.match(/\$([\d,]+)/);
                    if(match && match[1]) moneyInTrade=parseInt(match[1].replace(/,/g,""));
                }
                window.location.href = `https://www.torn.com/trade.php#step=view&sub_step=addmoney2&ID=${tradeId}&amount=${dollars+moneyInTrade}`;
            });

            const wrapper = document.createElement("div");
            wrapper.style.display="flex"; wrapper.style.justifyContent="center"; wrapper.style.margin="8px 0";
            wrapper.appendChild(btn);
            container.before(wrapper);
        }

        initBank();
        const observer = new MutationObserver(() => { initBank(); });
        observer.observe(document.body,{childList:true,subtree:true});
        window.addEventListener("hashchange",()=>{initBank();});
    }

    /*** Russian Roulette Quick Buttons ***/
    if (window.location.href.includes('russianRoulette')) {
        const RFCV = '689e7d891504d';
        const addRRButtons = () => {
            if(document.querySelector('#rr-quick-buttons')) return;

            const container = document.createElement('div');
            container.id='rr-quick-buttons';
            container.style.position='fixed';
            container.style.top='120px';
            container.style.right='20px';
            container.style.zIndex='9999';
            container.style.display='flex';
            container.style.flexDirection='column';
            container.style.gap='5px';

            [1,2,3].forEach(num=>{
                const btn=document.createElement('button');
                btn.className="torn-btn orange"; btn.id=`rrShootBtn${num}`;
                btn.style.top="3px"; btn.style.display="flex";
                btn.style.alignItems="center"; btn.style.justifyContent="center";
                btn.style.margin="0"; btn.style.padding="5px 10px"; btn.style.outline="none";
                btn.innerHTML=`<strong>&emsp;Shoot ${num}&emsp;</strong>`;
                btn.addEventListener('mousedown', e=>e.preventDefault());
                btn.addEventListener('click',()=>fireShots(num));
                container.appendChild(btn);
            });

            const delayedBtn = document.createElement('button');
            delayedBtn.className="torn-btn orange"; delayedBtn.id='rrDelayedShot';
            delayedBtn.style.top="3px"; delayedBtn.style.display="flex";
            delayedBtn.style.alignItems="center"; delayedBtn.style.justifyContent="center";
            delayedBtn.style.margin="0"; delayedBtn.style.padding="5px 10px"; delayedBtn.style.outline="none";
            delayedBtn.innerHTML=`<strong>&emsp;Delay&emsp;</strong>`;
            delayedBtn.addEventListener('mousedown', e=>e.preventDefault());
            delayedBtn.addEventListener('click', ()=>{
                let countdown=3; delayedBtn.disabled=true; const original=delayedBtn.innerHTML;
                const tick=()=>{
                    if(countdown>0){ delayedBtn.innerHTML=`<strong>&emsp;${countdown}&emsp;</strong>`; countdown--; setTimeout(tick,1000);}
                    else { delayedBtn.innerHTML=`<strong>&emsp;Firing&emsp;</strong>`; fireShots(1); setTimeout(()=>{delayedBtn.disabled=false; delayedBtn.innerHTML=original;},500);}
                };
                tick();
            });

            container.appendChild(delayedBtn);
            document.body.appendChild(container);
        };

        const fireShots=(num)=>{
            const form=new FormData();
            form.append('sid','russianRouletteData');
            form.append('rfcv',RFCV);
            form.append('step','makeTurn');
            form.append('shotsAmount',num);
            fetch(`https://www.torn.com/page.php?sid=russianRouletteData&rfcv=${RFCV}`,{method:'POST',body:form,credentials:'include',headers:{'X-Requested-With':'XMLHttpRequest'}})
            .then(res=>res.json()).then(data=>console.log('RR response:',data)).catch(err=>console.error(err));
        };

        const rrObserver = new MutationObserver(()=>addRRButtons());
        rrObserver.observe(document.body,{childList:true,subtree:true});
        addRRButtons();
    }

})();
