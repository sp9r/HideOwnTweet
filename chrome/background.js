chrome.runtime.onInstalled.addListener(() => {
  console.log("Hide My Tweets extension installed.");
});

// URL変更を検知してcontent scriptにメッセージを送信する関数
function notifyContentScript(tabId, url) {
  chrome.tabs.sendMessage(tabId, {
    action: "urlChanged",
    url: url
  }).catch(error => {
    // content scriptがまだ注入されていない場合のエラーは無視
    if (!error.message.includes("Could not establish connection")) {
      console.error(error);
    }
  });
}

// SPA内でのページ遷移（History APIによるURL変更）を検知
chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  if (details.frameId === 0) { // メインフレームのみを対象
    notifyContentScript(details.tabId, details.url);
  }
}, { url: [{ hostEquals: 'x.com' }] });

// 通常のページ読み込みや更新を検知
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith("https://x.com/")) {
    notifyContentScript(tabId, tab.url);
  }
});