import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, firebaseAuthInstance } from '../services/firebase';



async function _createUserInFirebase(_firebaseUser) {
    const userRef = doc(db, `users`, _firebaseUser.uid);

    const newUser = {
        id: _firebaseUser.uid,
        createdAt: new Date(),
        displayName: 'Not registered',
    }
    await setDoc(userRef, newUser);

    //Place to set default notes to the user
}

async function _updateUserInFirebase(_firebaseUser, userData) {
    const userRef = doc(db, `users`, _firebaseUser.uid);

    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Updating fields than can be changed
    let updatedUserObj = {
        // createdAt: Timestamp.fromMillis(parseInt(_firebaseUser?.metadata.createdAt)),
        // TODO: ?change last login to browser time
        lastLoginAt: serverTimestamp(),
        displayName: _firebaseUser.displayName ?? '',
        photoURL: _firebaseUser.photoURL ?? '',
        timeZone: browserTimezone ?? '',
    };

    const browserLangXX = Intl.NumberFormat().resolvedOptions().locale.slice(0, 2)

    updatedUserObj = {
        ...updatedUserObj,
        settings: {
            inputLanguageXX: userData?.settings?.inputLanguageXX ?? browserLangXX,
            outputLanguageXX: userData?.settings?.outputLanguageXX ?? browserLangXX,
        }
    }

    setDoc(userRef, updatedUserObj,
        { merge: true }).catch((error) => {
            console.error("Error adding document: ", error);
        });

}

const AuthContext = createContext();

const AuthProvider = ({ children }) => {

    const [firebaseAuthUser, setFirebaseAuthUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [appSettings, setAppSettings] = useState(null);

    const navigate = useNavigate();

    const sessionUserId = firebaseAuthUser?.uid;
    const isUserLoggedIn = Boolean(firebaseAuthUser?.email);

    const [isCheckedInitialAuth, setIsCheckedInitialAuth] = useState(false);

    let location = useLocation();
    const notEmptyFromLocation = location.state?.fromLocation ? location.state?.fromLocation : { pathname: "/" };
    let fromLocation = notEmptyFromLocation.pathname === "/login" ? { pathname: "/" } : notEmptyFromLocation;

    //  При каждой смене локейшена - делается проверкаssыы
    useEffect(() => {

    }, [firebaseAuthUser?.uid, location, navigate, fromLocation?.pathname]);

    // Хак для одиночного вызова. Только один раз
    useEffect(() => {

        let userUnsubscribe = undefined;
        const unsubscribeAuthChanced = onAuthStateChanged(
            firebaseAuthInstance,
            async (_firebaseUser) => {

                setIsCheckedInitialAuth(true);
                if (!_firebaseUser?.uid) {
                    if (location.pathname !== '/login') {
                        navigate('/login', { replace: true, state: { fromLocation: location } });
                    }
                } else {
                    if (location.pathname === '/login') {
                        navigate(fromLocation?.pathname, { replace: true, state: { fromLocation: location } });
                    }
                }
                setFirebaseAuthUser(_firebaseUser);

                if (_firebaseUser) {
                    const userRef = doc(db, "users", _firebaseUser?.uid);

                    let userDoc = await getDoc(userRef);
                    // Если пользователь не создан в базе - то создаем его
                    if (!userDoc.exists()) {

                        await _createUserInFirebase(_firebaseUser);

                        // И добавляем дефолтные настройки
                        userDoc = await getDoc(userRef);
                        const userData = userDoc.data();
                        await _updateUserInFirebase(_firebaseUser, userData);

                    } else {
                        //Если юзер создан - то сразу проверяем дефолтные настройки и обновляем
                        const userData = userDoc.data();
                        await _updateUserInFirebase(_firebaseUser, userData);
                    }


                    if (userUnsubscribe) {
                        userUnsubscribe();
                    }

                    userUnsubscribe = onSnapshot(userRef, async (querySnapshot) => {
                        const user = querySnapshot.data();

                        setUserProfile(user);
                        // , { state: { fromLocation: location } }ы
                        // navigate(fromLocation?.pathname);
                    });


                } else {
                    setUserProfile();
                    // , { state: { fromLocation: fromLocation } }
                    // navigate('/login');

                }


            }
        );

        return () => {
            unsubscribeAuthChanced();
            if (userUnsubscribe) {
                userUnsubscribe();
            }
        }

    }, [fromLocation?.pathname, location, navigate]);

    useEffect(() => {

        const userRef = doc(db, "app", "settings");
        const unsubscribe = onSnapshot(userRef, (querySnapshot) => {
            const settingsData = querySnapshot.data();


            setAppSettings(settingsData);
        });
        return () => unsubscribe();
    }, [])

    return (
        <AuthContext.Provider value={{
            isUserLoggedIn,
            isCheckedInitialAuth,
            appSettings,
            firebaseAuthUser,
            userProfile,
            sessionUserId,
        }}>
            {children}
        </AuthContext.Provider>
    )
}


export default AuthProvider
export function useAuthContext() {
    return useContext(AuthContext);
}
