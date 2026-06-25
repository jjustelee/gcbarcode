chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !tab.url.startsWith("https://inventory.coupang.com/")) {
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [
      "vendor/JsBarcode.all.min.js",
      "new-tote-helper.js"
    ]
  });
});
