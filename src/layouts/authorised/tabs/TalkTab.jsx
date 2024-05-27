import { VolumeButtons } from '@capacitor-community/volume-buttons';
import { Capacitor } from '@capacitor/core';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import MicIcon from '@mui/icons-material/Mic';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import { Box, CircularProgress, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import MessageChip from '../../../components/MessageChip';
import { useAuthContext } from '../../../providers/AuthProvider';
import { useFirestoreContext } from '../../../providers/FirestoreProvider';
import { useRecorderContext } from '../../../providers/RecorderProvider';
import { useSnackbar } from '../../../providers/Snackbar';
import { db } from '../../../services/firebase';

const PLATFORM_IOS = 'ios';
const PLATFORM_ANDROID = 'android';
const DIRECTION_UP = 'up';
const ACTION_DOWN = 'down';
const ACTION_UP = 'up';

const TalkTab = () => {

    const authContext = useAuthContext();
    const sessionUserId = authContext.sessionUserId;

    const firestoreContext = useFirestoreContext();
    const recorderContext = useRecorderContext();
    const showSnackbar = useSnackbar();

    const waitDoubleClickTimer = useRef(null);

    const [mainButtonState, setMainButtonState] = useState('')

    const buttonDownCallback = useCallback(async () => {

        if (mainButtonState === "loading") return;

        function startRecording() {
            recorderContext.startRecording()
        }

        if (recorderContext.storageObj.records?.length === 0) {
            startRecording()
        } else {
            // Wait for some time to check if main button will be released
            // to prevent conflict with double click event
            if (!waitDoubleClickTimer.current) {
                waitDoubleClickTimer.current = setTimeout(async () => {
                    startRecording()
                    clearTimeout(waitDoubleClickTimer.current);
                    waitDoubleClickTimer.current = null;
                }, 200);
            }
        }
    }, [recorderContext, mainButtonState])

    const buttonReleaseCallback = useCallback(async () => {

        if (waitDoubleClickTimer.current) {
            clearTimeout(waitDoubleClickTimer.current);
            waitDoubleClickTimer.current = null;
        }

        recorderContext.stopRecording();

    }, [recorderContext])


    async function onDoubleClick() {
        clearTimeout(waitDoubleClickTimer.current);
        waitDoubleClickTimer.current = null;
        await recorderContext.sendNoteToProcessing();
    }

    useEffect(() => {
        async function updateButtonState() {

            if (recorderContext.isRecording) {
                setMainButtonState("record")
            } else {
                if (recorderContext.isBusy) {
                    setMainButtonState("loading")
                } else {
                    setMainButtonState(await recorderContext.isNotComplete ? "paused" : "primary")
                }
            }
        }

        updateButtonState()

    }, [recorderContext.isRecording, recorderContext.isBusy, recorderContext.isNotComplete])

    // track physical volume button events on native platforms
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {

            const options = {};

            const platform = Capacitor.getPlatform();
            if (platform === PLATFORM_IOS) {
                options.disableSystemVolumeHandler = true;
            } else if (platform === PLATFORM_ANDROID) {
                options.suppressVolumeIndicator = true;
            }

            const callback = async (result, err) => {
                if (result?.direction === DIRECTION_UP && result?.action === ACTION_DOWN) {
                    buttonDownCallback()
                } else if (result?.direction === DIRECTION_UP && result?.action === ACTION_UP) {
                    buttonReleaseCallback()
                }
            };

            VolumeButtons.watchVolume(options, callback);
        }

        return async () => {
            if (Capacitor.isNativePlatform()) {
                VolumeButtons.clearWatch();
            }
        }
    }, [recorderContext, buttonReleaseCallback, buttonDownCallback])

    useEffect(() => {
        return () => {
            clearTimeout(waitDoubleClickTimer.current);
            waitDoubleClickTimer.current = null;
        }
    }, []);


    return (
        <>
            <Box sx={{
                position: "fixed",
                width: "100%",
                top: 0,
                bottom: 0,
                left: 0,
            }}>
                <Box sx={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",

                }}>
                    <Box sx={{
                    }}>
                        {recorderContext.storageObj?.currentNoteTitle
                            ? <Typography variant="h5" color="initial">{recorderContext.storageObj?.currentNoteTitle}</Typography>
                            : <Typography variant="h5" color="initial">&nbsp;</Typography>}

                        {recorderContext.storageObj?.totalRecordingTime > 0
                            ?
                            <Typography variant="body1" color={recorderContext.storageObj?.totalRecordingTime > 50 ? "green" : "red"}>
                                {recorderContext.storageObj?.totalRecordingTime.toFixed(1)} seconds
                                <IconButton aria-label="" sx={{
                                    mt: -0.1,
                                }} onClick={() => {
                                    showSnackbar("Works best with at least a couple paragraphs of text", 3000, { vertical: 'top', horizontal: 'center' })
                                }}>
                                    <InfoIcon fontSize='small' />
                                </IconButton>
                            </Typography>
                            :
                            <Typography variant="body1" color="initial">&nbsp;</Typography>
                        }

                        <IconButton aria-label=""
                            size='large'
                            disableRipple={true}
                            variant="contained"
                            sx={{
                                zIndex: 999999,
                                borderRadius: 300,
                                border: 1,
                                p: 15,
                                backgroundColor: mainButtonState + ".main",
                                color: mainButtonState + ".contrastText",
                                "&:hover": {
                                    backgroundColor: mainButtonState + ".dark",
                                    transition: "all .2s",
                                },
                            }}
                            onPointerDown={async () => {
                                buttonDownCallback()
                            }}

                            // pointer up substitution
                            onMouseLeave={async () => {
                                buttonReleaseCallback()
                            }}
                            onMouseUp={async () => {
                                buttonReleaseCallback()
                            }}

                            // for native platforms
                            onTouchEnd={async () => {
                                buttonReleaseCallback()
                            }}
                            onTouchCancel={async () => {
                                buttonReleaseCallback()
                            }}
                            onDoubleClick={onDoubleClick}
                        >
                            {(mainButtonState === "paused") && <PauseIcon fontSize='large' />}
                            {(mainButtonState === "primary") && <MicIcon fontSize='large' />}
                            {(mainButtonState === "record") && <StopIcon fontSize='large' />}
                            {(mainButtonState === "loading") && <HourglassEmptyIcon fontSize='large' />}
                        </IconButton>
                        <div>
                            {mainButtonState === "record" ?
                                <Typography variant="body1" color="initial">{recorderContext.recordingTimeSeconds.toFixed(1) + ' sec'}</Typography>
                                : firestoreContext.status !== "" ? <Typography variant="body1" color="initial">{firestoreContext.status}</Typography> : <Typography variant="body1" color="initial">&nbsp;</Typography>}
                            {firestoreContext.userProfile.recepientNote?.id && <Typography variant="body1" color="initial" onClick={() => {
                                if (!sessionUserId) return;

                                const itemRef = doc(db, "users", sessionUserId);
                                //delete param from firestore
                                updateDoc(itemRef, {
                                    [`recepientNote`]: deleteField(),
                                });
                            }}>Recepient {firestoreContext.userProfile.recepientNote?.id}
                                Text: {firestoreContext.userProfile.recepientNote?.dateString}
                            </Typography>
                            }
                        </div>
                    </Box>
                </Box>
                <Box sx={{
                    display: "flex",
                    flexDirection: "row-reverse",
                    position: "fixed",
                    bottom: 60,
                    overflow: "scroll",
                    width: "100%",
                }}>
                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        left: 0,
                        mx: 'auto',
                    }}>
                        {recorderContext.storageObj?.records?.map((messageObj, index) => {
                            return <MessageChip key={messageObj.id + messageObj.transctiption + messageObj.noteText} messageObj={messageObj} index={index} />
                        })}
                        {recorderContext.storageObj?.isSavingBlobBytes && <CircularProgress size={'1.5rem'} sx={{ mt: 0.8, ml: 1 }} />}
                    </Box>
                </Box>
            </Box>

        </>
    )
}

export default TalkTab