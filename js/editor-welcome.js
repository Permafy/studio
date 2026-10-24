(function () {
    const config = {
        title: 'Welcome to Permafy!',
        banner: '/images/PermafyBanner.png',
        bannerAlt: 'Permafy welcome poster/banner, made by aynonyaz.',
        message: 'Permafy is a fork of PenguinMod and it adds things like new categories, extensions, blocks, and more.',
        languageNote: 'Permafy features are available only in English and Russian (at the moment).',
        credits: 'Permafy was made by aynonyaz (yes only one person) and is maintained by aynonyaz aswell.',
        checkbox: "Don't show this again",
        button: 'Continue'
    };
    const preferenceKey = 'permafy:hide-pf-welcome-v2';

    const readPreference = () => {
        try {
            return localStorage.getItem(preferenceKey) === 'true';
        } catch (error) {
            return false;
        }
    };

    const addStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .permafy-welcome-backdrop {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: grid;
                place-items: center;
                padding: 20px;
                background: rgba(18, 24, 31, .58);
            }
            .permafy-welcome-dialog {
                box-sizing: border-box;
                width: min(520px, 100%);
                max-height: min(720px, 100%);
                overflow: auto;
                padding: 24px;
                border: 1px solid rgb(255, 255, 255);
                border-radius: 8px;
                background: #4d4a4a;
                color: #ffffff;
                box-shadow: 0 18px 60px rgba(0, 0, 0, .25);
                font: 16px/1.5 system-ui, sans-serif;
            }
            .permafy-welcome-dialog img {
                display: block;
                width: 100%;
                max-height: 190px;
                object-fit: contain;
                margin: 0 auto 18px;
            }
            .permafy-welcome-dialog h2 {
                margin: 0 0 10px;
                font-size: 24px;
                line-height: 1.2;
            }
            .permafy-welcome-dialog p {
                margin: 0 0 22px;
            }
            .permafy-welcome-dialog footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                flex-wrap: wrap;
            }
            .permafy-welcome-dialog label {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            .permafy-welcome-dialog button {
                min-height: 38px;
                padding: 0 16px;
                border: 0;
                border-radius: 4px;
                background: #82b8ff;
                color: #ffffff;
                font: inherit;
                font-weight: 600;
                cursor: pointer;
            }
            .permafy-welcome-dialog button:focus-visible,
            .permafy-welcome-dialog input:focus-visible {
                outline: 3px solid #9dbfff;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    };

    const showWelcome = () => {
        if (readPreference() || document.querySelector('.permafy-welcome-backdrop')) return;
        addStyles();

        const backdrop = document.createElement('div');
        backdrop.className = 'permafy-welcome-backdrop';
        backdrop.innerHTML = `
            <section class="permafy-welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="permafy-welcome-title">
                <img src="${config.banner}" alt="">
                <h2 id="permafy-welcome-title"></h2>
                <p data-welcome-message></p>
                <p data-welcome-language></p>
                <p data-welcome-credits></p>
                <p data-welcome-terms></p>
                <footer>
                    <label><input type="checkbox"> <span></span></label>
                    <button type="button"></button>
                </footer>
            </section>
        `;

        const dialog = backdrop.querySelector('.permafy-welcome-dialog');
        const image = dialog.querySelector('img');
        image.alt = config.bannerAlt;
        dialog.querySelector('h2').textContent = config.title;
        dialog.querySelector('[data-welcome-message]').textContent = config.message;
        dialog.querySelector('[data-welcome-language]').textContent = config.languageNote;
        dialog.querySelector('[data-welcome-credits]').textContent = config.credits;
        const terms = dialog.querySelector('[data-welcome-terms]');
        terms.append('By using Permafy (the links can be down/outdated), you agree to its ');
        const termsLink = document.createElement('a');
        termsLink.href = 'https://rules.permafy.org/tos';
        termsLink.textContent = 'Terms of Service';
        termsLink.target = '_blank';
        termsLink.rel = 'noopener noreferrer';
        terms.append(termsLink, ' and ');
        const privacyLink = document.createElement('a');
        privacyLink.href = 'https://rules.permafy.org/privacy';
        privacyLink.textContent = 'Privacy Policy';
        privacyLink.target = '_blank';
        privacyLink.rel = 'noopener noreferrer';
        terms.append(privacyLink, '.');
        dialog.querySelector('label span').textContent = config.checkbox;
        const button = dialog.querySelector('button');
        button.textContent = config.button;

        const close = () => {
            if (dialog.querySelector('input').checked) {
                try {
                    localStorage.setItem(preferenceKey, 'true');
                } catch (error) {
                    // The dialog can still be dismissed when storage is unavailable.
                }
            }
            backdrop.remove();
        };

        button.addEventListener('click', close);
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) close();
        });
        document.body.appendChild(backdrop);
        button.focus();
    };

    const app = document.getElementById('app');
    if (!app) return;

    const observer = new MutationObserver(() => {
        if (!app.querySelector('[class*="menu-bar_menu-bar_"]')) return;
        observer.disconnect();
        window.setTimeout(showWelcome, 500);
    });
    observer.observe(app, {childList: true, subtree: true});
    if (app.querySelector('[class*="menu-bar_menu-bar_"]')) {
        observer.disconnect();
        window.setTimeout(showWelcome, 500);
    }
}());