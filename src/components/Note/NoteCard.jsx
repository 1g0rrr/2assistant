import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Card, CircularProgress, IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import NoteDetails from './NoteDetails';

const NoteCard = ({ note, currentDate }) => {
    const [isUnfolded, setIsUnfolded] = useState(false);

    return (
        <div>
            <Card
                sx={{
                    borderRadius: 2,
                    pb: 1,
                    borderColor: grey[300],
                    boxShadow: 0,
                    p: 2,
                    width: 1,
                }}
            >
                {note.noteTitle &&
                    <Typography variant="h6" color="initial"
                        sx={{
                            // ml: -2,
                            mt: 1,
                            mb: 2,
                        }}
                    >
                        {note.noteTitle ?? '...'}
                    </Typography>
                }
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }} >
                    {!note.noteSummary && <CircularProgress size={'1.5rem'} sx={{ ml: 2, mt: 1 }} />}
                    {note.noteSummary &&
                        <Typography
                            className='my-editor'
                            variant="body2"
                            color="primary"
                            sx={{
                                width: '100%',
                                '& p': {
                                    py: -1,
                                    my: 0.5,
                                },
                            }}
                            dangerouslySetInnerHTML={{
                                __html: note.noteSummary.trim().replaceAll('\n', '<br/>').replaceAll('...', '').replaceAll('```html', '').replaceAll('```', '')
                            }}
                        ></Typography>
                    }
                    <Box sx={{ my: 'auto' }}>
                        <IconButton
                            sx={{ m: 0, p: 0 }}
                            size='small' onClick={() => {
                                setIsUnfolded(p => !p)
                            }}>
                            <UnfoldMoreIcon fontSize='small' />
                        </IconButton>
                    </Box>
                </Box>
            </Card>
            {isUnfolded && <NoteDetails note={note} currentDate={currentDate} />}
        </div >
    )
}

export default NoteCard