import { openPage } from '../a11y-tests/cdp.mjs';
for (const w of [320, 375]) { const p = await openPage(process.argv[2], { width: w, height: 800 });
  console.log('CDP setDeviceMetricsOverride', w, await p.eval(`'innerWidth='+innerWidth+' mq650='+matchMedia('(max-width:650px)').matches`)); await p.close(); }
