import { CircularProgress, List, ListItem, ListItemText, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirestoreContext } from '../providers/FirestoreProvider';
import { } from '../services/firebase';
import NoteCard from './Note/NoteCard';


const NotesArea = () => {

    const firestoreContext = useFirestoreContext()

    const navigate = useNavigate();
    const params = useParams();

    const currentDate = params?.documentId ? new Date(params?.documentId) : new Date();
    const dayBefore = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    const dayAfter = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

    return (
        <Box sx={{
            flexDirection: 'column',
            display: 'flex',
        }}>
            <Typography variant="h5" color="initial">Notes {currentDate.toISOString().split("T")[0]}</Typography>
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',

            }}>
                <Button variant="text" color="primary" onClick={() => {

                    const dayBeforeString = dayBefore.toISOString().split("T")[0];
                    navigate(`/${dayBeforeString}`);

                }}>
                    ← Day Before
                </Button>
                <Button variant="text" color="primary" onClick={() => {

                    navigate(`/`);

                }}>
                    Today
                </Button>
                <Button variant="text" color="primary" onClick={() => {

                    const dayAfterString = dayAfter.toISOString().split("T")[0];
                    navigate(`/${dayAfterString}`);

                }}>
                    Day After →
                </Button>
            </Box>
            <br />
            <Box>
                {firestoreContext.isLoadingDailyObject && <CircularProgress size={'1.5rem'} />}
            </Box>
            {firestoreContext.tasks.length > 0 &&
                <>
                    <Typography variant="h5" color="initial">Tasks</Typography>
                    <List >
                        {firestoreContext.tasks.map((note) =>
                            <ListItem
                                key={note.id}
                                sx={{}} dense>
                                *<ListItemText>
                                    <NoteCard note={note} currentDate={currentDate} />
                                </ListItemText>
                            </ListItem>
                        )}
                    </List>
                </>}
            {firestoreContext.ideas.length > 0 &&
                <>
                    <Typography variant="h5" color="initial">Ideas</Typography>
                    <List >
                        {firestoreContext.ideas.map((note) =>
                            <ListItem
                                key={note.id}
                                dense
                            >
                                *<ListItemText>
                                    <NoteCard note={note} currentDate={currentDate} />
                                </ListItemText>
                            </ListItem>
                        )}
                    </List>
                </>
            }
            {firestoreContext.otherNotes.length > 0 &&
                <>
                    <Typography variant="h5" color="initial">Other</Typography>
                    <List sx={{}} >
                        {firestoreContext.otherNotes.map((note) =>
                            <ListItem
                                key={note.id}
                                dense
                            >
                                *<ListItemText>
                                    <NoteCard note={note} currentDate={currentDate} />
                                </ListItemText>
                            </ListItem>
                        )}
                    </List>
                </>
            }
            <List>
                {firestoreContext.notesArray.map((note) =>
                    <ListItem
                        key={note.id}
                        sx={{
                            display: 'list-item'
                        }} dense
                    >
                        <ListItemText>
                            <NoteCard note={note} currentDate={currentDate} />
                        </ListItemText>
                    </ListItem>
                )}
            </List>
            <Box>
                {firestoreContext.toProcessNotes.length > 0 && <CircularProgress size={'1.5rem'} />}
            </Box>
        </Box >
    )
}

export default NotesArea