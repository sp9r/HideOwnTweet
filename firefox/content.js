let observer = null;
let mutedUsers = [];
const hiddenElements = new Set();

/**
 * 非表示にした全要素を再表示する関数
 */
const showAllHiddenElements = () => {
  hiddenElements.forEach(element => {
    element.style.display = '';
  });
  hiddenElements.clear();
};

/**
 * 指定されたツイートがミュート対象ユーザーのものか判定し、非表示にする関数
 * @param {HTMLElement} tweet - <article>要素
 */
const hideTweet = (tweet) => {
  if (!mutedUsers.length || !tweet) return;

  // mutedUsers配列のいずれかのユーザーに一致するかどうかをチェック
  const isMuted = mutedUsers.some(user =>
    tweet.querySelector(`a[href="/${user}"]`) || tweet.querySelector(`a[href^="/${user}/status/"]`)
  );

  if (isMuted) {
    // ツイート全体を囲むコンテナを探して非表示にする
    const tweetContainer = tweet.closest('div[data-testid="cellInnerDiv"]');
    const elementToHide = tweetContainer || tweet;
    elementToHide.style.display = 'none';
    hiddenElements.add(elementToHide);
  }
};

/**
 * DOMの変更を監視し、新しく追加されたツイートを処理するコールバック
 */
const mutationCallback = (mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches('article')) {
            hideTweet(node);
          } else {
            node.querySelectorAll('article').forEach(hideTweet);
          }
        }
      });
    }
  }
};

/**
 * (★修正) 
 * 現在のURLがツイートを非表示にすべきページ
 * (/home または パスに 'compose' を含む) かを判定する関数
 */
const shouldHideTweets = (url) => {
  try {
    const currentUrl = new URL(url);
    const pathname = currentUrl.pathname;
    // /home ページ、または URLパスに 'compose' が含まれる場合
    // (例: /compose/tweet, /messages/compose)
    return pathname === '/home' || pathname.includes('compose');
  } catch (e) {
    return false;
  }
};

/**
 * ツイートの表示・非表示と監視（Observer）を管理するメイン関数
 * (★修正) 判定関数を shouldHideTweets に変更
 */
const setupObserver = (url) => {
  if (shouldHideTweets(url) && mutedUsers.length > 0) {
    // 既存のツイートをスキャンして非表示にする
    document.querySelectorAll('article').forEach(hideTweet);
    
    // Observerがなければ起動する
    if (!observer) {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        observer = new MutationObserver(mutationCallback);
        observer.observe(mainContent, { childList: true, subtree: true });
      }
    }
  } else {
    // (★修正)
    // /home でも 'compose' を含むURLでもないページ (プロフィール等) に来た場合
    // 非表示にしたものを全て元に戻し、監視を停止
    showAllHiddenElements();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
};

/**
 * 拡張機能の動作を開始する関数
 */
const kickstart = (url) => {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    setupObserver(url);
  } else {
    // main要素がまだ描画されていない場合、出現するまで待つ
    const initialObserver = new MutationObserver((mutations, obs) => {
      if (document.querySelector('main')) {
        setupObserver(url);
        obs.disconnect(); // main要素が見つかったらこの監視は不要
      }
    });
    initialObserver.observe(document.body, { childList: true, subtree: true });
  }
};

/**
 * 拡張機能の初期化処理
 */
const initialize = async () => { // async を追加
  // 1. ストレージからミュートリストを読み込む
  try {
    const data = await browser.storage.sync.get({ mutedUsers: [] }); // browser.* と await に変更
    mutedUsers = data.mutedUsers;
    kickstart(window.location.href);
  } catch (e) {
    console.error(e);
  }

  // 2. ポップアップでの設定変更を検知し、動的に反映させる
  browser.storage.onChanged.addListener((changes, namespace) => { // browser.* に変更
    if (namespace === 'sync' && changes.mutedUsers) {
      mutedUsers = changes.mutedUsers.newValue || [];
      showAllHiddenElements();
      setupObserver(window.location.href);
    }
  });

  // 3. ページ内遷移を監視するリスナーを登録
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => { // browser.* に変更
    if (request.action === "urlChanged") {
      setupObserver(request.url);
    }
    return true;
  });
};

initialize();