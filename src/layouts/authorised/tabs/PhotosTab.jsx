import { CameraPreview } from '@capacitor-community/camera-preview';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, FormControlLabel, IconButton, ImageList, ImageListItem, Switch, TextField } from '@mui/material';
import { saveAs } from 'file-saver';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import JSZip from 'jszip';
import { useConfirm } from 'material-ui-confirm';
import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../../providers/AuthProvider';
import { useFirestoreContext } from '../../../providers/FirestoreProvider';
import { useRecorderContext } from '../../../providers/RecorderProvider';
import { db, storage } from '../../../services/firebase';

const PLATFORM_IOS = 'ios';
const PLATFORM_ANDROID = 'android';
const DIRECTION_UP = 'up';
const ACTION_DOWN = 'down';
const ACTION_UP = 'up';

const PhotosTab = () => {

    const authContext = useAuthContext();
    const sessionUserId = authContext.sessionUserId;
    const [photosItems, setPhotosItems] = useState([]);
    const [photosUrls, setPhotosUrls] = useState([]);
    const showConfirm = useConfirm();

    const [promptText, setPromptText] = useState("What's on this images?");
    const [aiAnswer, setAiAnswer] = useState('');

    // useEffect(() => {
    //     //show latest photos from storage

    //     async function asyncListPhotos() {
    //         console.log('sessionUserId', sessionUserId)
    //         const photosRef = ref(storage, `${sessionUserId}/`);
    //         const photos = await list(photosRef, { maxResults: 12 });
    //         const photosUrls = await Promise.all(photos.items.map(async (photoRef) => await getDownloadURL(photoRef)));
    //         setPhotosUrls(photosUrls);
    //         console.log('photos', photosUrls)
    //     }
    //     asyncListPhotos();
    // }, [sessionUserId]);

    useEffect(() => {
        if (!sessionUserId) return;
        //subscribe to photos
        const photosRef = collection(db, "users", sessionUserId, "photos");
        const q = query(photosRef, orderBy("id", "desc"), limit(6));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const urlsData = snapshot?.docs?.map(doc => doc?.data());
            setPhotosItems(urlsData);
            const urls = urlsData.map((item) => item.blobURL);
            console.log('urls', urls)
            setPhotosUrls(urls);
        });
        return () => {
            unsubscribe();
        }
    }, [sessionUserId]);

    const firestoreContext = useFirestoreContext();
    const recorderContext = useRecorderContext();

    const [mainButtonState, setMainButtonState] = useState('')

    const [checked, setChecked] = useState(false);
    const [imageData, setImageData] = useState('');

    const intervalRef = useRef();

    const handleChange = (event) => {
        setChecked(event.target.checked);
        console.log('checked', checked)
    }
    const downloadFolderAsZip = async (folderPath) => {
        const jszip = new JSZip();
        const storageRef = ref(storage, folderPath);
        // const folderRef = storage.app.ref(folderPath);

        const files = await listAll(storageRef).then(res => res.items);
        console.log('files', files)
        const url = await getDownloadURL(files[0]);
        console.log('url', url)
        const downloadUrls = await Promise.all(
            files.map(async (fileRef) => await getDownloadURL(fileRef))
        );
        console.log('downloadUrls', downloadUrls)
        const downloadedFiles = await Promise.all(downloadUrls.map(url => fetch(url).then(res => res.blob())));
        downloadedFiles.forEach((file, i) => jszip.file(files[i].name, file));
        const content = await jszip.generateAsync({ type: 'blob' });
        saveAs(content, `${folderPath}.zip`);
    };
    return (
        <>
            <Box sx={{
                // position: "fixed",
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
                    flexDirection: "column",
                }}>
                    <FormControlLabel control={
                        <Switch
                            checked={checked}
                            title='Start/Stop'
                            onChange={async () => {
                                async function takePhotoCallback() {


                                    //wait 1 second
                                    await new Promise(r => setTimeout(r, 1000));

                                    const cameraSampleOptions = {
                                        quality: 50,
                                    };

                                    const result = await CameraPreview.captureSample(cameraSampleOptions);
                                    setImageData(`data:image/jpeg;base64,${result.value}`);
                                    console.log('Captured');

                                    // const noteId = uuidv4();
                                    //NoteId string based on time to be able to sort by time
                                    const noteId = Date.now().toString();

                                    const pathToFile = `${sessionUserId}/${noteId}.jpeg`;
                                    const storageRef = ref(storage, pathToFile);

                                    //blob from base64
                                    const byteCharacters = atob(result.value);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: 'image/jpeg' });

                                    await uploadBytes(storageRef, blob);

                                    const downloadURL = await getDownloadURL(storageRef);

                                    const itemRef = doc(db, "users", sessionUserId, "photos", noteId);
                                    console.log('itemRef', itemRef)
                                    await setDoc(itemRef, {
                                        id: noteId,
                                        blobURL: downloadURL,
                                        createdAt: Date.now(),
                                    });

                                    // await CameraPreview.stop();
                                }


                                if (intervalRef.current) {
                                    clearInterval(intervalRef.current);
                                    intervalRef.current = null;
                                    await CameraPreview.stop();
                                    setChecked(false);
                                } else {
                                    await CameraPreview.start({
                                        parent: "content",
                                        toBack: true,
                                        position: "rear"
                                    });
                                    setChecked(true);

                                    //pause for 1 second
                                    await new Promise(r => setTimeout(r, 1000));
                                    takePhotoCallback()

                                    intervalRef.current = setInterval(takePhotoCallback, 10000);
                                }
                            }}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    } label="Photo every 10s:" labelPlacement="start" />
                    {aiAnswer != '' && <Alert
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => {
                                    setAiAnswer('');
                                }}
                            >
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        }
                        sx={{ mb: 2 }}
                    >
                        {aiAnswer}
                    </Alert>}
                    <TextField
                        id="outlined-controlled"
                        fullWidth
                        label="Prompt"
                        multiline
                        value={promptText}
                        onChange={(event) => {
                            setPromptText(event.target.value);
                        }}
                    />
                    <Button variant="text" color="primary" onClick={async () => {
                        console.log('analyze')
                        const answer = await firestoreContext.addPhotoCallback(promptText, photosUrls);
                        console.log('answer', answer)
                        setAiAnswer(answer);
                    }}>
                        Ask
                    </Button>


                    <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={264}>
                        {photosItems?.map((item) => (
                            <ImageListItem key={item.blobURL} sx={{ overflow: 'hidden' }} onClick={() => {
                                console.log('clicked', item)
                                showConfirm({ description: "This action is permanent!" }).then(() => {
                                    //delete photo from storage and firestore
                                    const pathToFile = `${sessionUserId}/${item.id}.jpeg`;
                                    const storageRef = ref(storage, pathToFile);
                                    deleteObject(storageRef).then(() => {
                                        console.log('Deleted')
                                    })
                                    const itemRef = doc(db, "users", sessionUserId, "photos", item.id);
                                    deleteDoc(itemRef).then(() => {
                                        console.log('Deleted')
                                    })
                                })
                            }}>
                                <img
                                    srcSet={`${item.blobURL}?w=164&h=264&fit=crop&auto=format&dpr=2 2x`}
                                    src={`${item.blobURL}?w=164&h=264&fit=crop`}
                                    // alt={item.title}
                                    loading="lazy"
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                    <Button variant="text" color="primary" onClick={() => {
                        downloadFolderAsZip('gs://shinyclubapp.appspot.com/wmcK8Sqpu3SZjl6CUb1vRIfeHTA2/')
                    }}>
                        Download
                    </Button>

                    <div id="content">
                        ==
                        {/* <Button variant="text" color="primary" onClick={() => {
                            CameraPreview.start({
                                parent: "content",
                                toBack: true,
                                position: "front"
                            });
                        }}>
                            start front preview
                        </Button>
                        <Button variant="text" color="primary" onClick={() => {
                            CameraPreview.start({
                                parent: "content",
                                toBack: true,
                                position: "rear"
                            });
                        }}>
                            start rear preview
                        </Button> */}
                    </div>
                    {/* 
                    <Button variant="text" color="primary" onClick={() => {
                        CameraPreview.stop();
                    }}>
                        stop preview
                    </Button> */}

                    {/* <Button variant="text" color="primary" onClick={async () => {
                        console.log('capture')
                        const cameraSampleOptions = {
                            quality: 50
                        };

                        const result = await CameraPreview.captureSample(cameraSampleOptions);
                        setImageData(`data:image/jpeg;base64,${result.value}`);

                        //send result to server
                        firestoreContext.addPhotoCallback(sessionUserId, result.value);

                    }}>
                        Capture
                    </Button> */}


                    {/* {imageData ? (
                        <div>
                            <img width="100px"
                                src={imageData}
                                alt="Most Recent"
                            />
                        </div>
                    ) : (
                        <div></div>
                    )} */}

                    {/* <Grid container spacing={2}>
                        {photosUrls.map((url) =>
                            <Grid item xs={4}
                                key={url}
                            >
                                <Img alt="complex" src="/static/images/grid/complex.jpg" />
                                <img src={url} alt="photo" />
                            </Grid>
                        )}
                    </Grid> */}
                    {/* <List >
                        {photosUrls.map((url) =>
                            <ListItem
                                key={url}
                                sx={{}} dense
                            >
                                <img src={url} alt="photo" />
                            </ListItem>
                        )}
                    </List> */}
                </Box>
            </Box>

        </>
    )
}

export default PhotosTab