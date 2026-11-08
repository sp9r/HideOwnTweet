// (変更前)
// chrome.runtime.onInstalled.addListener(() => { ... });
// chrome.tabs.sendMessage(...).catch(error => { ... });
// chrome.webNavigation.onHistoryStateUpdated.addListener(...);
// chrome.tabs.onUpdated.addListener(...);

// (変更後)
browser.runtime.onInstalled.addListener(() => {
  console.log("Hide My Tweets extension installed.");
});

// URL変更を検知してcontent scriptにメッセージを送信する関数
function notifyContentScript(tabId, url) {
  browser.tabs.sendMessage(tabId, { // browser.* に変更
    action: "urlChanged",
    url: url
  }).catch(error => {
    // content scriptがまだ注入されていない場合のエラーは無視
    // Firefoxではエラーメッセージが異なる場合があるため、"Receiving end does not exist" もチェック
    if (!error.message.includes("Could not establish connection") && 
        !error.message.includes("Receiving end does not exist")) {
      console.error(error);
    }
  });
}

// SPA内でのページ遷移（History APIによるURL変更）を検知
browser.webNavigation.onHistoryStateUpdated.addListener(details => { // browser.* に変更
  if (details.frameId === 0) { // メインフレームのみを対象
    notifyContentScript(details.tabId, details.url);
  }
}, { url: [{ hostEquals: 'x.com' }] });

// 通常のページ読み込みや更新を検知
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { // browser.* に変更
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith("https://x.com/")) {
    notifyContentScript(tabId, tab.url);
  }
});