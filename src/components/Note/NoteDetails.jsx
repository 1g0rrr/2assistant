import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { amber } from '@mui/material/colors';
import { deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useConfirm } from 'material-ui-confirm';
import { useAuthContext } from '../../providers/AuthProvider';
import { useSnackbar } from '../../providers/Snackbar';
import { db } from '../../services/firebase';

function calculateReducePercent(originalText, boostedText) {
    const clearedTextFromTags = boostedText?.replaceAll('<p>', '').replaceAll('</p>', '').replaceAll('\n', '');
    const reducedPercent = Math.round((originalText?.length - clearedTextFromTags?.length) / originalText?.length * 100);
    return reducedPercent;
}

const NoteDetails = ({ note, currentDate }) => {
    const authContext = useAuthContext();
    const sessionUserId = authContext.sessionUserId;

    const showSnackbar = useSnackbar();
    const showConfirm = useConfirm();

    return (
        <>
            {<Box
                id={`simple-tabpanel-${0}`}
                aria-labelledby={`simple-tab-${0}`}
                sx={{
                    bgcolor: amber[50],
                    p: 2,
                    m: 1,
                    mt: 0,
                    borderRadius: '10px',
                }}
            >
                <Typography variant="body2" color="initial">{note.noteText}</Typography><br />
                <Typography variant="caption" fontStyle={'italic'} color="initial">Summarized by {note.noteSummary ? calculateReducePercent(note.noteText, note.noteSummary) : "..."}%</Typography>
                <Box textAlign={'right'} sx={{ width: '100%' }}>
                    <Button variant="outlined" color="primary"
                        size='small'
                        onClick={() => {
                            const itemRef = doc(db, "users", sessionUserId);
                            updateDoc(itemRef, {
                                [`savedNotes.${note.id}`]: { ...note, createdAt: serverTimestamp() },
                            });
                            showSnackbar("Done");
                        }}>
                        favorite
                    </Button>
                    <Button variant="outlined" color="primary" size='small' onClick={async () => {
                        const currentDateString = currentDate.toISOString().split("T")[0];
                        const itemRef = doc(db, "users", sessionUserId);
                        updateDoc(itemRef, {
                            [`recepientNote`]: {
                                id: note.id,
                                dateString: currentDateString,
                                noteText: note.noteText,
                                noteSummary: note.noteSummary,
                            },
                        });
                        showSnackbar('Done');
                    }}>
                        Add as recepient
                    </Button>
                    <Button variant="outlined" color="primary" size='small' onClick={async () => {
                        showConfirm({ description: "This action is permanent!" })
                            .then(async () => {
                                const currentDateString = currentDate.toISOString().split("T")[0];
                                const itemRef = doc(db, "users", sessionUserId, "dailyObjects", currentDateString);
                                await updateDoc(itemRef, {
                                    [`notes.${note.id}`]: deleteField(),
                                });
                                showSnackbar("Done");
                            })
                    }}>
                        Delete
                    </Button>
                </Box>
            </Box >}
        </>
    )
}

export default NoteDetails