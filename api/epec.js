import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.goto('https://www.epec.com.ar/actualidad/trabajos-mejoras', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    const html = await page.content();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=600');
    res.status(200).send(html);
  } catch (e) {
    res.status(500).send('Error render EPEC: ' + e.message);
  } finally {
    if (browser) await browser.close();
  }
}
