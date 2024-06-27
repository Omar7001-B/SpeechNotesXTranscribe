// ==UserScript==
// @name         SpeechNotesXTranscribe
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Ensure a box has a fixed width, larger font, and is never hidden on Speechnotes.co
// @author       Omar Abbas
// @match        https://speechnotes.co/dictate/*
// @grant        none
// @homepageURL  https://github.com/Omar7001-B/SpeechNotesXTranscribe/
// ==/UserScript==

(function () {
  "use strict";
  let previousOutputLength =
    document.querySelector("#results_box").value.length;
  let lastMirrorContent = ""; // Variable to store the last content of #mirror

  let outputSplit = "\n------------------------\n";

  function updateDivWithText() {
    const resultsBox = document.querySelector("#results_box");
    const newDiv = document.querySelector("#results_div");
    const outputSplit = "\n------------------------\n";

    // Split the text content by the delimiter
    const parts = resultsBox.value.split(outputSplit);

    // Clear the new div content
    newDiv.innerHTML = "";

    // Process each part to make words clickable
    parts.forEach((part, index) => {
      const paragraph = document.createElement("p");
      paragraph.style.marginBottom = "5px"; // Add some space between paragraphs

      // Split part into words
      const words = part.trim().split(/\s+/);

      // Create clickable spans for each word
      words.forEach((word) => {
        if (word) {
          // Check if word is not empty
          const span = document.createElement("span");
          span.textContent = word + " "; // Add a space after each word for separation
          span.style.cursor = "pointer";
          span.style.color = "black"; // Normal color
          span.addEventListener("click", function () {
            const url = `https://translate.google.com/?sl=en&tl=ar&text=${encodeURIComponent(
              this.textContent.trim()
            )}&op=translate`;
            window.open(url, "_blank");
          });
          span.addEventListener("mouseover", function () {
            this.style.color = "blue"; // Change color on hover
          });
          span.addEventListener("mouseout", function () {
            this.style.color = "black"; // Restore normal color on mouseout
          });
          paragraph.appendChild(span);
        }
      });

      newDiv.appendChild(paragraph);

      // Add line break after each paragraph except the last one
      if (index < parts.length - 1) {
        newDiv.appendChild(document.createElement("br"));
      }

      newDiv.scrollTop = newDiv.scrollHeight; // Scroll to the bottom
    });
  }

  // Function to check and update the value
  function checkAndUpdateOutputBox() {
    let resultsBox = document.querySelector("#results_box");
    let currentLength = resultsBox.value.length; // Define currentLength here
    if (currentLength !== previousOutputLength) {
      resultsBox.value = resultsBox.value + outputSplit;
      previousOutputLength =
        document.querySelector("#results_box").value.length;
    }
  }

  // Function to convert words to clickable text
  function convertWordsToClickableText() {
    const mirror = document.querySelector("#mirror");
    const newDiv = document.querySelector("#results_div");

    if (mirror) {
      const textContent = mirror.textContent.trim();
      if (textContent === lastMirrorContent) return; // Exit if content hasn't changed
      // Scroll to the bottom of the element
      mirror.scrollTop = mirror.scrollHeight;

      lastMirrorContent = textContent; // Update lastMirrorContent
      checkAndUpdateOutputBox();
      updateDivWithText(); // Updates the new ouput div with the text content

      const words = textContent.split(/\s+/).filter(Boolean); // Split by whitespace and filter out empty strings
      const clickableContent = words
        .map((word) => {
          return `<span class="clickable-word" style="cursor: pointer;">${word}</span>`;
        })
        .join(" ");

      mirror.innerHTML = clickableContent;

      // Add event listener to handle clicks on clickable words
      mirror.querySelectorAll(".clickable-word").forEach((word) => {
        word.addEventListener("click", function () {
          const url = `https://translate.google.com/details?sl=en&tl=ar&text=${encodeURIComponent(
            this.textContent
          )}&op=translate`;
          window.open(url, "_blank");
        });

        // Change color on hover
        word.addEventListener("mouseover", function () {
          this.style.color = "red"; // Adjust color as desired
        });

        word.addEventListener("mouseout", function () {
          this.style.color = ""; // Reset color on mouseout
        });
      });
    } else {
      console.error("Element with ID 'mirror' not found.");
    }
  }

  function replaceTextAreaWithDiv() {
    const resultsBox = document.querySelector("#results_box");
    resultsBox.style.display = "none"; // Hide the original textarea

    const newDiv = document.createElement("div");
    newDiv.id = "results_div";
    newDiv.contentEditable = true;
    newDiv.style.border = "1px solid #ccc";
    newDiv.style.padding = "10px";
    newDiv.style.height = "500px"; // Initial height
    newDiv.style.maxHeight = "500px"; // Maximum height
    newDiv.style.overflowY = "auto"; // Vertical scrollbar when needed
    newDiv.style.width = resultsBox.style.width;
    newDiv.style.fontSize = "30px"; // Increase font size
    resultsBox.parentNode.insertBefore(newDiv, resultsBox.nextSibling);
  }

  // Function to apply styles and ensure the element is not hidden
  function applyStylesAndEnsureVisibility() {
    const mirror = document.querySelector("#mirror");
    if (mirror) {
      mirror.style.width = "700px"; // Increased fixed width
      mirror.style.height = "500px"; // Height dependent on content
      mirror.style.overflowY = "auto"; // Scroll vertically if content exceeds max height
      mirror.style.backgroundColor = "white"; // White background
      mirror.style.border = "1px solid black"; // Border for visibility
      mirror.style.boxSizing = "border-box"; // Include padding and border in width/height
      mirror.style.padding = "10px"; // Add padding
      mirror.style.fontSize = "30px"; // Increase font size

      // Scroll to the bottom of the element
      mirror.scrollTop = mirror.scrollHeight;

      // Ensure the box is never display: none
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (
            mutation.attributeName === "style" &&
            mirror.style.display === "none"
          ) {
            mirror.style.display = "block";
          }
        });
      });

      observer.observe(mirror, {
        attributes: true,
        attributeFilter: ["style"],
      });

      // Use MutationObserver to detect content changes
      const contentObserver = new MutationObserver(convertWordsToClickableText);
      contentObserver.observe(mirror, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  // Function to remove unwanted elements
  function removeUnwantedElements() {
    const elementsToRemove = [
      "#help_pane",
      "#bottom_ad_pane",
      "#navbarSupportedContent",
      "#goPremiumBtn",
      "#go_premium_nav_button",
      "#menu_pane",
    ];

    elementsToRemove.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.remove();
        console.log(`Removed element with selector '${selector}'.`);
      }
    });
  }

  function applyCustomStyles() {
    const outputBox = document.querySelector("#output_box");
    const mirrorContainer = document.querySelector("#mirror_container");

    if (outputBox && mirrorContainer) {
      outputBox.style.position = "absolute";
      outputBox.style.top = "70px"; // Adjust top positioning as needed
      outputBox.style.left = "0";
      outputBox.style.width = "calc(50% - 10px)"; // Adjust width accounting for padding and spacing
      outputBox.style.borderRadius = "10px";
      outputBox.style.backgroundColor = "transparent"; // Adjust background color as needed
      outputBox.style.padding = "10px";
      outputBox.style.boxSizing = "border-box"; // Ensure padding is included in width calculation

      mirrorContainer.style.position = "absolute";
      mirrorContainer.style.top = "70px"; // Adjust top positioning as needed
      mirrorContainer.style.left = "calc(50% + 10px)"; // Adjust left positioning
      mirrorContainer.style.width = "calc(50% - 10px)"; // Adjust width accounting for padding and spacing
      mirrorContainer.style.textAlign = "center";
      mirrorContainer.style.backgroundColor = "transparent"; // Adjust background color as needed
      mirrorContainer.style.padding = "10px";
      mirrorContainer.style.boxSizing = "border-box"; // Ensure padding is included in width calculation
    } else {
      console.error(
        "One or both elements not found: #output_box, #mirror_container"
      );
    }
  }

  // Immediately apply styles, remove unwanted elements, and start monitoring
  applyStylesAndEnsureVisibility();
  removeUnwantedElements();
  replaceTextAreaWithDiv();
  // Call the function to apply styles
  applyCustomStyles();
  startButton(); // Function from the website itself
})();
