import { FormControl, FormLabel, ListItem, MenuItem, Select } from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../../../providers/AuthProvider';
import { useSnackbar } from '../../../providers/Snackbar';
import { db } from '../../../services/firebase';

const SettingsLanguageItem = ({ fieldName, title }) => {

    const authContext = useAuthContext()
    const showSnackbar = useSnackbar();

    return (
        <ListItem >
            <FormControl sx={{ width: '100%', mb: 2 }}>
                <FormLabel id="language">{title}</FormLabel>
                <Select
                    size='small'
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={authContext.userProfile.settings?.[`${fieldName}`] ?? 'en'}
                    // label="Your voice language"
                    onChange={(event) => {
                        const userRef = doc(db, "users", authContext.sessionUserId);
                        updateDoc(userRef, {
                            [`settings.${fieldName}`]: event.target.value,
                        }, { merge: true });
                        showSnackbar('Language updated')

                    }}
                >
                    <MenuItem value='en'>English</MenuItem>
                    <MenuItem value='es'>Spanish</MenuItem>
                    <MenuItem value='de'>German</MenuItem>
                    <MenuItem value='pl'>Polish</MenuItem>
                    <MenuItem value='uk'>Ukrainian</MenuItem>
                    <MenuItem value='fr'>French</MenuItem>
                    <MenuItem value='it'>Italian</MenuItem>
                    <MenuItem value='nl'>Dutch</MenuItem>
                    <MenuItem value='pt'>Portuguese</MenuItem>
                    <MenuItem value='ja'>Japanese</MenuItem>
                    <MenuItem value='zh'>Chinese</MenuItem>
                    <MenuItem value='ko'>Korean</MenuItem>
                    <MenuItem value='ru'>Russian</MenuItem>
                    <MenuItem value='sv'>Swedish</MenuItem>
                    <MenuItem value='da'>Danish</MenuItem>
                    <MenuItem value='fi'>Finnish</MenuItem>
                    <MenuItem value='tr'>Turkish</MenuItem>
                    <MenuItem value='el'>Greek</MenuItem>
                    <MenuItem value='id'>Indonesian</MenuItem>
                    <MenuItem value='ro'>Romanian</MenuItem>
                    <MenuItem value='cz'>Czech</MenuItem>
                </Select>
            </FormControl>
        </ListItem>
    )
}

export default SettingsLanguageItem