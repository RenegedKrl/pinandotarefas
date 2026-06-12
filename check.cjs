const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('pageerror', err => console.error('BROWSER_ERROR:', err.message));
    page.on('console', msg => {
      if(msg.type() === 'error') console.error('CONSOLE_ERROR:', msg.text());
    });
    await page.goto('http://localhost:5173');
    await page.waitForSelector('button', {timeout: 5000});
    const btns = await page.$$('button');
    for(let b of btns) {
      const text = await page.evaluate(el => el.textContent, b);
      if(text && text.includes('Adicionar tarefa')) {
        await b.click();
        console.log('Clicked Adicionar tarefa!');
        break;
      }
    }
    await page.waitForTimeout(2000);
    await browser.close();
  } catch(e) {
    console.error('SCRIPT_ERROR:', e);
    process.exit(1);
  }
})();
