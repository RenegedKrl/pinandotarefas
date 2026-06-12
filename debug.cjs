const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.error('BROWSER_ERROR:', err.message));
  page.on('console', msg => { if(msg.type() === 'error') console.error('CONSOLE_ERROR:', msg.text()); });
  await page.goto('http://localhost:5173');
  // Wait for auth to be visible
  await page.waitForSelector('input[type="email"]');
  // Register or login
  await page.fill('input[type="email"]', 'debug1@test.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('text="Ainda não é um herói?"').catch(() => {}); // Try clicking register if it exists, but actually the button toggles the form.
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  // Wait for the app to load
  await page.waitForTimeout(5000);
  const html = await page.content();
  console.log(html.includes('Carregando...') ? 'Stuck on loading' : 'Loaded successfully, html length: ' + html.length);
  await browser.close();
  process.exit(0);
})();
