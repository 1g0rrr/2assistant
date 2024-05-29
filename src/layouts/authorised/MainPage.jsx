import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import MicIcon from '@mui/icons-material/Mic'
import NotesIcon from '@mui/icons-material/Notes'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import { useState } from 'react'
import Header from './Header'
import NotesTab from './tabs/NotesTab'
import PhotosTab from './tabs/PhotosTab'
import SavedTab from './tabs/SavedTab'
import TalkTab from "./tabs/TalkTab"

const MainPage = () => {

    const [tabIndex, setTabIndex] = useState(0);

    return (
        <>
            <Header setIsDrawerOpen={false} />
            {tabIndex === 0 && <PhotosTab />}
            {tabIndex === 1 && <TalkTab />}
            {tabIndex === 2 && <NotesTab />}
            {tabIndex === 3 && <SavedTab />}
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
                <BottomNavigation
                    showLabels
                    value={tabIndex}
                    onChange={(event, newValue) => {
                        setTabIndex(newValue);
                    }}
                >
                    <BottomNavigationAction label="Photos" icon={<MicIcon />} />
                    <BottomNavigationAction label="Talk" icon={<MicIcon />} />
                    <BottomNavigationAction label="Notes" icon={<NotesIcon />} />
                    <BottomNavigationAction label="Favorites" icon={<BookmarkBorderIcon />} />
                </BottomNavigation>
            </Paper>
        </>
    )
}

export default MainPage