/* Revised from github.com/aaronrs2002/rss-aggregator/js/functionality.js
 * Load DOMPurify before this script to display sanitized article HTML.
 * Without DOMPurify, article bodies are shown as plain text (safe fallback).
 */
const paths = [{ rssEndpoint: 'https://mechanized-aesthetics.net/php-relays/public-relay.php?q=' }];
const DEFAULT_FEEDS = [
    { name: 'aaronrs2002-blog', address: 'https://aaronrstst.blogspot.com/feeds/posts/default?alt=rss' },
    { name: 'All NASA', address: 'https://www.nasa.gov/feed/' },
    /*{ name: 'Yahoo News', address: 'http://news.yahoo.com/rss' },*/
    { name: 'My Discussions with AI', address: 'https://discussionswithai.blogspot.com/feeds/posts/default?alt=rss' },
    { name: 'The Missing Details', address: 'https://the-missing-details.blogspot.com/feeds/posts/default?alt=rss' },
    { name: 'web-presence.biz blog', address: 'https://web-presence-news.blogspot.com/feeds/posts/default?alt=rss' }
];
let obj = [];
let search = '';
let currentRequest = 0; // Ignore stale responses when switching feeds quickly.

function savedFeeds() {
    try {
        const value = JSON.parse(localStorage.getItem('RSS_SAVED') || '[]');
        return Array.isArray(value) ? value.filter(f => f && typeof f.address === 'string' && typeof f.name === 'string') : [];
    } catch (_) {
        return [];
    }
}
function validFeedAddress(address) {
    try {
        const url = new URL(address);
        return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
    } catch (_) { return false; }
}
function showError(message) {
    if (typeof globalAlert === 'function') globalAlert('alert-warning', message);
    else console.warn(message);
}
function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}
function safeArticleLink(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
}

async function grabData(whichAddress) {
    const isNew = whichAddress == null;
    const address = (isNew ? document.getElementById('feedAddress').value : whichAddress).trim();
    if (!validFeedAddress(address)) {
        showError('Please provide a valid HTTP or HTTPS RSS address.');
        return false;
    }
    const requestId = ++currentRequest;
    try {
        const response = await fetch(paths[0].rssEndpoint + encodeURIComponent(address));
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        if (!Array.isArray(data) || !data.length || !data.some(item => item && typeof item.title === 'string')) {
            throw new Error('This RSS feed did not return recognizable articles.');
        }
        if (requestId !== currentRequest) return false;
        obj = data;
        document.getElementById('titleTarget').textContent = 'Active feed: ' + address;
        document.querySelector("[name='filter']")?.classList.remove('hide');
        document.getElementById('feedAddress').value = '';
        window.location.hash = '';
        localStorage.setItem('lastRss', address);
        renderArticles();
        if (isNew) {
            const existing = [...DEFAULT_FEEDS, ...savedFeeds()];
            if (!existing.some(feed => feed.address === address)) {
                localStorage.setItem('RSS_SAVED', JSON.stringify([...savedFeeds(), { name: address, address }]));
            }
            buildRSSlist(false); // Rebuild list without fetching the feed again.
        }
        selectArticle(0);
        return true;
    } catch (error) {
        if (requestId === currentRequest) showError('Unable to load feed: ' + error.message);
        return false;
    }
}

function renderArticles() {
    const target = document.getElementById('objTarget');
    target.replaceChildren();
    obj.forEach((article, i) => {
        const li = makeElement('li', 'list-group-item');
        li.dataset.num = i;
        const label = makeElement('label', 'pointer', article.title || 'Untitled article');
        label.addEventListener('click', () => selectArticle(i));
        const details = makeElement('div', 'hide');
        details.dataset.article = i;
        const content = makeElement('div');
        content.dataset.descriptionarget = i; // Preserve original attribute name.
        details.appendChild(content);
        const small = makeElement('small');
        const italic = makeElement('i', '', (article.pubDate || '') + ' - ');
        const link = safeArticleLink(article.link);
        if (link) {
            const anchor = makeElement('a', '', 'Article Link');
            anchor.href = link;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            italic.appendChild(anchor);
        }
        small.appendChild(italic);
        details.appendChild(small);
        li.append(label, details);
        target.appendChild(li);
    });
    searchBuzzWord();
}

function buildRSSlist(loadSelected = true) {
    const feeds = [...DEFAULT_FEEDS, ...savedFeeds()];
    const target = document.getElementById('rssListTarget');
    target.replaceChildren();
    const seen = new Set();
    feeds.forEach((feed, index) => {
        if (seen.has(feed.address)) return;
        seen.add(feed.address);
        const li = makeElement('li', 'list-group-item');
        if (index >= DEFAULT_FEEDS.length) {
            const button = makeElement('button', 'btn btn-danger btn-sm');
            button.type = 'button';
            button.setAttribute('aria-label', 'Delete ' + feed.name);
            const icon = makeElement('i', 'fas fa-trash');
            button.appendChild(icon);
            button.addEventListener('click', () => deleteItem(feed.name));
            li.append(button, ' ');
        }
        const label = makeElement('span', 'pointer text-break', feed.name.replace(/^https?:\/\//, '').replace(/^www\./, '').substring(0, 35) + '...');
        label.addEventListener('click', () => grabData(feed.address));
        li.appendChild(label);
        target.appendChild(li);
    });
    if (loadSelected) {
        const previous = localStorage.getItem('lastRss');
        const selected = feeds.some(f => f.address === previous) ? previous : DEFAULT_FEEDS[0].address;
        grabData(selected);
    }
}

function searchBuzzWord() {
    const input = document.querySelector("input[name='filter']");
    const term = (input?.value || '').toLowerCase();
    obj.forEach((article, i) => {
        const li = document.querySelector(`#objTarget li[data-num='${i}']`);
        if (!li) return;
        const searchable = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
        li.classList.toggle('hide', !searchable.includes(term));
    });
}

function deleteItem(name) {
    localStorage.setItem('RSS_SAVED', JSON.stringify(savedFeeds().filter(feed => feed.name !== name)));
    const remaining = [...DEFAULT_FEEDS, ...savedFeeds()];
    const last = localStorage.getItem('lastRss');
    buildRSSlist(!remaining.some(feed => feed.address === last));
}

function selectArticle(num) {
    const article = obj[Number(num)];
    if (!article) return;
    document.querySelectorAll('[data-article]').forEach(el => el.classList.add('hide'));
    document.querySelectorAll('[data-descriptionarget]').forEach(el => el.replaceChildren());
    const target = document.querySelector(`[data-descriptionarget='${Number(num)}']`);
    if (target) {
        const content = String(article.description || '');
        if (window.DOMPurify) target.innerHTML = window.DOMPurify.sanitize(content);
        else target.textContent = content; // Never render untrusted HTML unsanitized.
    }
    document.querySelector(`[data-article='${Number(num)}']`)?.classList.remove('hide');
}

buildRSSlist();
