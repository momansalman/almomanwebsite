const { spawn } = require('child_process');
const fs = require('fs');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\temp\\edge_cdp_profile_3',
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
      height: 980,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Navigate to admin login
    await send('Page.navigate', { url: 'http://localhost:3000/admin/login' });
    await new Promise((r) => setTimeout(r, 2000));

    // Click "Quick Fill Owner Login" and submit
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const quickBtn = btns.find(b => b.textContent.includes('Quick Fill Owner Login'));
        if (quickBtn) quickBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      `,
    });
    await new Promise((r) => setTimeout(r, 3500));

    // 2. Click Customer Orders Tab
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const ordersBtn = btns.find(b => b.textContent.includes('Customer Orders'));
        if (ordersBtn) ordersBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Click "+ Generate Order Slip / Bill" button with full mouse events
    const clickEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const genBtn = btns.find(b => b.textContent.includes('Generate Order Slip'));
          if (genBtn) {
            genBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            genBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            genBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return "SUCCESS_GEN_CLICKED";
          }
          return "BUTTON_NOT_FOUND";
        })()
      `,
    });
    console.log("Button click result:", clickEval.result.value);

    await new Promise((r) => setTimeout(r, 2000));

    // Take screenshot of Order Slip Modal
    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\admin_order_slip_modal.png', Buffer.from(modalShot.data, 'base64'));
    console.log('Saved d:\\admin_order_slip_modal.png');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

capture().catch(console.error);
