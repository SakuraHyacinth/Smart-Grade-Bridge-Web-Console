import './style.css'
import * as XLSX from 'xlsx';

// Rubric selectors
// const selector = '#content > span > div > div > span > span:nth-child(3)';
// const titleSelector = '#content > span > div > div > span > span.css-b0hhdj-view-flexItem > h1';

// const selector = '#enhanced-rubric-assignment-edit-mount-point > div > div';
const selector = '#assignment_show > div.assignment-title > div.assignment-buttons'
const titleSelector = '#assignment_show > div.assignment-title > div.title-content';

// refresh page function
function refreshPage(): void {
  window.location.reload();
}

//check for existing rubric function
function hasRubric(): boolean {
  return Array.from(document.querySelectorAll('button'))
    .some(btn => btn.textContent?.trim() === "Preview Rubric");
}

//error message function
function showError(msg: string, button: HTMLElement) {
  let existing = document.getElementById("smartbridge-error");

  if (existing) {
    existing.textContent = msg;
    return;
  }

  const div = document.createElement("div");
  div.id = "smartbridge-error";
  div.textContent = msg;

  setTimeout(() => {
    document.getElementById("smartbridge-error")?.remove();
  }, 3000);

  button.parentElement?.appendChild(div)
}

// add import button function
function addImportButton(target: HTMLButtonElement) {
  // creating button


  if (document.getElementById('smartbridge-import-button')) return;
  //if button exists, stops adding button
  const button = document.createElement("button");
  button.id = "smartbridge-import-button";
  button.textContent = "Import Rubric";


  // click behavior
  button.addEventListener("click", async() => {
    console.log("Logging import button click");

    //if rubric exists, return error
    if (hasRubric()) {
      // showError("Rubric already applied", button);
      alert("Rubric already applied");

      await fetch(
        'https://smart-grade-bridge-web-console-back.onrender.com/log',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: "warn",
            category: "RUBRIC",
            message: "Assignment already contains a rubric"
          })
        }
      );
      return;

    }

    //fetch url
    const currentUrl: string = window.location.href;

    //extract courseID and assignmentID
    const match = currentUrl.match(/courses\/(\d+)\/assignments\/(\d+)/);

    if (!match) return;
    const courseId = match[1];
    const assignmentId = match[2];

    console.log("Course ID:", courseId);
    console.log("Assignment ID:", assignmentId);

    openFileExplorer(courseId, assignmentId);

    console.log("Current URL is:", currentUrl);

    /*TODO: send courseID and assignmentID to backend
            backend uploads rubric
            loading and upload success ui
            */

  });

  target.append(button);
  console.log('button is added');
}

//file explorer
function openFileExplorer(courseId: string, assignmentId: string): void {
  const input = document.createElement("input");
  input.type = "file"
  input.accept = ".xlsx, .xls";

  input.onchange = async (event: Event) => {
    //file is chosen
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      console.log(Array.from(files));
      const file = files[0];
      console.log(file.name);

      const rubricTitle = file.name.replace(/\.xlsx$/, "");
      console.log(rubricTitle);

      // reading in Excel file selected from dialog window
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);

      // Convert the first sheet to JSON
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rubricData = XLSX.utils.sheet_to_json(worksheet);

      const courseData = {
        title: rubricTitle,
        courseId: courseId,
        assignmentId: assignmentId,
        rubric: rubricData
      };

      await callEndpoint(courseData, 'https://smart-grade-bridge-web-console-back.onrender.com/processData');

      await callEndpoint(courseData, 'https://smart-grade-bridge-web-console-back.onrender.com/parseABET');

      await callEndpoint(courseData, 'https://smart-grade-bridge-web-console-back.onrender.com/createRubric');
    }
    refreshPage();
  }
  input.click();
}

async function callEndpoint(data: any, apiEndpoint: string) {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log(result);
}

//  main script
export default defineContentScript({
  matches: ['*://csusm.test.instructure.com/courses/*/assignments/*'],

  main() {
    // logs start of script
    console.log('Hello rubric content.');

    // queries if the old import button exists (immediately)
    // <HTMLButtonElement> infers (generics) that the elemnt is a Button - can still be considered 'null'
    // 'as' keyword is type casting
    const importButton = document.querySelector<HTMLButtonElement>(selector);
    const importTitle = document.querySelector<HTMLTitleElement>(titleSelector);

    // verifies if selector has loaded in yet
    if (importButton && importTitle) {   // if it immediately exists
      console.log("Page content has loaded in!");
      addImportButton(importButton);
    }
    else {              // else - it does not immediately exist
      const observer = new MutationObserver(mutations => {

        // re-queries old import button & title
        const importButton = document.querySelector<HTMLButtonElement>(selector);
        const importTitle = document.querySelector<HTMLTitleElement>(titleSelector);

        // if old import button is found after the re-query
        if (importButton && importTitle) {
          console.log("selector was found");
          addImportButton(importButton);

          // disconnect observer once element exists - removes uneeded repetition
          observer.disconnect();
        }
        else {
          console.log("selector is still not found");
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    }

  },
});
