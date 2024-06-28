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
  let lastMirrorContent = document.querySelector("#mirror").textContent.trim(); // Variable to store the last content of #mirror

  let hiddenBoxOutputSplit = "\n------------------------\n";

  async function translateText(text) {
    try {
      // Replace this with your translation API call
      const prompt = `Please respond with a JSON object containing the following details about this text, note dont' include the output in codeblock, send it directly, and don't send any additional inforamation, jsut the respond: ${text}
    {
      "summary": "A concise summary in a few words",
      "translation_arabic": "Translation into Arabic, or literal words if not translatable",
      "response": "Concise potential response to the provided text"
      "grammar": "Optional: Any grammar or spelling corrections needed"
    };`;

      // Assuming the use of the same GoogleGenerativeAI SDK
      const { GoogleGenerativeAI } = await import(
        "https://esm.run/@google/generative-ai"
      );
      const API_KEY = "AIzaSyCkVLqD_1LO5oIoGfjoIosm2D_Jm9k1eKo";
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error("Translation service did not respond.");
      }
      const response = await result.response;
      const translatedText = await response.text();
      let jsonResponse = JSON.parse(translatedText);
      // Extracting values from JSON response
      const summary = jsonResponse.summary;
      const translationArabic = jsonResponse.translation_arabic;
      const potentialResponse = jsonResponse.response;
      const grammar = jsonResponse.grammar;

      // Constructing the string output
      const outputString = `Summary: ${summary}<br>Respond: ${potentialResponse}<br>Translation: ${translationArabic}<br> Grammar: ${
        grammar || "No grammer mistake"
      }`;
      return outputString;
    } catch (error) {
      console.error("Error translating text:", error);
      throw error; // Throw the original error to propagate it
    }
  }

  // Example usage:
  let oldParts = [];

  function convertSpanToClickable(span) {
    if (span) {
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
    }
  }

  async function PushLastParagraphIntoOutputBox() {
    const HiddenBox = document.querySelector("#results_box");
    const newDiv = document.querySelector("#results_div");
    const hiddenBoxOutputSplit = "\n------------------------\n";

    // Split the text content by the delimiter
    const parts = HiddenBox.value.split(hiddenBoxOutputSplit);

    if (oldParts.length === parts.length) return;
    oldParts = parts;

    // Get the last part
    const lastPart = parts[parts.length - 2];

    // Create a paragraph element for the last part
    const paragraph = document.createElement("p");
    paragraph.style.marginBottom = "5px"; // Add some space between paragraphs

    // Split last part into words
    const words = lastPart.trim().split(/\s+/);

    // Create clickable spans for each word
    words.forEach((word) => {
      if (word) {
        // Check if word is not empty
        const span = document.createElement("span");
        span.textContent = word + " "; // Add a space after each word for separation
        convertSpanToClickable(span);
        paragraph.appendChild(span);
      }
    });

    // Append the last paragraph to newDiv
    newDiv.appendChild(paragraph);

    // Translate the last part and append the translation
    const translatedText = await translateText(lastPart);
    const translationParagraph = document.createElement("p");
    translationParagraph.style.color = "green"; // Optional: Different color for the translation
    translationParagraph.innerHTML = translatedText;
    newDiv.appendChild(translationParagraph);

    newDiv.scrollTop = newDiv.scrollHeight; // Scroll to the bottom
  }

  // Function to check and update the value
  function checkAndUpdateHiddenOutputBox() {
    let HiddenBox = document.querySelector("#results_box");
    let currentLength = HiddenBox.value.length; // Define currentLength here
    if (currentLength !== previousOutputLength) {
      HiddenBox.value = HiddenBox.value + hiddenBoxOutputSplit;
      previousOutputLength =
        document.querySelector("#results_box").value.length;
      PushLastParagraphIntoOutputBox(); // Updates the new output div with the text content
    }
  }

  // Function to convert words to clickable text
  function convertWordsToLinksInMirror() {
    const mirror = document.querySelector("#mirror");
    const textContent = mirror.textContent.trim();

    if (textContent === lastMirrorContent) return;
    lastMirrorContent = textContent;

    // Scroll to the bottom of the element
    mirror.scrollTop = mirror.scrollHeight;

    checkAndUpdateHiddenOutputBox();

    const words = textContent.split(/\s+/).filter(Boolean); // Split by whitespace and filter out empty strings
    mirror.innerHTML = ""; // Clear existing content

    words.forEach((word) => {
      if (word) {
        const span = document.createElement("span");
        span.textContent = word;
        convertSpanToClickable(span); // Convert span to clickable
        mirror.appendChild(span);
        mirror.appendChild(document.createTextNode(" ")); // Add space between words
      }
    });
  }

  function replaceTextAreaWithDiv() {
    const HiddenBox = document.querySelector("#results_box");
    HiddenBox.style.display = "none"; // Hide the original textarea

    const newDiv = document.createElement("div");
    newDiv.id = "results_div";
    newDiv.contentEditable = true;
    newDiv.style.border = "1px solid #ccc";
    newDiv.style.padding = "10px";
    newDiv.style.height = "500px"; // Initial height
    newDiv.style.maxHeight = "500px"; // Maximum height
    newDiv.style.overflowY = "auto"; // Vertical scrollbar when needed
    newDiv.style.width = HiddenBox.style.width;
    newDiv.style.fontSize = "30px"; // Increase font size
    HiddenBox.parentNode.insertBefore(newDiv, HiddenBox.nextSibling);
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

      // Use MutationObserver to detect content changes
      const contentObserver = new MutationObserver(convertWordsToLinksInMirror);
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
        element.style.display = "none";
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
