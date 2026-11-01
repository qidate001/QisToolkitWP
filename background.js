// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCookies') {
        chrome.cookies.getAll({ url: request.url }, (cookies) => {
            // 将 Cookie 数组转换为 Netscape 字符串格式
            const cookieString = cookies.map(c => 
                [c.domain, c.hostOnly ? 'FALSE' : 'TRUE', c.path, c.secure ? 'TRUE' : 'FALSE',
                 Math.floor(c.expirationDate || 0), c.name, c.value].join('\t')
            ).join('\n');
            
            const netscapeCookies = '# Netscape HTTP Cookie File\n' + cookieString;
            
            // 将结果回传给 content.js
            sendResponse({ cookies: netscapeCookies });
        });
        
        // 返回 true 表示这是一个异步操作，保持消息通道开启
        return true; 
    }
});