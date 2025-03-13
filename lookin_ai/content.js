// Wait for search results to load
function addButtonsToResults() {
  // Select all Google search result blocks
  let results = document.querySelectorAll("div.tF2Cxc");

  results.forEach((result) => {
      // Check if the button already exists (avoid duplication)
      if (result.querySelector(".custom-btn")) return;

      // Create a new button
      let button = document.createElement("button");
      button.innerText = "Preview";
      button.className = "custom-btn";

      // Get the result link
      let link = result.querySelector("a")?.href;

      // Define what happens when the button is clicked
      button.addEventListener("click", () => {
          fetch("https://extend-ai.vercel.app/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: link })
            })
            .then(response => response.json())
            .then(data => {console.log("Data -->", data);
            chrome.runtime.sendMessage({ action: "openPopup", data }); // Send data to background.js
              }
          )
            .catch(error => {console.log("error here", error);
              });
      
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
