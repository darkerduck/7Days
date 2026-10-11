# 成神七日 · Seven Days to Godhood

以原作《成神七日》改編的三十頁雙語漫畫。可切換繁體中文與英文、逐頁閱讀，並查看原尺寸對話版與無字原圖。

**線上閱讀 / Read online:** https://darkerduck.github.io/7Days/

The 30-page comic adaptation is available in Traditional Chinese and English. Switch languages at any page; the reader preserves your page number.

## 專案內容

- `成神七日.md`：原作小說。
- `成神七日-漫畫/`：原有八張漫畫圖，完整保留。
- `docs/`：新版雙語漫畫、三十張插畫與靜態閱讀器；[製作說明](docs/README.md)。

## 本機預覽與驗收

```sh
python3 docs/qa_pages.py
python3 -m http.server 8765 --directory docs
```

在瀏覽器開啟 `http://127.0.0.1:8765/`。閱讀器是純靜態網站，不需要安裝依賴或建置。
