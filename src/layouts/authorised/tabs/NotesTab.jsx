import { Box } from "@mui/material";
import React from "react";
import NotesArea from "../../../components/NotesArea";

const NotesTab = () => {
    return (
        <>
            <Box
                sx={{
                    mt: 8,
                    my: 10,
                    mx: "auto",
                    maxWidth: "lg",
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
                            width: "100%",
                            margin: "0 auto",
                        }}
                    >
                        <NotesArea />
                    </Box>
                </Box>
                <Box sx={{ mt: 4 }}></Box>
            </Box>
        </>
    );
};

export default NotesTab;
