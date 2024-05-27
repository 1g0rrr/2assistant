import { Box, Button } from "@mui/material";
import { useState } from "react";
import MessageDialog from "../layouts/authorised/dialogs/MessageDialog";

const MessageChip = ({ messageObj, index }) => {

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const title = `Part ${index + 1}`

    return (
        <>
            <Box sx={{
                wordWrap: 'none',
                whiteSpace: "nowrap"

            }}>
                <MessageDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} messageObj={messageObj} title={title} />
                <Button variant="outlined"
                    sx={{ m: 0.5 }}
                    size='small'
                    color='secondary'
                    onClick={
                        () => {
                            setIsDialogOpen(true)
                        }}>
                    {title}
                </Button>
            </Box>
        </>
    )
}

export default MessageChip