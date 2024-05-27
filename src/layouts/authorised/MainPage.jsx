import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import MicIcon from '@mui/icons-material/Mic'
import NotesIcon from '@mui/icons-material/Notes'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import { useState } from 'react'
import Header from './Header'
import NotesTab from './tabs/NotesTab'
import SavedTab from './tabs/SavedTab'
import TalkTab from "./tabs/TalkTab"

const MainPage = () => {

    const [tabIndex, setTabIndex] = useState(0);

    return (
        <>
            <Header setIsDrawerOpen={false} />
            {tabIndex === 0 && <TalkTab />}
            {tabIndex === 1 && <NotesTab />}
            {tabIndex === 2 && <SavedTab />}
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
                <BottomNavigation
                    showLabels
                    value={tabIndex}
                    onChange={(event, newValue) => {
                        setTabIndex(newValue);
                    }}
                >
                    <BottomNavigationAction label="Talk" icon={<MicIcon />} />
                    <BottomNavigationAction label="Notes" icon={<NotesIcon />} />
                    <BottomNavigationAction label="Favorites" icon={<BookmarkBorderIcon />} />
                </BottomNavigation>
            </Paper>
        </>
    )
}

export default MainPage