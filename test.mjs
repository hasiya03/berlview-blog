import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE UNHANDLED ERROR:', err.message);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  console.log("Page loaded. Clicking create button...");
  
  const buttons = await page.$$('button');
  for (let btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text && (text.includes('Create Your First Blog') || text.includes('Create New Blog'))) {
      await btn.click();
      console.log("Button clicked!");
      await new Promise(r => setTimeout(r, 1000));
      const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
      console.log("ROOT HTML: ", rootHtml);
      break;
    }
  }
  
  await browser.close();
})();
