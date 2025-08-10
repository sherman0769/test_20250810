# 個人畫廊系統 (Personal Gallery System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18-blue.svg)](https://nodejs.org/)

> 一個可本機或上線部署的極簡相簿系統。前台以 12 宮格顯示圖片，後台提供拖放上傳、即時覆蓋指定格位的功能。透過 SSE 技術，前台能自動刷新，無需手動整理。系統內建版本歷史、圖片最佳化、基本安全防護與每日備份。

---

## ✨ 核心功能

*   **控制頁拖放上傳**：直覺選擇 1–12 格，一鍵替換圖片。
*   **即時更新**：採用 Server-Sent Events (SSE)，前台無需重整即可自動更新圖片，並有效破除瀏覽器快取。
*   **圖片標準化**：上傳後自動等比縮放、移除 EXIF、並產生網頁適用縮圖。
*   **版本控制**：每次上傳皆自動保留前一版本，支援一鍵還原。
*   **每日備份**：自動建立當日歸檔，並保留最近 14 天的備份。
*   **安全機制**：提供密碼保護的控制頁、檔案類型/大小驗證、請求節流與操作日誌。

---

## 🚀 快速啟動

### 1. 系統需求

*   Node.js 18+ (建議使用 LTS 版本)
*   支援 Windows, macOS, Linux
*   首次安裝 `sharp` 套件時，可能需要基本編譯環境 (如 build-essentials, Visual Studio Build Tools)。

### 2. 安裝

從終端機進入專案目錄，執行：
```bash
npm install
```

### 3. 設定環境變數

控制頁密碼與其他設定值透過環境變數載入。

**方法一：建立 `.env` 檔案 (推薦)**

在專案根目錄建立一個名為 `.env` 的檔案，並填入以下內容：

```dotenv
# .env
PORT=3000
ADMIN_PASSWORD="your-strong-password-here"
MAX_MB=10
ALLOWED_TYPES="image/jpeg,image/png,image/webp"
```
**重要：** 請務必將 `ADMIN_PASSWORD` 更換為一個安全的密碼。

**方法二：在終端機設定**

*   **macOS/Linux:**
    ```bash
    export ADMIN_PASSWORD="your-strong-password-here"
    export PORT="3000"
    node server.js
    ```
*   **Windows PowerShell:**
    ```powershell
    $env:ADMIN_PASSWORD="your-strong-password-here"
    $env:PORT="3000"
    node server.js
    ```

### 4. 啟動服務

```bash
node server.js
```

### 5. 開啟瀏覽器

*   **前台畫廊**：[`http://localhost:3000`](http://localhost:3000)
*   **後台管理**：[`http://localhost:3000/control`](http://localhost:3000/control) (需輸入您設定的 `ADMIN_PASSWORD`)

---

## 📝 使用流程

1.  前往 **控制頁**，輸入密碼登入。
2.  選擇要更新的 **slot (1–12)**。
3.  **拖放圖片** 或點擊卡片選取檔案 (支援 JPG/PNG/WebP，大小需 ≤ `MAX_MB`)。
4.  上傳前可預覽圖片，系統會顯示檔案檢查結果。
5.  點擊「**上傳**」，進度條跑完後即完成。
6.  **前台頁面將在 3 秒內自動更新**，無需手動刷新。
7.  若不滿意，可點擊「**回復上一版**」還原。

---

<details>
<summary>📂 專案結構</summary>

```
.
├── .env                      # 環境變數設定檔 (建議)
├── package.json
├── server.js                 # 主要後端服務
├── config/
│   └── manifest.json         # 12 格的版本資訊與中繼資料
├── public/
│   ├── index.html            # 前台畫廊
│   ├── control.html          # 後台控制頁
│   ├── css/style.css
│   ├── js/gallery.js         # 前台互動 (SSE, Lightbox)
│   └── js/control.js         # 後台互動 (上傳, 預覽)
├── images/
│   └── slot1.jpg ...         # 前台實際讀取的 12 張圖
├── storage/
│   ├── originals/            # 歷史原檔
│   ├── thumbs/               # 控制頁縮圖
│   └── backup/               # 每日備份
├── logs/
│   └── YYYY-MM-DD.log        # 每日操作日誌
└── README.md
```
> **注意**：初次啟動時，若 `public/images/` 目錄為空，可先放置佔位圖，或直接由控制頁上傳後自動產生。

</details>

<details>
<summary>⚙️ API 路由與規則</summary>

| 方法   | 路徑                     | 說明                                          |
| :--- | :--------------------- | :------------------------------------------ |
| GET  | `/`                    | 前台畫廊頁                                       |
| GET  | `/control`             | 控制頁（需密碼）                                    |
| GET  | `/manifest.json`       | 讀取目前 slot 狀態與版本                             |
| GET  | `/events`              | **SSE 事件流**：有更新/回復時推送 `{slot, version}` |
| POST | `/upload?slot=<1..12>` | 上傳並替換指定格位                                   |
| POST | `/revert?slot=<1..12>` | 回復上一版                                      |

#### 上傳規則

*   **型別**：`image/jpeg`, `image/png`, `image/webp` (包含「魔術位元組」檢查)。
*   **大小**：≤ `MAX_MB` MB。
*   **標準化**：圖片長邊將被縮放至 1600px (品質 82)，移除 EXIF，並統一輸出為 JPG 格式至 `public/images/slotX.jpg`。
*   **縮圖**：同步產生約 400px 寬的縮圖至 `storage/thumbs/slotX.jpg`。
*   **版本**：`manifest.json` 中對應 slot 的 `version` 會 +1，並透過 SSE 通知前台更新。

#### HTTP 回應碼

*   `200` 成功
*   `400` 請求無效 (缺少 `slot` 或檔案)
*   `401` 未授權 (密碼錯誤)
*   `413` 檔案過大
*   `415` 檔案類型不支援
*   `429` 請求過於頻繁
*   `500` 伺服器內部錯誤

</details>

<details>
<summary>✔️ 驗收清單 (QA Checklist)</summary>

- [ ] 進入 `/control`，輸入密碼後可見 12 張卡片。
- [ ] 拖放一張合規的圖片 (如 ≤10MB 的 PNG/JPG) 到 slot 3 → 上傳成功 → 前台在 3 秒內自動更新圖片。
- [ ] 連續上傳 3 次 → `manifest.json` 中該 slot 的 `version` 應增加 3，且前台圖片 URL (`?v=...`) 會隨之變化。
- [ ] 上傳一個 `.txt` 或偽裝副檔名的檔案 → 應回傳 415 錯誤。
- [ ] 上傳超過 `MAX_MB` 的檔案 → 應回傳 413 錯誤。
- [ ] 點擊「回復上一版」→ 前台圖片即時還原。
- [ ] 系統會自動建立 `storage/backup/YYYYMMDD/` 備份目錄。
- [ ] 執行超過 14 天後，舊的備份會被自動清除。

</details>

---

## 🔧 設定詳解 (環境變數)

| 變數               | 預設值                               | 說明                                     |
| :--------------- | :--------------------------------- | :--------------------------------------- |
| `PORT`           | `3000`                             | 伺服器監聽的埠號                           |
| `ADMIN_PASSWORD` | (無預設，**必須設定**)                  | 控制頁的登入密碼                           |
| `MAX_MB`         | `10`                               | 上傳檔案的大小上限 (MB)                    |
| `ALLOWED_TYPES`  | `image/jpeg,image/png,image/webp`  | 允許的 [MIME 型別](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) |

> **生產環境建議**：若要長期部署，建議使用系統服務 (如 PM2, systemd) 來管理環境變數，避免將其寫死或遺留在 shell 歷史紀錄中。

---

## 💡 疑難排解 (Troubleshooting)

*   **上傳成功但前台不更新？**
    *   檢查瀏覽器開發者工具的網路分頁，確認 `GET /events` 的 SSE 連線是否正常。
    *   手動檢視 `config/manifest.json`，確認 `version` 是否已更新。
    *   嘗試強制刷新 (`Ctrl/Cmd + Shift + R`) 以排除本機快取問題。

*   **無法安裝 `sharp` 套件？**
    *   請確保 Node.js 為最新的 LTS 版本。
    *   Windows 用戶請先安裝 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)。
    *   刪除 `node_modules` 和 `package-lock.json` 後，再試一次 `npm install`。

*   **密碼無法登入？**
    *   若未使用 `.env` 檔案，請確認環境變數已在**當前的終端機 session** 中設定。
    *   Windows 使用者若透過 `setx` 設定，需重開一個新的終端機視窗才會生效。

---

## 🗺️ 未來藍圖 (Roadmap)

*   [ ] 多使用者權限與審核流程
*   [ ] 自訂格數、排序與拖曳重排功能
*   [ ] 圖片標題與描述的 SEO 友善展示
*   [ ] 提供 Dockerfile 與 CI/CD 範例

---

## 📜 授權

本專案採用 [MIT License](https://opensource.org/licenses/MIT)。

---

## 🙏 致謝

感謝所有開源社群的貢獻，特別是 Node.js 生態系。也感謝您對此極簡實用架構的關注與測試。