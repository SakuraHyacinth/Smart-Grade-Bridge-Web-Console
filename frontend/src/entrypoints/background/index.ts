export default defineBackground(async () => {
  console.log('Hello background!', { id: browser.runtime.id });

  //const url = 'http://127.0.0.1:5000/';

  const url = 'https://smart-grade-bridge-web-console-back.onrender.com'

  try {
    const response = await fetch(url);
    if(!response.ok) {
      throw new Error(`Reponse status: ${response.status}`);
    }
    const result = await response.text();
    console.log(result);
  } catch(error) {
    console.error(error);
  }

});
