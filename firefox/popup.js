// (変更前)
// const loadMutedUsers = () => {
//     chrome.storage.sync.get({ mutedUsers: [] }, (data) => {
//         // ...処理...
//     });
// };

// (変更後)
document.addEventListener('DOMContentLoaded', () => {
    const newUsernameInput = document.getElementById('new-username');
    const addButton = document.getElementById('add');
    const mutedList = document.getElementById('muted-list');

    /**
     * ストレージからミュートユーザーリストを読み込み、画面に表示する関数
     */
    const loadMutedUsers = async () => { // async を追加
        try {
            const data = await browser.storage.sync.get({ mutedUsers: [] }); // browser.* と await を使用
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
        } catch (e) {
            console.error(e);
        }
    };

    /**
     * ユーザーをミュートリストに追加する関数
     */
    const addUser = async () => { // async を追加
        const username = newUsernameInput.value.trim().replace(/^@/, '');
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        try {
            const data = await browser.storage.sync.get({ mutedUsers: [] }); // browser.* と await
            const mutedUsers = data.mutedUsers;
            if (!mutedUsers.includes(username)) {
                mutedUsers.push(username);
                await browser.storage.sync.set({ mutedUsers: mutedUsers }); // browser.* と await
                newUsernameInput.value = '';
                loadMutedUsers();
            } else {
                alert(`'${username}' is already in the mute list.`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    /**
     * ユーザーをミュートリストから削除する関数
     */
    const removeUser = async (username) => { // async を追加
        try {
            const data = await browser.storage.sync.get({ mutedUsers: [] }); // browser.* と await
            const updatedUsers = data.mutedUsers.filter(user => user !== username);
            await browser.storage.sync.set({ mutedUsers: updatedUsers }); // browser.* と await
            loadMutedUsers();
        } catch (e) {
            console.error(e);
        }
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