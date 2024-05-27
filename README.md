# Brief context:

My main goal here was to make it easy to remove/change big parts of the application and cut corners for the development speed.

I deliberately decided not to use Typescript and not to cover the code with tests at this stage. Just to write less code as here I was a solo developer. Types and tests will be useful when the idea becomes more stable.

I used Provider + Firestore as a substitute for the state manager (at FirestoreProvider.js) as it makes it pretty easy to rewrite or delete the significant part of code if needed. Later I'd use Zustand for managing state.

I needed to rewrite the app significantly 2 times, so it paid off on practice.

### As for other parts:

-   The app is crossplatform and compiles to native android with Capacitor, that's why it's made with Vite. There are some crossplatform parts like in TalkTab.jsx to control volume button or in SignInCrossPlatform.jsx for authorisation.

-   /functions/index.js - is a backend part of the app. It listens when voice note added to the queue for processing, then merge all blobs and then transcribe and summarize it. I made blob processing fully asynchronously from the frontend to make the app more responsible.

-   useMicrophone.js - is a hook to grab the stream from the microphone. The problem was getting it to work with all headphones so there are a lot of "if" statements and plaing around with buffer size.

-   For iPhones it compress audio with ffmpeg as it's blob is much bigger than on other platforms.

-   useStorage.js - saves blobs to the Firebase storage. I used indexedDB for this before but then switched to cloud storage to make the app more reliable.

-   Some effort was put into small UI details. For example, in RecorderProvider.js there is the difficulty of stopping recording during microphone capture by browser, and at that point there are no events for me to listen to. So the script tries to stop recording every 200ms until it is done.

-   Layout was made to support all the device sizes from desktops to 2" child smartphones. Smaller phones are more convenient to be a pocket AI assistant.

# Blog how it was made and presented at CES 2024

https://medium.com/@shinytimer/walkienotes-how-to-get-a-keychain-ai-assistant-for-50-d7101c7cbc8a
