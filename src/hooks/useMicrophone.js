import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { useEffect, useRef, useState } from 'react';

const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm";

const defaultConfig = {
    isCompress: false,
    timeSlice: 1_000,
    onBlobGenerated: undefined,
}

/**
 * React Hook for Microphone Recording
 */
export const useMicrophone = (config) => {
    const {
        isCompress,
        timeSlice,
        onBlobGenerated,
    } = {
        ...defaultConfig,
        ...config,
    }

    if (!onBlobGenerated) {
        throw new Error('onBlobGenerated is not provided')
    }

    const encoder = useRef()
    const listener = useRef()
    const recorder = useRef()
    const stream = useRef()

    const isStopWhenPossibleRef = useRef(false)

    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [grabbingMicrophone, setGrabbingMicrophone] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    const [blobSize, setBlobSize] = useState(0)
    const ffmpegRef = useRef(new FFmpeg());

    var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    useEffect(() => {
        return () => {
            // cleanup on component unmounted
            if (encoder.current) {
                encoder.current.flush()
                encoder.current = undefined
            }
            if (recorder.current) {
                recorder.current.destroy()
                recorder.current = undefined
            }
            if (listener.current) {
                listener.current.off('speaking', onStartSpeaking)
                listener.current.off('stopped_speaking', onStopSpeaking)
            }
            if (stream.current) {
                stream.current.getTracks().forEach((track) => track.stop())
                stream.current = undefined
            }
        }
    }, [])

    const startMediaStreaming = async () => {

        if (stream.current) {
            stream.current.getTracks().forEach((track) => track.stop())
        }

        //grab microphone with system popup
        setGrabbingMicrophone(true)
        stream.current = await navigator.mediaDevices.getUserMedia({
            audio: isEdge ? true : {
                echoCancellation: false
            }
        })
        setGrabbingMicrophone(false)

        //register hark speaking detection listeners
        if (!listener.current) {
            const { default: hark } = await import('hark')
            listener.current = hark(stream.current, {
                interval: 50,
                play: false,
                threshold: -100,
            })
            listener.current.on('speaking', onStartSpeaking)
            listener.current.on('stopped_speaking', onStopSpeaking)
        }
    }


    const stopMediaStreaming = () => {
        //remove hark speaking detection listeners
        if (listener.current) {
            listener.current.off('speaking', onStartSpeaking)
            listener.current.off('stopped_speaking', onStopSpeaking)
            listener.current = undefined
        }

        //stop all media stream tracks, release microphone
        if (stream.current) {
            stream.current.getTracks().forEach((track) => track.stop())
            stream.current = undefined
        }
    }

    const onStartSpeaking = () => {
        setIsSpeaking(true)
    }

    const onStopSpeaking = () => {
        setIsSpeaking(false)
    }

    const handleStartRecording = async () => {

        if (!stream.current) {
            // grab microphine stream
            await startMediaStreaming()
        }

        // interrupt if recording button was released during grabbing microphone
        if (isStopWhenPossibleRef.current) {
            isStopWhenPossibleRef.current = false
            if (stream.current) {
                stream.current.getTracks().forEach((track) => track.stop())
            }
            stream.current = undefined
            return
        }


        if (stream.current) {
            // setup RTC recorder
            if (!recorder.current) {
                const {
                    default: { RecordRTCPromisesHandler, StereoAudioRecorder },
                } = await import('recordrtc')

                const recorderConfig = {
                    type: 'audio',
                    numberOfAudioChannels: isEdge ? 1 : 2,
                    checkForInactiveTracks: true,
                    bufferSize: 4096, // or 16384
                    timeSlice: timeSlice,
                    disableLogs: true,
                    ondataavailable: (chank) => {
                        setBlobSize(p => p + chank.size)
                    }
                }

                if (isSafari || isEdge) {
                    recorderConfig.recorderType = StereoAudioRecorder;
                }

                if (navigator.platform && navigator.platform.toString().toLowerCase().indexOf('win') === -1) {
                    recorderConfig.sampleRate = 48000; // or 44100 or remove this line for default
                }

                if (isSafari) {
                    recorderConfig.sampleRate = 44100;
                    recorderConfig.bufferSize = 4096; // or 256 §
                    recorderConfig.numberOfAudioChannels = 2;
                }

                recorder.current = new RecordRTCPromisesHandler(
                    stream.current,
                    recorderConfig
                )
            }

            // setup lamejs encoder
            if (!encoder.current) {
                const { Mp3Encoder } = await import('lamejs')
                encoder.current = new Mp3Encoder(1, 44100, 96)
            }

            const recordState = await recorder.current.getState()

            if (recordState === 'inactive' || recordState === 'stopped') {
                setBlobSize(0)
                await recorder.current.startRecording()
            }

            if (recordState === 'paused') {
                await recorder.current.resumeRecording()
            }

            setIsRecording(true)
        }
    }

    const handlePauseRecording = async () => {
        try {
            if (recorder.current) {
                const recordState = await recorder.current.getState()
                if (recordState === 'recording') {
                    await recorder.current.pauseRecording()
                }
                setIsRecording(false)
            }
        } catch (err) {
            console.error(err)
        }
    }


    const handleStopRecording = async () => {
        try {
            if (recorder.current) {

                const recordState = await recorder.current.getState()

                // stop the recorder
                if (recordState === 'recording' || recordState === 'paused') {
                    await recorder.current.stopRecording()
                }

                // release microphone
                stopMediaStreaming()
                setIsRecording(false)

                await generateBlob()

                // destroy recorder and encoder
                await recorder.current.destroy()
                recorder.current = undefined
                if (encoder.current) {
                    encoder.current.flush()
                    encoder.current = undefined
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    const generateBlob = async () => {
        try {
            if (encoder.current && recorder.current) {

                // make sure recorder state is stopped
                const recordState = await recorder.current.getState()
                if (recordState === 'stopped') {

                    // get audio blob from recordrtc
                    let blob = await recorder.current.getBlob()

                    const buffer = await blob.arrayBuffer()

                    // save size for checking encoding efficiency
                    const inSize = buffer.byteLength;

                    // compress blob if needed
                    if (isCompress) {
                        const ffmpeg = ffmpegRef.current;
                        if (!ffmpeg.loaded) {
                            await ffmpeg.load({
                                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                                wasmURL: await toBlobURL(
                                    `${baseURL}/ffmpeg-core.wasm`,
                                    "application/wasm"
                                ),
                            })
                        }

                        // write raw blob buffer to file
                        await ffmpeg.writeFile('in.wav', new Uint8Array(buffer))

                        // compress audio file
                        await ffmpeg.exec(
                            [
                                '-i', // Input
                                'in.wav',
                                '-acodec', // Audio codec
                                'libmp3lame',
                                '-b:a', // Audio bitrate
                                '96k',
                                '-ar', // Audio sample rate
                                '44100',
                                'out.mp3' // Output
                            ]
                        )

                        // read compressed buffer from file
                        const out = await ffmpeg.readFile('out.mp3')

                        // less than 226 is empty mp3 file
                        if (out.length <= 225) {
                            ffmpeg.terminate()
                            return
                        }

                        blob = new Blob([out.buffer], { type: 'audio/mpeg' })
                        ffmpeg.terminate()
                    }

                    if (typeof onBlobGenerated === 'function') {
                        onBlobGenerated(blob, inSize);
                    }
                }
            }
        } catch (err) {
            console.info(err)
        }
    }


    const startRecording = async () => {
        setIsProcessing(true)
        isStopWhenPossibleRef.current = false
        await handleStartRecording()
        setIsProcessing(false)
    }

    const pauseRecording = async () => {
        await handlePauseRecording()
    }

    const stopRecording = async () => {
        setIsProcessing(true)
        await handleStopRecording()
        setIsProcessing(false)
    }

    const cancelRecording = async () => {
        isStopWhenPossibleRef.current = true
    }

    return {
        isRecording,
        isProcessing,
        isSpeaking,
        blobSize,
        cancelRecording,
        pauseRecording,
        startRecording,
        stopRecording,
        grabbingMicrophone,
    }
}
