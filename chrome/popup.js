document.addEventListener('DOMContentLoaded', () => {
    const newUsernameInput = document.getElementById('new-username');
    const addButton = document.getElementById('add');
    const mutedList = document.getElementById('muted-list');

    /**
     * ストレージからミュートユーザーリストを読み込み、画面に表示する関数
     */
    const loadMutedUsers = () => {
        chrome.storage.sync.get({ mutedUsers: [] }, (data) => {
            mutedList.innerHTML = ''; // リストを一旦クリア
            data.mutedUsers.forEach(username => {
                const li = document.createElement('li');
                li.textContent = username;

                const removeBtn = document.createElement('span');
                removeBtn.textContent = '✖';
                removeBtn.className = 'remove-btn';
                removeBtn.title = `Remove ${username}`;
                removeBtn.addEventListener('click', () => {
                    removeUser(username);
                });

                li.appendChild(removeBtn);
                mutedList.appendChild(li);
            });
        });
    };

    /**
     * ユーザーをミュートリストに追加する関数
     */
    const addUser = () => {
        // 先頭の @ は自動的に削除
        const username = newUsernameInput.value.trim().replace(/^@/, '');
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        chrome.storage.sync.get({ mutedUsers: [] }, (data) => {
            const mutedUsers = data.mutedUsers;
            if (!mutedUsers.includes(username)) {
                mutedUsers.push(username);
                chrome.storage.sync.set({ mutedUsers: mutedUsers }, () => {
                    newUsernameInput.value = '';
                    loadMutedUsers();
                });
            } else {
                alert(`'${username}' is already in the mute list.`);
            }
        });
    };

    /**
     * ユーザーをミュートリストから削除する関数
     */
    const removeUser = (username) => {
        chrome.storage.sync.get({ mutedUsers: [] }, (data) => {
            const updatedUsers = data.mutedUsers.filter(user => user !== username);
            chrome.storage.sync.set({ mutedUsers: updatedUsers }, () => {
                loadMutedUsers();
            });
        });
    };

    // "Add"ボタンのクリックイベント
    addButton.addEventListener('click', addUser);

    // 入力欄でEnterキーが押されたときも追加処理を実行
    newUsernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addUser();
        }
    });

    // ポップアップを開いたときにリストを読み込む
    loadMutedUsers();
});