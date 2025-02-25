// Wait for search results to load
function addButtonsToResults() {
  // Select all Google search result blocks
  let results = document.querySelectorAll("div.tF2Cxc");

  results.forEach((result) => {
      // Check if the button already exists (avoid duplication)
      if (result.querySelector(".custom-btn")) return;

      // Create a new button
      let button = document.createElement("button");
      button.innerText = "Custom Action";
      button.className = "custom-btn";

      // Get the result link
      let link = result.querySelector("a")?.href;

      // Define what happens when the button is clicked
      button.addEventListener("click", () => {
          // chrome.runtime.sendMessage({ action: "sendLink", url: link.href });
          alert(`Button clicked for giridhar: ${link}`);
          fetch("http://127.0.0.1:8080/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: link })
            })
            .then(response => response.json())
            .then(data => {console.log("Data -->", data);
               return sendResponse({ success: true, data })}
          )
            .catch(error => {console.log("error here");
              return sendResponse({ success: false, error })});
      
      });

      // Append button to each result
      result.appendChild(button);
  });
}

// Run the function when the page loads
addButtonsToResults();

// Observe DOM changes (for infinite scrolling results)
const observer = new MutationObserver(addButtonsToResults);
observer.observe(document.body, { childList: true, subtree: true });
