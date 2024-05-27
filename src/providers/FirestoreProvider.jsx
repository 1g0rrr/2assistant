import { collection, doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, functions } from '../services/firebase';
import { useAuthContext } from './AuthProvider';


const FirestoreContext = createContext();

const FirestoreProvider = ({ children }) => {

    const params = useParams();

    const authContext = useAuthContext();
    const sessionUserId = authContext.sessionUserId;


    const [userProfile, setUserProfile] = useState({});
    const [currentDocument, setCurrentDocument] = useState({});

    const [status, setStatus] = useState('');
    const [isSendingToServer, setIsSendingToServer] = useState(false);
    const [isLoadingDailyObject, setIsLoadingDailyObject] = useState(false);

    const [toProcessNotes, setToProcessNotes] = useState([]);


    const all = Object.values(currentDocument?.notes ?? {});
    let notesArray = all.filter((item) => !['Tasks', 'Ideas', 'Other'].includes(item.listName));
    notesArray?.sort((a, b) => a.createdAt - b.createdAt);

    let tasks = all.filter((item) => item.listName === 'Tasks').sort((a, b) => a.createdAt - b.createdAt);
    let ideas = all.filter((item) => item.listName === 'Ideas').sort((a, b) => a.createdAt - b.createdAt);
    let otherNotes = all.filter((item) => item.listName === 'Other').sort((a, b) => a.createdAt - b.createdAt);

    const savedNotesArray = Object.values(userProfile?.savedNotes ?? {});
    savedNotesArray?.sort((a, b) => b.createdAt - a.createdAt);

    // subsrcibe to notes in queue to process
    useEffect(() => {
        if (!sessionUserId) return;

        const itemRef = collection(db, "users", sessionUserId, "toProcessNotes");
        const unsubscribe = onSnapshot(itemRef, (querySnapshot) => {
            const toProcessNotesData = querySnapshot.docs.map(doc => doc.data());
            setToProcessNotes(toProcessNotesData);
        });
        return () => {
            unsubscribe();
        };
    }, [sessionUserId]);

    // subsribe to user data
    useEffect(() => {
        if (!sessionUserId) return;

        const itemRef = doc(db, "users", sessionUserId);
        const unsubscribe = onSnapshot(itemRef, (querySnapshot) => {
            const curDocument = querySnapshot.data();
            if (curDocument) {
                setUserProfile(curDocument);
            }
        });
        return () => {
            unsubscribe();
        };
    }, [sessionUserId])


    // Subsribe to day data
    useEffect(() => {
        if (!sessionUserId) return;

        const todayDateString = new Date().toISOString().split("T")[0];

        const dateString = params?.documentId ?? todayDateString;

        const userId = sessionUserId;
        setIsLoadingDailyObject(true)
        const itemRef = doc(db, "users", userId, "dailyObjects", dateString);
        const unsubscribe = onSnapshot(itemRef, (querySnapshot) => {
            const curDocument = querySnapshot.data();
            if (curDocument) {
                curDocument.ref = itemRef;
            }
            setCurrentDocument(curDocument);
            setIsLoadingDailyObject(false)
        });
        return () => {
            unsubscribe();
        };
    }, [params?.documentId, sessionUserId])


    const addNoteFromTextCallback = useCallback(async function (noteText, ids = []) {
        if (!sessionUserId) return;

        const recepientNote = userProfile?.recepientNote ? { ...userProfile?.recepientNote } : undefined

        setIsSendingToServer(true);
        const response = await httpsCallable(functions, 'addnotefromtextcall')({
            noteText: noteText,
            ids: ids,
            recepientNote: recepientNote,
        });

        const noteId = response?.data?.noteId;
        const dateString = response?.data?.dateString;

        httpsCallable(functions, 'addsummaryandtitletonotecall')({
            noteId: noteId,
            dateString: dateString,
            langXX: userProfile?.settings?.outputLanguageXX ?? 'en',
            noteText: noteText,
            ids: ids,
            recepientNote: recepientNote,
        });

        setIsSendingToServer(false);

    }, [userProfile?.recepientNote, sessionUserId, userProfile?.settings?.outputLanguageXX])

    return (
        <FirestoreContext.Provider value={{
            addNoteFromTextCallback,
            setStatus,
            toProcessNotes,
            sessionUserId,
            isSendingToServer,
            isLoadingDailyObject,
            status,
            currentDocument,
            notesArray,
            savedNotesArray,
            tasks,
            ideas,
            otherNotes,
            userProfile,
        }}>
            {children}
        </FirestoreContext.Provider>
    )
}

export default FirestoreProvider

export function useFirestoreContext() {
    return useContext(FirestoreContext);
}