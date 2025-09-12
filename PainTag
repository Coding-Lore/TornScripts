// ==UserScript==
// @name         PAIN Icon
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  PAIN icon, opens faction armoury
// @author       Lore
// @match        https://www.torn.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    function addCustomIcon() {
        const statusIconsContainer = document.querySelector('ul[class^="status-icons"]'); // Wildcard selector
        if (!statusIconsContainer || document.querySelector('#custom-status-icon')) return;

        const newIcon = document.createElement('li');
        newIcon.id = 'custom-status-icon';
        newIcon.className = 'icon';
        newIcon.style.display = 'none'; // Hide until image loads

        const newLink = document.createElement('a');
        newLink.href = 'https://www.torn.com/factions.php?step=your&type=1#/tab=armoury';
        newLink.setAttribute('aria-label', 'Custom Icon - Click to open faction armoury');

        const iconImg = document.createElement('img');
        // Use your custom images for light/dark mode
        if (document.querySelector('body').className.indexOf("dark-mode") === -1) {
            iconImg.src = 'https://i.imgur.com/kEyFIkH.png'; // Light mode
        } else {
            iconImg.src = 'https://i.imgur.com/oltWyQf.png'; // Dark mode
        }
        iconImg.alt = 'Custom Icon';
        iconImg.style.width = '17px';
        iconImg.style.height = '17px';

        newLink.appendChild(iconImg);
        newIcon.appendChild(newLink);
        statusIconsContainer.insertBefore(newIcon, statusIconsContainer.firstChild);

        iconImg.onload = () => {
            newIcon.style.display = ''; // Show when loaded
        };
    }

    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('ul[class^="status-icons"]')) {
            addCustomIcon();
            obs.disconnect();
        }
    }).observe(document.body, { childList: true, subtree: true });
})();
