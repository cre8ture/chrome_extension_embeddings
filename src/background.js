// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env } from '@xenova/transformers';
import { VectorStorage } from './vectorDB.js';

// Create an instance of VectorStorage
const vectorStorage = new VectorStorage();

// Skip initial check for local models, since we are not loading any local models.
env.allowLocalModels = false;

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;


class PipelineSingleton {
//   const pipe = await pipeline("feature-extraction", "Supabase/gte-small");

    static task = "feature-extraction"// 'text-classification';
    static model = "Supabase/gte-small"// 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline("feature-extraction", "Supabase/gte-small", { progress_callback }); // pipeline(this.task, this.model, { progress_callback });
        }

        return this.instance;
    }
}

// Create generic classify function, which will be reused for the different types of events.
const embed = async (text) => {
    // const pipe = await pipeline("feature-extraction", "Supabase/gte-small");
    let model = await PipelineSingleton.getInstance((data) => { // singleton
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        console.log('progress', data)
    });
    let sentences = text.split(".")
    // Get the pipeline instance. This will load and build the model when run for the first time.
    // console.log("text", text)
    // let model = await PipelineSingleton.getInstance((data) => {
    //     // You can track the progress of the pipeline creation here.
    //     // e.g., you can send `data` back to the UI to indicate a progress bar
    //     console.log('progress', data)
    // });

    
    // Generate an embedding for each sentence
    const embeddings = await Promise.all(
        sentences.map((sentence) =>
            model(sentence, {
                pooling: "mean",
                normalize: true,
            })
        )
    );
  
      // Store the sentences and their corresponding embeddings
      self.sentences = sentences;
      self.embeddings = embeddings.map((output) => Array.from(output.data));

          // Save each sentence and its embedding to the vector storage
    self.sentences.forEach((sentence, index) => {
        vectorStorage.addVector(
          sentence,
          self.embeddings[index],
          "embeddingModel"
        );
      });
  

    // Actually run the model on the input text
    // let result = await model(text);
    // console.log("result", result)
    return self.embeddings //result;
};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
    // Register a context menu item that will only show up for selection text.
    chrome.contextMenus.create({
        id: 'classify-selection',
        title: 'Classify "%s"',
        contexts: ['selection'],
    });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // Ignore context menu clicks that are not for classifications (or when there is no input)
    if (info.menuItemId !== 'classify-selection' || !info.selectionText) return;

    // Perform classification on the selected text
    let result = await embed(info.selectionText);

    // Do something with the result
    chrome.scripting.executeScript({
        target: { tabId: tab.id },    // Run in the tab that the user clicked in
        args: [result],               // The arguments to pass to the function
        function: (result) => {       // The function to run
            // NOTE: This function is run in the context of the web page, meaning that `document` is available.
            console.log('result', result)
            console.log('document', document)
        },
    });
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('sender', sender)
    if (message.action !== 'classify') return; // Ignore messages that are not meant for classification.

    // Run model prediction asynchronously
    (async function () {
        // Perform classification
        let result = await embed(message.text);

        // Send response back to UI
        sendResponse(result);
    })();

    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
});
//////////////////////////////////////////////////////////////

