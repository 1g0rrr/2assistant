import { Button, TextField } from '@mui/material';
import { useState } from 'react';
import { useFirestoreContext } from '../providers/FirestoreProvider';
import { useSnackbar } from '../providers/Snackbar';

const TextMessageInput = () => {

    const firestoreContext = useFirestoreContext();
    const showSnackbar = useSnackbar();

    const [noteText, setNoteText] = useState('');

    return (
        <>
            <TextField id="outlined-basic" label="Outlined" variant="outlined" multiline={true} fullWidth={true} value={noteText} onChange={(e) => {
                setNoteText(e.target.value)
            }} />
            <Button variant="text" color="primary" onClick={async () => {
                const result = await firestoreContext.addNoteFromTextCallback(noteText);
                showSnackbar(result?.responseText);
            }}>
                Send
            </Button>
        </>
    )
}

export default TextMessageInput