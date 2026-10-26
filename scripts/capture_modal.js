const { spawn } = require('child_process');
const fs = require('fs');

async function captureModal() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\temp\\edge_cdp_profile',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const targetsRes = await fetch('http://localhost:9222/json');
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Network.enable');
    await send('Page.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Navigate to admin
    await send('Page.navigate', { url: 'http://localhost:3000/admin' });
    await new Promise((r) => setTimeout(r, 2000));

    // Click Customer Orders Tab
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const ordersBtn = btns.find(b => b.textContent.includes('Customer Orders'));
        if (ordersBtn) ordersBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Click "Bill Slip" on the first order row
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const slipBtn = btns.find(b => b.textContent.includes('Bill Slip'));
        if (slipBtn) slipBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\admin_order_slip_modal.png', Buffer.from(modalShot.data, 'base64'));
    console.log('Saved d:\\admin_order_slip_modal.png');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

captureModal().catch(console.error);
