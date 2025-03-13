chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("in background");
  //   if (request.action === "sendLink") {
  //       fetch("http://extend-ai.vercel.app/api/summary", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ url: request.url })
  //       })
  //       .then(response => response.json())
  //       .then(data => {console.log("Data -->", data);
  //          return sendResponse({ success: true, data })}
  //     )
  //       .catch(error => {console.log("error here");
  //         return sendResponse({ success: false, error })});
  
  //     return true; // Required for async response
  //   }
  // });
    // let screenwidth = screen.availHeight;
    if (request.action === "openPopup") {
      console.log('in Popup');
      chrome.storage.local.set({ serverResponse: request.data }, () => {
        // chrome.system.display.getInfo((displays) => {
        //   let screenWidth = displays[0].bounds.width;
        //   let screenHeight = displays[0].bounds.height;

        //   let popupWidth = Math.round(screenWidth/2);
        //   let popupHeight = Math.round(screenHeight);

        //   let left = Math.round(screenWidth/2);
        //   let top = 0;

        //   chrome.windows.create({
        //     url: "popup.html",
        //     type: "popup",
        //     width: popupWidth,
        //     height: popupHeight,
        //     left: left,
        //     top: top
        //   });
        // });
        chrome.windows.create({
          url: "popup.html",
          type: "panel",
          width: 380,
          height: 1000,
          // setSelfAsOpener:true
        });
      });
    }
  });
  