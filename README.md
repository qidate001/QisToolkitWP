# Qis Toolkit Web Plugin (QisToolkitWP)

> **Qis Toolkit** 生态下的 Edge 浏览器扩展，专为突破网页端权限限制而生。

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Manifest](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Platform](https://img.shields.io/badge/Platform-Edge%20%7C%20Chromium-brightgreen.svg)]()
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

`QisToolkitWP` 是与本地客户端 `QisToolkit3` 配合使用的增强型浏览器插件。相较于轻量级的 [QisToolkitWS](https://github.com/qidate001/QisToolkitWS) (油猴脚本)，WP 拥有更高的浏览器 API 权限，能够**直接提取包含 `HttpOnly` 在内的所有 Cookies**，完美解决 Bilibili、YouTube 等平台的高画质（如 1080P/4K）下载鉴权痛点。

---

## ✨ 核心特性

- 🚀 **一键抓取 & 发送**：在视频页面按下快捷键（默认 `Home`），插件会自动抓取当前站点的全量 Cookies（含登录凭证 `SESSDATA`），并静默发送给本地客户端。
- 🔒 **突破 HttpOnly 限制**：使用 `chrome.cookies` API，彻底摆脱油猴脚本 `document.cookie` 的权限束缚。
- 🌐 **智能唤起机制**：如果本地 `QisToolkit3` 未启动，插件会通过自定义协议 `qistoolkit3://start` 自动唤起客户端，并在等待 1.5 秒后无缝重试 HTTP 直连，全程无需手动操作。
- ⚙️ **高度可配置**：支持自定义快捷键（如 `Ctrl+D`）和本地通信端口，设置实时同步。
- 🎨 **优雅的视觉反馈**：内置无侵入式的网页 Toast 提示，实时反馈当前执行状态。
- 🔐 **安全校验**：HTTP 通信带有一对一的本地 `Token` 校验，防止恶意网页跨域调用你的本地服务。

---

## 🛠️ 工作原理 (闭环架构)

本插件与本地 C# 客户端 (`QisToolkit3`) 采用双通道协同机制：

1. **直连优先**：插件抓取 Cookie 后，直接向 `http://127.0.0.1:18888/download` 发送 POST 请求。
2. **协议降级**：若连接失败（说明本地 YtDlp 窗体未开启），插件发送 `qistoolkit3://start` 协议唤起本地程序。
3. **重试握手**：客户端启动并监听 18888 端口后，插件延迟 1.5s 再次发送 HTTP POST 请求，数据成功注入客户端。

---

## 📦 安装指南

### 前置要求
- 操作系统：Windows 10 / 11
- 浏览器：Microsoft Edge 或任何基于 Chromium 的浏览器
- 客户端：已安装 **QisToolkit3.exe**（确保支持 Yt-Dlp 工具与 LocalAPI）

### 开发者模式安装
由于暂未上架浏览器扩展商店，请以开发者模式加载：
1. 下载或克隆本仓库代码到本地。
2. 打开 Edge 浏览器，访问 `edge://extensions/`。
3. 开启左下角的 **“开发人员模式”**。
4. 点击 **“加载解压缩的扩展”**，选择 `QisToolkitWP` 文件夹即可。
5. 建议在扩展栏中将插件设为“固定”以便使用。

---

## 🕹️ 使用说明

1. **快捷触发**：打开任意 Bilibili 或 YouTube 视频页面，按下 `Home` 键（或你自定义的快捷键）。
2. **状态提示**：
   - 页面顶部弹出 `正在获取 Cookies...` -> `正在发送到本地程序...`。
   - 若客户端未启动，会自动唤起并提示 `等待本地服务就绪...`。
   - 最终提示 `✅ 发送成功，请查看 QisToolkit3`。
3. **自定义设置**：点击浏览器右上角的插件图标，在弹出的面板中可修改：
   - **快捷键**：支持单键（如 `F4`）或组合键（如 `Ctrl+Shift+D`）。
   - **本地端口**：默认 `18888`（需与 C# 端配置保持一致）。
   - 修改后点击“保存设置”即可实时生效。