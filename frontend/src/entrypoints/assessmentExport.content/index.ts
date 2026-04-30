import './style.css'

// selectors
const selector = '#right-side'

// add export button
function addExportButton(target: HTMLElement) {
  
if (document.getElementById('smartbridge-export-button')) return;
  //if button exists, stops adding button
  const button = document.createElement("button");
  button.id = "smartbridge-export-button";
  button.textContent = "Export Assessment";

  button.addEventListener("click", async () => {
    console.log("Export button clicked");
    // url string 
    const currentUrl: string = window.location.href;
    console.log("Current URL is:", currentUrl);
    
    //extract courseId and assignmentId
    const match = currentUrl.match(/courses\/(\d+)\/assignments\/(\d+)/);

    if (!match) {
    return;
  }

    const courseId = match[1];
    const assignmentId = match[2];

    console.log("Course ID:", courseId);
    console.log("Assignment ID:", assignmentId);

    const courseData = {
      courseId: courseId,
      assignmentId: assignmentId
    }

    const response = await fetch("http://127.0.0.1:5000/exportAssessment", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    });

    if (response.ok) {
      const disposition = response.headers.get("Content-Disposition");

      let filename = "download.xlsx"; // fallback

      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?(.+?)"?$/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    }
  });
  
  target.append(button);
  console.log('export button added');
}

// main script
export default defineContentScript({
  matches: ['*://csusm.test.instructure.com/courses/*/assignments/*'],

  main() {
    console.log('Hello assignment content.');

    const exportTarget = document.querySelector<HTMLElement>(selector);

    if (exportTarget) {
      console.log("Page content has loaded in!");
      addExportButton(exportTarget);
    }
    else {
      const observer = new MutationObserver(() => {

        const exportTarget = document.querySelector<HTMLElement>(selector);

        if (exportTarget) {
          console.log("selector was found");
          addExportButton(exportTarget);
          observer.disconnect();
        }
        else {
          console.log("selector is still not found");
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  },
});