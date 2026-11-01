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
        // 2. 获取该域名的所有 Cookies（包括 HttpOnly）
        const cookies = await chrome.cookies.getAll({ url: videoUrl });

        // 3. 转换为 Netscape 格式
        const cookieString = cookies.map(c => 
            [c.domain, c.hostOnly ? 'FALSE' : 'TRUE', c.path, c.secure ? 'TRUE' : 'FALSE',
             Math.floor(c.expirationDate || 0), c.name, c.value].join('\t')
        ).join('\n');
        
        const netscapeCookies = '# Netscape HTTP Cookie File\n' + cookieString;

        // 4. 尝试直接发送到本地 HTTP 服务
        statusEl.textContent = '正在发送到本地程序...';
        const isSuccess = await trySendToLocal(videoUrl, netscapeCookies);

        if (isSuccess) {
            statusEl.textContent = '✅ 发送成功，请查看 QisToolkit3';
            return;
        }

        // 5. HTTP 失败（说明 YtDlp 窗体没开，HTTP 服务未启动），走协议回退方案
        statusEl.textContent = '本地服务未启动，正在唤起 QisToolkit3...';
        
        // 注意：这里只传 URL 不传 Cookie，因为协议传 Cookie 极其不安全。
        const protocolUrl = `qistoolkit3://ytdlp?url=${encodeURIComponent(videoUrl)}`;
        window.open(protocolUrl, '_blank');

        // 6. 等待程序启动并初始化 HTTP 服务（给一点缓冲时间）
        statusEl.textContent = '等待本地服务就绪...';
        await new Promise(r => setTimeout(r, 1500)); // 等待 1.5 秒

        // 7. 再次尝试发送（此时程序已经被唤起，YtDlp 窗体已打开，HTTP 服务应该启动了）
        statusEl.textContent = '重试发送 Cookies...';
        const retrySuccess = await trySendToLocal(videoUrl, netscapeCookies);

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

/**
 * 尝试向本地 HTTP 服务发送数据
 */
async function trySendToLocal(url, cookies) {
    try {
        const response = await fetch('http://127.0.0.1:18888/download', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Qis-Token': 'QisToolkit3_WP_2025' // 必须与 C# 端保持一致
            },
            body: JSON.stringify({
                url: url,
                cookies: cookies
            })
        });
        return response.ok;
    } catch (e) {
        // 捕获 NetworkError（端口未监听时会触发）
        return false;
    }
}