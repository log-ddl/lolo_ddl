/* FlowKit's migrated batchexecute transport, adapted for logdd's WS replies.
 * Requests stay in the signed-in page. Cookies and WIZ tokens never leave it.
 */
const FLOW_PAGE_PATTERNS = ['https://flow.google.com/*'];
const FLOW_PROJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FLOW_BATCH_RPCS = new Set(['ogiZ0b', 'eb1hJf', 'MZZa6b', 'YhhmEf', 'jwpduf', 'Zzl0ze', 'as29s', 'maseQ', 'SPrCad']);
let flowPageTail = Promise.resolve();

// Serialize page preparation so simultaneous lanes reuse the same project tab.
// Network requests remain concurrent once the page is ready.
function withFlowPage(work) {
  const result = flowPageTail.catch(() => {}).then(work);
  flowPageTail = result.catch(() => {});
  return result;
}

async function flowBatchTab(projectId) {
  if (projectId && !FLOW_PROJECT_ID.test(projectId)) throw new Error('INVALID_FLOW_PROJECT');
  const tabs = await chrome.tabs.query({ url: FLOW_PAGE_PATTERNS });
  const target = projectId ? `https://flow.google.com/project/${projectId}` : undefined;
  let tab = target
    ? tabs.find(t => new URL(t.url).pathname === `/project/${projectId}`)
      || tabs.find(t => !/\/project\//.test(t.url))
    : tabs.find(t => !t.discarded && /\/project\//.test(t.url)) || tabs.find(t => !t.discarded) || tabs[0];
  if (!tab) tab = await chrome.tabs.create({ url: target || 'https://flow.google.com/', active: false });
  else if (target && new URL(tab.url).pathname !== `/project/${projectId}`) {
    tab = await chrome.tabs.update(tab.id, { url: target });
  } else if (tab.discarded) await chrome.tabs.reload(tab.id);
  return tab;
}

async function flowPageReady(tabId, captcha = false) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const result = await chrome.scripting.executeScript({
      target: { tabId }, world: 'MAIN', args: [captcha],
      func: needsCaptcha => location.origin === 'https://flow.google.com'
        && Boolean(globalThis.WIZ_global_data?.SNlM0e)
        && (!needsCaptcha || Boolean(globalThis.grecaptcha?.enterprise?.execute)),
    }).catch(() => []);
    if (result[0]?.result) return;
    await sleep(250);
  }
  throw new Error('FLOW_PAGE_NOT_READY: Mở project tại flow.google.com và đăng nhập lại tài khoản này.');
}

async function handleFlowProjects(msg) {
  try {
    const projectIds = await withFlowPage(async () => {
      const tabs = await chrome.tabs.query({ url: FLOW_PAGE_PATTERNS });
      const ids = tabs.map(t => /\/project\/([0-9a-f-]{36})/i.exec(t.url || '')?.[1]).filter(id => id && FLOW_PROJECT_ID.test(id));
      if (ids.length) return [...new Set(ids)];
      const tab = await flowBatchTab();
      await flowPageReady(tab.id);
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id }, world: 'MAIN',
        func: () => [...new Set([...document.documentElement.innerHTML.matchAll(/\/project\/([0-9a-f-]{36})/gi)].map(m => m[1]))].slice(0, 50),
      });
      return (result?.result || []).filter(id => FLOW_PROJECT_ID.test(id));
    });
    sendToAgent({ id: msg.id, result: { projectIds } });
  } catch (error) {
    sendToAgent({ id: msg.id, error: error.message || 'FLOW_PROJECT_LOOKUP_FAILED' });
  }
}

async function handleFlowBatchRpc(msg) {
  const params = msg.params || {};
  if (!FLOW_BATCH_RPCS.has(params.rpcid) || typeof params.freq !== 'string' || !params.freq) {
    sendToAgent({ id: msg.id, status: 400, error: 'INVALID_BATCH_RPC' });
    return;
  }
  try {
    const tab = await withFlowPage(async () => {
      const tab = await flowBatchTab(params.flowProjectId);
      await flowPageReady(tab.id, Boolean(params.captchaAction));
      return tab;
    });
    const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id }, world: 'MAIN',
        args: [params.rpcid, params.freq, params.captchaAction || null, params.match || null],
        func: async (rpcid, freq, action, match) => {
          if (location.origin !== 'https://flow.google.com') throw new Error('INVALID_FLOW_ORIGIN');
          const wiz = globalThis.WIZ_global_data || {};
          if (!wiz.SNlM0e) throw new Error('NO_AT_TOKEN');
          if (action) {
            const previous = globalThis.__logddCaptchaTail || Promise.resolve();
            let release;
            globalThis.__logddCaptchaTail = new Promise(resolve => { release = resolve; });
            await previous.catch(() => {});
            try {
              await new Promise(resolve => grecaptcha.enterprise.ready(resolve));
              const token = await grecaptcha.enterprise.execute('6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV', { action });
              if (!token) throw new Error('CAPTCHA_FAILED');
              freq = freq.split('__CAPTCHA__').join(token);
            } finally { release(); }
          }
          const query = new URLSearchParams({
            rpcids: rpcid, 'source-path': location.pathname || '/',
            'f.sid': wiz.FdrFJe || '', bl: wiz.cfb2h || '',
            hl: (document.documentElement.lang || navigator.language || 'en').split('-')[0],
            _reqid: String(Math.floor(Math.random() * 900000) + 100000), rt: 'c',
          });
          const response = await fetch(`/_/AiSandboxAngularFrontend/data/batchexecute?${query}`, {
            method: 'POST', credentials: 'include', signal: AbortSignal.timeout(110_000),
            headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'x-same-domain': '1' },
            body: new URLSearchParams({ 'f.req': freq, at: wiz.SNlM0e }),
          });
          const text = await response.text();
          if (match && response.ok) {
            // Keep every occurrence: the first can be metadata, not the media row.
            const parts = [];
            for (let pos = text.indexOf(match); pos !== -1; pos = text.indexOf(match, pos + match.length)) {
              parts.push(text.slice(pos, pos + 4000));
              if (parts.length >= 100) break;
            }
            return { status: response.status, text: parts.join('\n') };
          }
          return { status: response.status, text: text.slice(0, 32_000_000) };
        },
    });
    if (!result?.result) throw new Error('BATCH_RPC_FAILED');
    const out = result.result;
    sendToAgent({ id: msg.id, status: out.status, data: out.text });
  } catch (error) {
    sendToAgent({ id: msg.id, status: 502, error: error.message || 'BATCH_RPC_FAILED' });
  }
}
