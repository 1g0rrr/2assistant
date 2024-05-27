import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography, useMediaQuery } from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { useConfirm } from 'material-ui-confirm';
import { useRecorderContext } from '../../../providers/RecorderProvider';
import { db, firebaseAuthInstance } from '../../../services/firebase';

const MessageDialog = ({ isDialogOpen, setIsDialogOpen, messageObj, title }) => {

    const recorderContext = useRecorderContext();
    const showConfirm = useConfirm();
    const isXsSize = useMediaQuery(theme => theme.breakpoints.down('sm'));


    return (
        <Dialog
            open={isDialogOpen}
            fullScreen={isXsSize}
            onClose={() => setIsDialogOpen(false)}
        >
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <Box textAlign={'center'}>
                    <Typography variant="body1" color="initial">{messageObj?.transcription}</Typography>
                    {messageObj?.blobURL && <audio src={messageObj?.blobURL} controls />}<br />
                    <Button variant="text" color="primary"
                        onClick={async () => {
                            const backUp = messageObj
                            recorderContext.storageObj.deleteBlob(messageObj.id);
                            const ref = doc(db, 'users', firebaseAuthInstance.currentUser.uid, 'blobsObjects', messageObj.id);
                            await setDoc(ref, backUp);
                        }}
                    >
                        Transcribe again
                    </Button>
                </Box>
                <Box textAlign='center' sx={{ mb: 1, minWidth: 300 }}>
                    <Divider />
                    <Button variant="text" color="primary"
                        onClick={() => {
                            showConfirm("Are you sure you want to delete this part?").then(() => {
                                recorderContext.storageObj.deleteBlob(messageObj.id);
                            })
                        }}
                    >
                        Delete
                    </Button>
                </Box>
                {/* </DialogContentText> */}
            </DialogContent>
            <DialogActions>

                <Button
                    onClick={() => setIsDialogOpen(false)}
                    color="primary"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog >
    )
}

export default MessageDialog