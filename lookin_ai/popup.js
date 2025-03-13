document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("serverResponse", (data) => {
      let responseElement = document.getElementById("keyPoints");
      document.getElementById("heading").textContent = data.serverResponse.title;
      document.getElementById("description").textContent = data.serverResponse.description;
      
      if (data.serverResponse && Array.isArray(data.serverResponse.key_points)) {
        // Create a list for key points
        let ul = document.createElement("ul");
        
        data.serverResponse.key_points.forEach(point => {
          let li = document.createElement("li");
          li.textContent = point;
          ul.appendChild(li);
        });
  
        responseElement.innerHTML = ""; // Clear previous content
        responseElement.appendChild(ul); // Append the list
      } else {
        // If key_points is missing or not an array, show the raw keyPoints
        responseElement.textContent = JSON.stringify(data.serverResponse, null, 2);
      }
    });
  });
  