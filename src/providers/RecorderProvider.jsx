import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMicrophone } from '../hooks/useMicrophone';
import useStorage from '../hooks/useStorage';
import { db } from '../services/firebase';
import { useAuthContext } from './AuthProvider';
import { useFirestoreContext } from './FirestoreProvider';
import { useSnackbar } from './Snackbar';

const RecorderContext = createContext();

const RecorderProvider = ({ children }) => {
    const firestoreContext = useFirestoreContext();
    const authContext = useAuthContext();
    const sessionUserId = authContext.sessionUserId;


    const timerInterval = useRef(null);
    const [recordingTimeSeconds, setRecordingTimeSeconds] = useState(0);

    const [isStopWhenPossible, setIsStopWhenPossible] = useState(false);
    const ifStopInterval = useRef(null);

    const showSnackbar = useSnackbar();

    const storageObj = useStorage();

    var ua = window.navigator.userAgent;
    var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    var webkit = !!ua.match(/WebKit/i);
    var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

    const microphoneObj = useMicrophone({
        isCompress: iOSSafari,
        onBlobGenerated: onBlobGenerated,
    });

    const isBusy = microphoneObj.isProcessing || storageObj.isSavingBlobBytes;

    async function onBlobGenerated(blob, inSize) {

        firestoreContext.setStatus('');

        const inSizeKb = Math.round(inSize / 1024);

        if (recordingTimeSeconds < 2) {
            if (storageObj.isNotComplete) {
                showSnackbar("Double tap to send. Hold to continue talking", 2000, { vertical: 'top', horizontal: 'center' })

            } else {
                showSnackbar("Hold the button, and talk", 2000, { vertical: 'top', horizontal: 'center' })
            }
            return
        }

        const sizeOfBlobKb = Math.round(blob.size / 1024);

        if (sizeOfBlobKb < inSizeKb) {
            showSnackbar(`Size: ${inSizeKb} Kb → ${sizeOfBlobKb} Kb.`, 1000)
        }

        await storageObj.saveBlob(blob, recordingTimeSeconds);

        // This message will be processed by the server
    }

    const startRecording = async () => {

        setIsStopWhenPossible(false)

        setRecordingTimeSeconds(0);

        if (timerInterval.current) clearInterval(timerInterval.current);

        await microphoneObj.startRecording()

        timerInterval.current = setInterval(() => {
            setRecordingTimeSeconds(current => current + 0.1);
        }, 100)

    }

    const stopRecording = async () => {
        microphoneObj.cancelRecording();
        setIsStopWhenPossible(true);
        clearInterval(timerInterval.current);
        timerInterval.current = null
    }

    const sendNoteToProcessing = async () => {
        if (storageObj.isSavingBlobBytes) return

        if (storageObj.records.length === 0) {
            return
        }

        firestoreContext.setStatus('sending...');

        //make object from records
        const messagesObjs = storageObj.records.reduce((acc, b) => {
            acc[b.id] = {
                id: b.id,
                blobURL: b.blobURL,
                createdAt: b.createdAt,
                ...(b.isFirst && { isFirst: b.isFirst }),
                ...(b.transcription && { transcription: b.transcription }),
                ...(b.title && { title: b.title }),
            }
            return acc;
        }, {});

        const noteId = uuidv4();
        const itemRef = doc(db, "users", sessionUserId, "toProcessNotes", noteId);
        const recepientNote = firestoreContext.userProfile.recepientNote

        await setDoc(itemRef, {
            id: noteId,
            langXX: firestoreContext.userProfile.settings?.outputLanguageXX ?? 'en',
            ...(recepientNote && { recepientNote: recepientNote }),
            messagesObjs: messagesObjs,
        });


        for (let messageObj of Object.values(messagesObjs)) {
            const docRef = doc(db, "users", sessionUserId, "blobsObjects", messageObj.id);
            deleteDoc(docRef);
        }

        firestoreContext.setStatus('');

        showSnackbar('Sent')
    }


    useEffect(() => {
        // when user aked to stop repeat attempt every 200 ms unitl it is possible to stop
        ifStopInterval.current = setInterval(async () => {
            if (isStopWhenPossible) {
                const isAbleToStop = microphoneObj.isRecording && !isBusy
                if (isAbleToStop) {

                    setIsStopWhenPossible(false)

                    clearInterval(timerInterval.current);
                    timerInterval.current = null

                    firestoreContext.setStatus('processing...');

                    await microphoneObj.stopRecording();
                }
            }
        }, 200)

        return () => {
            clearInterval(ifStopInterval.current);
        }
    }, [isBusy, isStopWhenPossible, microphoneObj, firestoreContext]);

    useEffect(() => {
        return () => {
            clearInterval(timerInterval.current);
            timerInterval.current = null
        }
    }, []);

    return (
        <RecorderContext.Provider value={{
            startRecording,
            stopRecording,
            sendNoteToProcessing,
            isRecording: microphoneObj.isRecording,
            isNotComplete: storageObj.isNotComplete,
            isBusy,
            recordingTimeSeconds,
            storageObj,
        }}>
            {children}
        </RecorderContext.Provider>
    )
}

export default RecorderProvider
export function useRecorderContext() {
    return useContext(RecorderContext);
}