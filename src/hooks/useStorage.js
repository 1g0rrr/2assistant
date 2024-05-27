import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useCallback, useEffect, useState } from 'react';
import { db, storage } from '../services/firebase';

import { v4 as uuidv4 } from 'uuid';
import { useAuthContext } from '../providers/AuthProvider';
import { useFirestoreContext } from '../providers/FirestoreProvider';

const useStorage = () => {

    const firestoreContext = useFirestoreContext();
    const authContext = useAuthContext();
    const sessionUserId = authContext.sessionUserId;

    const [isNotComplete, setIsNotComplete] = useState(false);
    const [isSavingBlobBytes, setIsSavingBlobBytes] = useState(false);
    const [currentNoteTitle, setCurrentNoteTitle] = useState(null);
    const [wordCount, setWordCount] = useState(0);
    const [totalRecordingTime, setTotalRecordingTime] = useState(0);

    const [records, setRecords] = useState(null);

    async function saveTranscription(noteId, transcription) {
        const itemRef = doc(db, "users", sessionUserId, "blobsObjects", noteId);
        updateDoc(itemRef, {
            transcription: transcription,
        });
    }

    async function saveTitle(noteId, title) {
        const itemRef = doc(db, "users", sessionUserId, "blobsObjects", noteId);
        updateDoc(itemRef, {
            title: title,
        });
    }

    async function deleteBlob(noteId) {
        const itemRef = doc(db, "users", sessionUserId, "blobsObjects", noteId);
        deleteDoc(itemRef);
    }

    async function saveBlob(blob, recordingTime) {

        const noteId = uuidv4();

        const pathToFile = `${sessionUserId}/${noteId}.mp3`;
        const storageRef = ref(storage, pathToFile);

        setIsSavingBlobBytes(true);

        await uploadBytes(storageRef, blob);

        const humanBlobURL = await getDownloadURL(storageRef);

        setIsSavingBlobBytes(false);

        const isFirstPart = records?.length === 0;

        const itemRef = doc(db, "users", sessionUserId, "blobsObjects", noteId);
        await setDoc(itemRef, {
            id: noteId,
            recordingTime: recordingTime,
            langXX: firestoreContext.userProfile?.settings?.outputLanguageXX ?? 'en',
            blobURL: humanBlobURL,
            isFirst: isFirstPart,
            createdAt: Date.now(),
        });

        return noteId;
    }

    const getFullNoteCallback = useCallback(async () => {
        const ids = records.map((b) => b.id);

        const transcribedRows = [];
        const remainingRows = []

        let isMetNonTranscribed = false;

        for (let i = 0; i < records.length; i++) {
            if (records[i].transcription != undefined && !isMetNonTranscribed) {
                transcribedRows.push(records[i])
            } else {
                isMetNonTranscribed = true;
                remainingRows.push(records[i])
            }
        }

        const mergedTranscription = transcribedRows.map((b) => b.transcription).join(' ');

        return { mergedTranscription, ids, isMetNonTranscribed };

    }, [records])

    useEffect(() => {
        if (!sessionUserId) return;

        const itemRef = collection(db, "users", sessionUserId, "blobsObjects");
        const unsubscribe = onSnapshot(itemRef, (querySnapshot) => {
            const curDocument = querySnapshot.docs.map(doc => doc.data());
            curDocument.sort((a, b) => a.createdAt - b.createdAt);
            setRecords(curDocument);
        });
        return () => {
            unsubscribe();
        };
    }, [sessionUserId]);


    useEffect(() => {
        const res = records !== undefined && records?.length > 0;
        setIsNotComplete(res);
    }, [records, records?.length]);


    useEffect(() => {
        setCurrentNoteTitle(records?.[0]?.title)
    }, [records, records?.length]);


    useEffect(() => {
        if (!records) {
            setWordCount(0)
            return
        }
        const mergedTranscription = records?.map((b) => b?.transcription ?? '').join(' ');

        function wordCount(str) {
            return str.split(' ')
                .filter(function (n) { return n != '' })
                .length;
        }
        setWordCount(wordCount(mergedTranscription))

    }, [records]);


    useEffect(() => {
        if (!records) {
            setTotalRecordingTime(0)
            return
        }
        const totalRecordingTime = records?.map((b) => b.recordingTime).reduce((a, b) => a + b, 0);
        setTotalRecordingTime(totalRecordingTime)
    }, [records]);


    return {
        isNotComplete,
        isSavingBlobBytes,
        wordCount,
        totalRecordingTime,
        currentNoteTitle,
        saveTranscription,
        saveTitle,
        saveBlob,
        deleteBlob,
        getFullNoteCallback,
        records,
    }
}

export default useStorage