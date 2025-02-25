chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("in background");
    if (request.action === "sendLink") {
        fetch("https://extend-ai.vercel.app/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: request.url })
        })
        .then(response => response.json())
        .then(data => {console.log("Data -->", data);
           return sendResponse({ success: true, data })}
      )
        .catch(error => {console.log("error here");
          return sendResponse({ success: false, error })});
  
      return true; // Required for async response
    }
  });
  