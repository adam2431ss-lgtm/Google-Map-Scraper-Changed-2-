const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Optional self-ping: if SELF_PING_URL set, ping it every intervalMs to try to reduce cold starts.
if (process.env.SELF_PING_URL && process.env.SELF_PING_INTERVAL_MS) {
  const interval = parseInt(process.env.SELF_PING_INTERVAL_MS, 10) || 10*60*1000;
  setInterval(() => {
    axios.get(process.env.SELF_PING_URL).then(()=>{
      console.log('Self-ping OK');
    }).catch(e=>console.error('Self-ping error', e.message));
  }, interval);
}

app.get('/', (req, res) => {
  res.json({ status: 'cloudrun-gmaps-scraper ready' });
});

app.get('/scrape', async (req, res) => {
  const query = req.query.query || req.query.q;
  const limit = parseInt(req.query.limit || '20', 10);

  if (!query) return res.status(400).json({ error: 'missing query parameter. Use /scrape?query=pizza+in+new+york' });

  let browser;
  try {
    // launch options for Cloud Run (uses installed chromium)
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    // If CHROME_PATH is set, use it
    if (process.env.CHROME_PATH) {
      launchOptions.executablePath = process.env.CHROME_PATH;
    } else {
      // common locations
      const paths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome-stable'];
      // do not require fs here; let puppeteer try default and fallback
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setUserAgent(process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 60000 });

    // small wait to allow dynamic content
    await page.waitForTimeout(2500);

    const results = await page.evaluate((limit) => {
      const out = [];
      // cards container selectors may vary; try common classes
      const cards = document.querySelectorAll('div[role="article"], .Nv2PK, .hfpxzc');
      for (let i=0;i<cards.length && out.length<limit;i++) {
        const el = cards[i];
        const name = el.querySelector('div[aria-level="3"]')?.innerText
                  || el.querySelector('.qBF1Pd')?.innerText
                  || el.getAttribute('aria-label') || null;
        const category = el.querySelector('.W4Efsd')?.innerText || null;
        const address = el.querySelector('[data-item-id^="address"]')?.innerText || el.querySelector('.rllt__details')?.innerText || null;
        const rating = el.querySelector('span[aria-label*="stars"]')?.getAttribute('aria-label') || null;
        const link = (el.querySelector('a[href*="/place/"]')?.href) || null;
        out.push({ name, category, address, rating, link });
      }
      return out;
    }, limit);

    await browser.close();
    return res.json({ query, count: results.length, results });
  } catch (err) {
    console.error('Scrape error', err && err.message);
    if (browser) try{ await browser.close(); } catch(e){}
    return res.status(500).json({ error: 'scrape failed', details: err && err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
