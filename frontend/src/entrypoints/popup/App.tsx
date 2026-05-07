import { useState } from 'react';

import canvasLogo from '@/assets/canvasLogo.png'
import abetLogo from '@/assets/abetter.png'
import './App.css';

function App() {
  // mystical magical react variables
  const [apiKey, setApiKey] = useState<string | null>(null);           // apiKey holds the API key, and setAPIKey sets it and updates the UI with it
  const [isLoading, setIsLoading] = useState(false);                    // these fancy magical react variables tell you if the page is loading
  const debounce = useRef<NodeJS.Timeout | undefined>(undefined);
  const errorElem = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (apiKey == null) {
      if (errorElem.current) errorElem.current.textContent = "";
    }
    else if (apiKey !== null && /19556~[\w\d]{64}/.test(apiKey)) {
      if (errorElem.current) errorElem.current.textContent = "";

      clearTimeout(debounce.current);
      debounce.current = setTimeout(async () => {          // tries to send network request
        try {
          console.log(apiKey.trim());
          setIsLoading(true);
          const response = await fetch('https://smart-grade-bridge-web-console-back.onrender.com/uploadCanvasAPIKey', {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ key: apiKey })
          });

          if (!response.ok) {     // if the server does not exist
            throw new Error("Internal server error: " + response.statusText);
          }

          const data = await response.json();
          if (data['status'] == 200) {
            if (errorElem.current)
              errorElem.current.textContent = "Valid API Key";
          }
          else {
            if (errorElem.current)
              errorElem.current.textContent = "Invalid API Key"
          }

          console.log("Successfully sent to server!");
        }
        catch (error) {         // catches request failures
          if (errorElem.current && error instanceof Error) errorElem.current.textContent = error.message;
        }
        finally {       // when request finally finishes
          setIsLoading(false);
        }
      }, 200);

      return () => clearTimeout(debounce.current);
    }
    else {
      // create error that API key is not valid
      if (errorElem.current) errorElem.current.textContent = "Invalid API Key";
    }
  }, [apiKey]);

  return (
    <>
      <div>
        <a href="https://csusm.test.instructure.com" target="_blank">
          <img src={canvasLogo} className="logo" alt="Canvas Logo" />
        </a>
        <a href="https://abet.csusm.edu/" target="_blank">
          <img src={abetLogo} className='logo abet' alt="ABET Logo" />
        </a>
      </div>
      <h1>Smart Grade Bridge</h1>
      <div>
        <hr />
        <p id="input-title">
          API Key:
        </p>
        <input id="api-input" placeholder="Insert key here..." onChange={(input) => { setApiKey(input.target.value) }} />    {/* sets API key based on whatever was input into the form */}
        <p id="error-api" ref={errorElem} />
      </div>
      <p className="read-the-docs">
        Click on the Canvas and ABETter logos to learn more.
      </p>
    </>
  );
}

export default App;
