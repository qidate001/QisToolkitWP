// 监听键盘事件
document.addEventListener('keydown', async (e) => {
    // 1. 检查是否按下了 Home 键
    if (e.key === 'Home') {
        // 2. 如果用户正在输入框里打字（比如在发弹幕、评论），不要触发
        if (isInputFocused()) return;

        // 3. 阻止浏览器的默认“回到顶部”行为
        e.preventDefault();
        e.stopPropagation();

        // 4. 执行发送逻辑
        await sendVideoToQisToolkit();
    }
});

// 检查焦点是否在输入框或可编辑区域
function isInputFocused() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

async function sendVideoToQisToolkit() {
    const videoUrl = location.href;
    
    showToast('正在获取 Cookies...', 'info');

    try {
        // 通过消息发给 background.js 获取 Cookies
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'getCookies', url: videoUrl }, (res) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(res);
                }
            });
        });

        const netscapeCookies = response.cookies;
        if (!netscapeCookies) {
            throw new Error('获取 Cookie 失败');
        }

        showToast('正在发送到本地程序...', 'info');
        const isSuccess = await trySendToLocal(videoUrl, netscapeCookies);
        
        if (isSuccess) {
            showToast('✅ 发送成功，请查看 QisToolkit3', 'success');
            return;
        }

        // 失败则通过协议唤起程序
        showToast('本地服务未启动，正在唤起 QisToolkit3...', 'warn');
        const protocolUrl = `qistoolkit3://start`;
        window.open(protocolUrl, '_blank');
        
        showToast('等待本地服务就绪...', 'info');
        await new Promise(r => setTimeout(r, 1500));
        
        // 重试发送
        const retrySuccess = await trySendToLocal(videoUrl, netscapeCookies);
        if (retrySuccess) {
            showToast('✅ 发送成功，请查看 QisToolkit3', 'success');
        } else {
            showToast('⚠️ 程序似乎已唤起，但连接超时（可能是启动较慢），备用方案已启动', 'warn');
        }

    } catch (err) {
        console.error(err);
        showToast('❌ 发生错误: ' + err.message, 'error');
    }
}

async function trySendToLocal(url, cookies) {
    try {
        const response = await fetch('http://127.0.0.1:18888/download', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Qis-Token': 'QisToolkit3_WP_2025'
            },
            body: JSON.stringify({ url, cookies })
        });
        return response.ok;
    } catch (e) {
        return false; // 端口未监听
    }
}

// 在网页内显示 Toast 提示
function showToast(msg, type = 'info') {
    const existing = document.getElementById('qis-wp-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'qis-wp-toast';
    
    // 设置颜色
    let bg = 'rgba(30, 30, 46, 0.9)'; // 默认暗色
    if (type === 'success') bg = 'rgba(76, 175, 80, 0.9)';
    if (type === 'error') bg = 'rgba(244, 67, 54, 0.9)';
    if (type === 'warn') bg = 'rgba(255, 152, 0, 0.9)';

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${bg};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-family: 'Segoe UI', sans-serif;
        font-weight: 500;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
        backdrop-filter: blur(5px);
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}