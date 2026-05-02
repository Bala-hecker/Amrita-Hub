const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating...");
  await page.goto('https://amrita-hub.vercel.app/register', { waitUntil: 'networkidle2' });
  
  console.log("Setting dummy localStorage token to simulate logged in state...");
  await page.evaluate(() => {
    localStorage.setItem('sb-bkugqqsjnrcrxgomjvda-auth-token', JSON.stringify({
      access_token: "dummy",
      refresh_token: "dummy",
      user: { id: "123", email: "test@test.com" }
    }));
  });

  console.log("Reloading...");
  await page.reload({ waitUntil: 'networkidle2' });

  const bodyHandle = await page.$('body');
  const html = await page.evaluate(body => body.innerHTML, bodyHandle);
  console.log("BODY HTML SNAPSHOT AFTER LOGIN & RELOAD:");
  console.log(html.substring(0, 500));

  await browser.close();
})();
