// 初始化加载设置
document.addEventListener('DOMContentLoaded', async () => {
    const res = await chrome.storage.local.get(['hotkey', 'port']);
    document.getElementById('input-hotkey').value = res.hotkey || 'Home';
    document.getElementById('input-port').value = res.port || '18888';
});

// 保存设置
document.getElementById('btn-save').addEventListener('click', async () => {
    const hotkey = document.getElementById('input-hotkey').value.trim() || 'Home';
    const port = document.getElementById('input-port').value.trim() || '18888';
    
    await chrome.storage.local.set({ hotkey, port });
    document.getElementById('status').textContent = '✅ 设置已保存，页面刷新后完全生效';
    setTimeout(() => document.getElementById('status').textContent = '准备就绪', 2000);
});

// 发送请求逻辑
document.getElementById('btn-send').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    statusEl.textContent = '正在获取当前页面信息...';

    // 1. 获取当前激活的标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
        statusEl.textContent = '无法获取当前标签页';
        return;
    }

    const videoUrl = tab.url;
    const host = new URL(videoUrl).hostname;

    // 校验域名
    if (!host.includes('bilibili.com') && !host.includes('youtube.com')) {
        statusEl.textContent = '当前页面不是支持的视频网站';
        return;
    }

    statusEl.textContent = '正在提取 Cookies...';

    try {
        // 动态读取端口
        const res = await chrome.storage.local.get(['port']);
        const currentPort = res.port || '18888';

        const cookies = await chrome.cookies.getAll({ url: videoUrl });
        const cookieString = cookies.map(c => 
            [c.domain, c.hostOnly ? 'FALSE' : 'TRUE', c.path, c.secure ? 'TRUE' : 'FALSE',
             Math.floor(c.expirationDate || 0), c.name, c.value].join('\t')
        ).join('\n');
        
        const netscapeCookies = '# Netscape HTTP Cookie File\n' + cookieString;

        statusEl.textContent = '正在发送到本地程序...';
        const isSuccess = await trySendToLocal(videoUrl, netscapeCookies, currentPort);

        if (isSuccess) {
            statusEl.textContent = '✅ 发送成功，请查看 QisToolkit3';
            return;
        }

        // HTTP 失败（说明 YtDlp 窗体没开，HTTP 服务未启动），走协议回退方案
        statusEl.textContent = '本地服务未启动，正在唤起 QisToolkit3...';
        window.open(`qistoolkit3://start`, '_blank');

        statusEl.textContent = '等待本地服务就绪...';
        await new Promise(r => setTimeout(r, 1500));

        // 再次尝试发送（此时程序已经被唤起，YtDlp 窗体已打开，HTTP 服务应该启动了）
        statusEl.textContent = '重试发送 Cookies...';
        const retrySuccess = await trySendToLocal(videoUrl, netscapeCookies, currentPort);

        if (retrySuccess) {
            statusEl.textContent = '✅ 发送成功，请查看 QisToolkit3';
        } else {
            statusEl.textContent = '❌ 唤起失败或服务异常，请手动打开 QisToolkit3 的 Yt-Dlp 工具';
        }

    } catch (err) {
        console.error(err);
        statusEl.textContent = '❌ 发生错误：' + err.message;
    }
});

async function trySendToLocal(url, cookies, port) {
    try {
        const response = await fetch(`http://127.0.0.1:${port}/download`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Qis-Token': 'QisToolkit3_WP_2025'
            },
            body: JSON.stringify({ url, cookies })
        });
        return response.ok;
    } catch (e) {
        // 捕获 NetworkError（端口未监听时会触发）
        return false;
    }
}