import { Box, List, ListItem, ListItemText } from "@mui/material";
import React, { Fragment } from "react";
import NoteCard from "../../../components/Note/NoteCard";
import { useFirestoreContext } from "../../../providers/FirestoreProvider";

const SavedTab = () => {
    const firestoreContext = useFirestoreContext();

    var ua = window.navigator.userAgent;
    var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    var webkit = !!ua.match(/WebKit/i);
    var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

    return (
        <>
            <Box
                sx={{
                    mt: 8,
                    my: 10,
                    maxWidth: "lg",
                    width: "100vw",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: "40vw",
                            maxWidth: "md",
                            // width: '50vw',
                            margin: "0 auto",
                        }}
                    >
                        <List>
                            {firestoreContext.savedNotesArray.map(
                                (note, index) => (
                                    <Fragment key={note.id}>
                                        <ListItem
                                            // ref={ref}
                                            key={note.id}
                                            sx={{
                                                display: "list-item",
                                            }}
                                            dense
                                        >
                                            <ListItemText>
                                                <NoteCard
                                                    note={note}
                                                    currentDate={new Date()}
                                                />
                                            </ListItemText>
                                        </ListItem>
                                    </Fragment>
                                )
                            )}
                        </List>
                    </Box>
                </Box>
                <Box sx={{ mt: 4 }}></Box>
            </Box>
        </>
    );
};

export default SavedTab;
