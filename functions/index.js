const { onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { languages } = require("./languages.js");

const { initializeApp } = require("firebase-admin/app");
initializeApp()

const { llmPredict, transcribeFile } = require("./llm-helpers.js");
const { IS_TRANSCRIBE_FULL_BLOB } = require("./CONSTANTS.js");

async function addCategoryToShortNote(originalText, noteId, dateString, userId) {

    const promptForPrediction = `You are paid super smart vip assistant writer. Place my message into one of the lists "Tasks", "Ideas", "Other". Return only the list name. Message: ${originalText}`;

    let resultText = await llmPredict(promptForPrediction);
    resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

    const documentRef = getFirestore().collection("users").doc(userId).collection("dailyObjects").doc(dateString);
    await documentRef.update({
        [`notes.${noteId}.listName`]: resultText,
    });

    return resultText;
}

async function addSummaryToShortNote(originalText, langXX, noteId, dateString, userId) {

    const promptsRef = getFirestore().collection("app").doc("prompts");
    const promptsRaw = await promptsRef.get();
    const promptsData = promptsRaw.data();

    const languageText = `Answer in ${languages.getLanguageNameFromXX(langXX)}.`;

    let promptForPrediction = `${promptsData?.listSummarizePrompt} ${languageText} Message: ${originalText}`;

    let resultText = await llmPredict(promptForPrediction);
    resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

    const documentRef = getFirestore().collection("users").doc(userId).collection("dailyObjects").doc(dateString);
    await documentRef.update({
        [`notes.${noteId}.noteSummary`]: resultText,
    });

    return resultText;
}

async function addTitleToNote(originalText, langXX, noteId, dateString, userId) {

    let promptForPrediction = `Generate short title of 2-7 words for the following message. Answer in ${languages.getLanguageNameFromXX(langXX)}. Message: ${originalText}`;

    let resultText = await llmPredict(promptForPrediction);
    resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

    const documentRef = getFirestore().collection("users").doc(userId).collection("dailyObjects").doc(dateString);
    await documentRef.update({
        [`notes.${noteId}.noteTitle`]: resultText,
    });

    return resultText;
}

async function addSummaryToNote(originalText, recepientNote, langXX, itemId, dateString, userId) {

    const promptsRef = getFirestore().collection("app").doc("prompts");
    const promptsRaw = await promptsRef.get();
    const promptsObj = promptsRaw.data();

    const languageText = `Answer in ${languages.getLanguageNameFromXX(langXX)}.`;

    let promptForPrediction = `${promptsObj?.summarizePrompt} ${languageText} Message: "${originalText}"`;

    let resultText = await llmPredict(promptForPrediction);
    resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

    let prevSummary = recepientNote?.noteSummary ?? "";
    resultText = prevSummary + "\n\n" + resultText;

    const documentRef = getFirestore().collection("users").doc(userId).collection("dailyObjects").doc(dateString);
    await documentRef.update({
        [`notes.${itemId}.noteSummary`]: resultText,
    });

    return resultText;
}

async function addNoteText(noteText, recepientNote, currentDateString, userId) {

    //Create a new document if not exists
    const documentRef = getFirestore().collection("users").doc(userId).collection("dailyObjects").doc(currentDateString);

    const documentRaw = await documentRef.get();
    const documentData = documentRaw.data();
    if (!documentData) {
        await documentRef.set({
            "date": currentDateString,
        });
    }

    const { v4: uuidv4 } = require("uuid");
    const noteId = recepientNote?.id ?? uuidv4();

    if (recepientNote) {
        const recepientText = recepientNote?.noteText ?? ""
        await documentRef.update({
            [`notes.${noteId}.id`]: noteId,
            [`notes.${noteId}.noteText`]: recepientText + "\n\n" + noteText,
        });

    } else {
        await documentRef.update({
            [`notes.${noteId}.id`]: noteId,
            [`notes.${noteId}.createdAt`]: FieldValue.serverTimestamp(),
            [`notes.${noteId}.noteText`]: noteText,
        });
    }
    return { noteId };
}

exports.addnotefromtextcall = onCall({
    timeoutSeconds: 60,
}, async (req) => {
    const userId = req.auth.uid
    let noteText = req.data.noteText;
    let recepientNote = req.data.recepientNote;
    let ids = req.data.ids;

    const currentDateString = recepientNote?.dateString ?? new Date().toISOString().split("T")[0];
    const { noteId } = await addNoteText(noteText, recepientNote, currentDateString, userId)

    if (recepientNote) {
        const itemRef = getFirestore().collection("users").doc(userId);
        await itemRef.update({
            [`recepientNote`]: FieldValue.delete(),
        });
    }

    for (let id of ids) {
        const itemRef = getFirestore().collection("users").doc(userId).collection("blobsObjects").doc(id);
        await itemRef.delete()
    }

    return { "noteId": noteId, "dateString": currentDateString }
});

exports.addsummaryandtitletonotecall = onCall({
    timeoutSeconds: 60,
}, async (req) => {
    const userId = req.auth.uid

    const noteId = req.data.noteId
    const dateString = req.data.dateString

    const noteText = req.data.noteText;
    const recepientNote = req.data.recepientNote;

    const langXX = req.data.langXX;

    function wordCount(str) {
        return str.split(" ")
            .filter((n) => { return n != "" })
            .length;
    }
    const isShort = wordCount(noteText) < 50 && !recepientNote;

    if (isShort) {
        await addCategoryToShortNote(noteText, noteId, dateString, userId)
        await addSummaryToShortNote(noteText, langXX, noteId, dateString, userId)
    } else {
        const summaryText = await addSummaryToNote(noteText, recepientNote, langXX, noteId, dateString, userId)
        await addTitleToNote(summaryText, langXX, noteId, dateString, userId)
    }
});

exports.onblobcreated = onDocumentCreated("users/{userId}/blobsObjects/{noteId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const data = snapshot.data();
    const langXX = data.langXX;

    async function transcribeByUrl(blobURL, ref) {
        const readableStream = await fetch(blobURL)
        const transcribedText = await transcribeFile(readableStream, langXX)

        await ref.update({
            transcription: transcribedText,
        }).catch((e) => {
            console.log("error", e);
        })
        return transcribedText;
    }

    async function generateTitle(transcribedText, langXX) {
        let promptForPrediction = `Generate short title of 2-3 words for the following message. Answer in ${languages.getLanguageNameFromXX(langXX)}. Message: ${transcribedText}`;

        let resultText = await llmPredict(promptForPrediction);
        resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

        return resultText;
    }

    if (IS_TRANSCRIBE_FULL_BLOB) {
        if (data.isFirst) {
            const transcribedText = await transcribeByUrl(data.blobURL, event.data.ref);
            const title = await generateTitle(transcribedText, langXX);
            event.data.ref.update({
                transcription: transcribedText,
                title: title,
            }).catch((e) => {
                console.log("error", e);
            });
        }
    } else {
        const transcribedText = await transcribeByUrl(data.blobURL, event.data.ref);

        let title = null
        if (data.isFirst) {
            title = await generateTitle(transcribedText, langXX);
        }

        event.data.ref.update({
            ...(title && { title: title }),
            transcription: transcribedText,
        }).catch((e) => {
            console.log("error", e);
        });
    }
});

exports.ononotetoprocesscreated = onDocumentCreated("users/{userId}/toProcessNotes/{noteToProcessId}", async (event) => {

    const userId = event.params.userId

    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const data = snapshot.data();

    const langXX = data.langXX;

    const messagesObjs = Object.values(data.messagesObjs);
    messagesObjs.sort((a, b) => a.createdAt - b.createdAt);

    // merge blobs
    const { toFile } = require("openai");
    const blobs = []
    for (let messageObj of messagesObjs) {
        const response = await fetch(messageObj.blobURL);
        let blob = await response.blob();
        blobs.push(blob)
    }
    const mergedBlob = new Blob(blobs, { type: "audio/wav" })
    const polishedBuffer = Buffer.from(await mergedBlob.arrayBuffer())
    const file = await toFile(polishedBuffer, "fullnote.mp3");

    let noteText = await transcribeFile(file, langXX)

    let recepientNote = data.recepientNote;

    // save noteText to note
    const dateString = data.recepientNote?.dateString ?? new Date().toISOString().split("T")[0];
    const { noteId } = await addNoteText(noteText, recepientNote, dateString, userId)

    //delete toProcessNote
    await event.data.ref.delete()

    if (recepientNote) {
        const itemRef = getFirestore().collection("users").doc(userId);
        await itemRef.update({
            [`recepientNote`]: FieldValue.delete(),
        });
    }

    function wordCount(str) {
        return str.split(" ")
            .filter((n) => { return n != "" })
            .length;
    }

    const isShort = wordCount(noteText) < 50 && !recepientNote;

    if (isShort) {
        await addCategoryToShortNote(noteText, noteId, dateString, userId)
        await addSummaryToShortNote(noteText, langXX, noteId, dateString, userId)
    } else {
        const summaryText = await addSummaryToNote(noteText, recepientNote, langXX, noteId, dateString, userId)
        await addTitleToNote(summaryText, langXX, noteId, dateString, userId)
    }
});
