import { addData, addParams, addCustomProperties } from "./function-doc-template.mjs";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {createTdWithP, wrapTextInCode, createTdWithElem, createTdWithCode, formatString} from "./util.js";

const firebaseConfig = {
    apiKey: "AIzaSyDf--XeJ2-pkwKkjGO1RLxzjwzJZUy_e0s",
    authDomain: "planimation-staging-181bc.firebaseapp.com",
    projectId: "planimation-staging-181bc",
    storageBucket: "planimation-staging-181bc.appspot.com",
    messagingSenderId: "914707935474",
    appId: "1:914707935474:web:ba4d0f22fa93687482206b",
    measurementId: "G-XYNE4FJ1CF"
};

const TABLE_CONTENT_CLASS = ".doc-table-content";
const PAGE_CONTENT_CLASS = ".page-content";
const FUNCTION_COLLECTION = "functions";
const CUSTOMISED_PROPERTY_COLLECTION = "customisedProperty";
const CUSTOM_PROPERTY_ID = "custom-properties";
const VISUAL_PROPERTY_COLLECTION = "visualProperty";
const DISTRIBUTE_FUNCTIONS_TABLE = "#distribute-functions " + TABLE_CONTENT_CLASS;
const OTHER_FUNCTIONS_TABLE = "#other-functions " + TABLE_CONTENT_CLASS;
const VISUAL_PROPERTY_ID = "visual-properties";
const VISUAL_PROPERTIES_TABLE = "#" + VISUAL_PROPERTY_ID + " " + TABLE_CONTENT_CLASS;
const DISTRIBUTE_FUNCTION_CATEGORY = "distribute";
const OTHER_FUNCTION_CATEGORY = "others";
const CHILD_DIR = "/function/";

initializeApp(firebaseConfig);
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Initialize Firestore
const db = firebase.firestore();


fetchDocumentList();
fetchVisualPropertiesDoc();
fetchCustomPropertiesDoc();

/**
 * Fetch documentation for visual properties from Firebase.
 */
function fetchCustomPropertiesDoc() {
    db.collection(CUSTOMISED_PROPERTY_COLLECTION).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            addCustomProperties(doc);
        });
    }).catch((error) => {
        console.error("Error fetching documents for custom properties: ", error);
    });
}

/**
 * Fetch documentation for visual properties from Firebase.
 */
function fetchVisualPropertiesDoc() {
    db.collection(VISUAL_PROPERTY_COLLECTION).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            createVisualPropertyRow(doc);
        });
    }).catch((error) => {
        console.error("Error fetching document list for visual properties: ", error);
    });
}

// Fetch list of documents from Firestore
function fetchDocumentList() {
    db.collection(FUNCTION_COLLECTION).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            createFunctionRef(doc);
        });
    }).catch((error) => {
        console.error("Error fetching document list for functions: ", error);
    });
}


function createFunctionRef(doc) {
    let functionName = doc.data().functionName;
    let functionDescription = doc.data().briefDescription;
    const category = doc.data().category;

    const contentParent = document.querySelector((category === DISTRIBUTE_FUNCTION_CATEGORY) ? DISTRIBUTE_FUNCTIONS_TABLE : OTHER_FUNCTIONS_TABLE);
    const tr = document.createElement('tr');

    // inside the td
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.class = "reference internal";
    a.href = CHILD_DIR + functionName;
    a.dataset.type = "function";  // Add this line
    const code =  document.createElement('code');
    // code.class = "table-keyword";
    code.textContent = functionName;
    code.dataset.docId = doc.id;  // Store the document ID as a data attribute
    a.appendChild(code);
    p.appendChild(a);

    // assemble
    tr.appendChild(createTdWithElem(p));
    tr.appendChild(createTdWithP(functionDescription));
    contentParent.appendChild(tr);
}

function loadDocumentContent(event) {
    // Check if the clicked link is a function link
    if (event && event.target.dataset.type !== "function") {
        return;
    }
    // Extract the functionName from the URL path
    const pathSegments = window.location.pathname.split('/');
    const functionName = pathSegments[pathSegments.length - 1]; // Assuming the last segment is the functionName
    // Fetch the function content from Firestore
    db.collection("functions").where("functionName", "==", functionName).get().then((querySnapshot) => {
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            loadFunctionDoc(doc);
            loadParams(doc.id);
        } else {
            console.error("Function not found!");
        }
    }).catch((error) => {
        console.error("Error fetching function content: ", error);
    });
}

function loadFunctionDoc(doc) {
    const functionDocTemplate =
        `
        <h1 id="function-name"></h1>
        <!-- General description -->
        <div class="description"><p id="description"></p></div>
        <!-- Parameters -->
        <div class="params">
            <h3>Parameters</h3>
            <ul id="parameters"></ul>
        </div>
        <!-- Example usage -->
        <div class="example">
            <h3>Example</h3>
            <code-block id="example"></code-block>
        </div>
        <div class="demo">
            <!-- Video demo -->
            <h3>Visual Demo</h3>
            <div class="video-demo-container"></div>
            <!-- Code snippet -->
            <code-block id="code-demo"></code-block>
            <p id="video-explanation"></p>
        </div>
        <button class="btn return"><a href="/documentation.html">Return</a></button>
    `
    const contentDiv = document.querySelector(PAGE_CONTENT_CLASS);
    // Swap the content div
    contentDiv.innerHTML = functionDocTemplate;
    document.body.onLoad = addData(doc);
}



function loadParams(docId) {
    return new Promise((resolve, reject) => {
        db.collection(FUNCTION_COLLECTION).doc(docId).collection("parameters").get().then((querySnapshot) => {
            addParams(querySnapshot);
            resolve(); // Resolve the promise when done
        }).catch((error) => {
            console.error("Error fetching parameters: ", error);
            reject(error); // Reject the promise on error
        });
    });
}

function createVisualPropertyRow(doc) {
    const docData = doc.data();
    const contentParent = document.querySelector(VISUAL_PROPERTIES_TABLE);

    // row header
    const tr = document.createElement('tr', 'table-keyword');
    const nameTd = createTdWithCode(docData.name);

    // row body
    const descriptionTd = createTdWithP(docData.description);
    const typeTd = createTdWithP(docData.type);
    const additionalList = document.createElement('ul');
    const additionalTd = createTdWithElem(additionalList);

    let note, defaultVal;
    if (docData.note === undefined && docData.defaultValue === undefined) {
        additionalTd.style['background-color'] = '#ecf2f6';
    } else if (docData.note === undefined && docData.defaultValue !== undefined) {
        // defaultValue only
        defaultVal = document.createElement('li');
        defaultVal.textContent = "Default value: ";
        defaultVal.appendChild(wrapTextInCode(docData.defaultValue));
        additionalList.appendChild(defaultVal);
    } else if (docData.defaultValue === undefined && docData.note !== undefined) {
        // note only
        note = document.createElement('li');
        note.textContent = docData.note;
        additionalList.appendChild(note);
    } else {
        // both
        defaultVal = document.createElement('li');
        note = document.createElement('li');
        defaultVal.textContent = docData.defaultValue;
        note.textContent = docData.note;
        additionalList.appendChild(defaultVal);
        additionalList.appendChild(note);
    }

    // add the entries into the row
    tr.appendChild(nameTd);
    tr.appendChild(typeTd);
    tr.appendChild(descriptionTd);
    tr.appendChild(additionalTd);

    contentParent.appendChild(tr);
}

function searchDocuments() {
    const searchTerm = document.getElementById('searchInput').value;
    const contentDiv = document.querySelector('.content');
    contentDiv.innerHTML = ""; // Clear the content

    // Query Firestore for documents with titles that start with the search term
    db.collection("functions")
        .where("functionName", ">=", searchTerm)
        .where("functionName", ">=", searchTerm + "\uf8ff")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                contentDiv.innerHTML = "No documents found for the search term.";
                return;
            }

            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                const docLink = document.createElement('a');
                docLink.textContent = docData.functionName;
                docLink.href = "#"; // Placeholder href
                docLink.dataset.docId = doc.id; // Store the document ID as a data attribute
                docLink.addEventListener('click', loadDocumentContent); // Add click event listener
                contentDiv.appendChild(docLink);
                contentDiv.appendChild(document.createElement('br')); // Line break for readability
            });
        })
        .catch((error) => {
            console.error("Error searching documents: ", error);
        });
}

window.onload = function() {
    // Check if the URL path contains "/function/"
    if (window.location.pathname.includes(CHILD_DIR)) {
        loadDocumentContent();
    }
};