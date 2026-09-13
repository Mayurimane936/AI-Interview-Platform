import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

import { useAuth } from "../context/AuthContext";
import { synthesizeSpeech } from "../api/speech";
import { getSpeechToken } from "../api/stt";

import {
    getInterview,
    getInterviewQuestions,
    startInterview,
    submitAnswer,
    evaluateAnswer,
    completeInterview,
} from "../api/interview";

function Interview() {
    const { interviewId } = useParams();
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    // =========================================================
    // TEXT-TO-SPEECH
    // =========================================================

    const audioRef = useRef(null);
    const audioUrlRef = useRef(null);

    const speakQuestion = async (text) => {
        if (!text) {
            return;
        }

        try {
            setIsSpeaking(true);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }

            const audioUrl = await synthesizeSpeech(text);
            audioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
            };

            await audio.play();
        } catch (error) {
            console.error("AZURE TTS ERROR:", error);
            setIsSpeaking(false);
        }
    };

    const speakWelcome = async () => {
        const welcomeText =
            "Welcome to your AI technical interview. You will receive one question at a time. Please explain your reasoning clearly and take your time. When you are ready, click Start Interview to begin.";

        await speakQuestion(welcomeText);
    };

    const [interview, setInterview] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [currentQuestionIndex, setCurrentQuestionIndex] =
        useState(0);

    const [answer, setAnswer] = useState("");

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [retryingEvaluation, setRetryingEvaluation] =
        useState(false);

    const [error, setError] = useState("");
    const [evaluationError, setEvaluationError] =
        useState("");

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    // =========================================================
    // VOICE ANSWER STATE
    // =========================================================

    const [isListening, setIsListening] =
        useState(false);

    const [speechSupported, setSpeechSupported] =
        useState(true);

    const [speechError, setSpeechError] =
        useState("");

    const [answerMode, setAnswerMode] =
        useState("type");

    const [pasteWarningOpen, setPasteWarningOpen] =
        useState(false);

    const [pendingPastedValue, setPendingPastedValue] =
        useState("");

    const [answerWasPasted, setAnswerWasPasted] =
        useState(false);

    const [interimTranscript, setInterimTranscript] =
        useState("");

    const [silencePromptOpen, setSilencePromptOpen] =
        useState(false);

    const speechRecognizerRef = useRef(null);
    const speechTokenRef = useRef(null);
    const silenceTimerRef = useRef(null);

    const [submittedAnswers, setSubmittedAnswers] =
        useState({});

    useEffect(() => {
        return () => {
            setIsSpeaking(false);

            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            const recognizer =
                speechRecognizerRef.current;

            speechRecognizerRef.current = null;
            speechTokenRef.current = null;

            if (recognizer) {
                try {
                    recognizer.stopContinuousRecognitionAsync(
                        () => {},
                        () => {}
                    );
                } catch {
                    // Already stopped.
                }

                try {
                    recognizer.close();
                } catch {
                    // Already closed.
                }
            }
        };
    }, []);

    // =========================================================
    // AZURE SPEECH RECOGNITION
    // =========================================================

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    const startSilenceTimer = () => {
        clearSilenceTimer();

        silenceTimerRef.current = setTimeout(async () => {
            silenceTimerRef.current = null;

            const recognizer =
                speechRecognizerRef.current;

            if (!recognizer || hasSubmitted || submitting) {
                return;
            }

            try {
                await new Promise((resolve) => {
                    recognizer.stopContinuousRecognitionAsync(
                        () => resolve(),
                        () => resolve()
                    );
                });
            } catch (error) {
                console.error(
                    "AZURE STT SILENCE STOP ERROR:",
                    error
                );
            }

            setIsListening(false);
            setInterimTranscript("");
            setSilencePromptOpen(true);
        }, 3000);
    };

    const cleanupSpeechRecognizer = async ({
        clearAnswerInterim = true,
        closeRecognizer = true,
    } = {}) => {
        clearSilenceTimer();

        const recognizer = speechRecognizerRef.current;

        if (!recognizer) {
            setIsListening(false);
            if (clearAnswerInterim) {
                setInterimTranscript("");
            }
            return;
        }

        speechRecognizerRef.current = null;
        speechTokenRef.current = null;

        try {
            await new Promise((resolve) => {
                recognizer.stopContinuousRecognitionAsync(
                    () => resolve(),
                    () => resolve()
                );
            });
        } catch (error) {
            console.error(
                "AZURE STT STOP ERROR:",
                error
            );
        }

        if (closeRecognizer) {
            try {
                recognizer.close();
            } catch {
                // Recognizer may already be closed.
            }
        }

        setIsListening(false);
        if (clearAnswerInterim) {
            setInterimTranscript("");
        }
    };

    // Stop speech recognition whenever
    // the user moves to another question.
    useEffect(() => {
        setSilencePromptOpen(false);
        clearSilenceTimer();

        if (speechRecognizerRef.current) {
            cleanupSpeechRecognizer();
        }

        setInterimTranscript("");
        setSpeechError("");
    }, [currentQuestionIndex]);

    // =========================================================
    // START / STOP VOICE INPUT
    // =========================================================

    const handleStartListening = async () => {
        if (hasSubmitted || submitting || answerMode !== "speak") {
            return;
        }

        if (speechRecognizerRef.current) {
            return;
        }

        try {
            setSpeechError("");
            setInterimTranscript("");
            setSilencePromptOpen(false);
            clearSilenceTimer();

            const speechAuth = await getSpeechToken();

            if (!speechAuth?.token || !speechAuth?.region) {
                throw new Error(
                    "Unable to get Azure Speech authorization."
                );
            }

            speechTokenRef.current = speechAuth.token;

            const speechConfig =
                SpeechSDK.SpeechConfig.fromAuthorizationToken(
                    speechAuth.token,
                    speechAuth.region
                );

            speechConfig.speechRecognitionLanguage =
                "en-US";

            const audioConfig =
                SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

            const recognizer =
                new SpeechSDK.SpeechRecognizer(
                    speechConfig,
                    audioConfig
                );

            speechRecognizerRef.current = recognizer;

            recognizer.recognizing = (
                _sender,
                event
            ) => {
                if (
                    speechRecognizerRef.current !==
                    recognizer
                ) {
                    return;
                }

                if (event.result?.text) {
                    setInterimTranscript(
                        event.result.text
                    );

                    startSilenceTimer();
                }
            };

            recognizer.recognized = (
                _sender,
                event
            ) => {
                if (
                    speechRecognizerRef.current !==
                    recognizer
                ) {
                    return;
                }

                if (
                    event.result?.reason ===
                    SpeechSDK.ResultReason.RecognizedSpeech
                ) {
                    const finalText =
                        event.result.text?.trim();

                    if (finalText) {
                        setAnswer((previous) => {
                            const separator =
                                previous &&
                                !previous.endsWith(" ")
                                    ? " "
                                    : "";

                            return (
                                previous +
                                separator +
                                finalText
                            );
                        });
                    }

                    setInterimTranscript("");
                    startSilenceTimer();
                }
            };

            recognizer.canceled = (
                _sender,
                event
            ) => {
                console.error(
                    "AZURE STT CANCELED:",
                    event.reason,
                    event.errorDetails
                );

                if (
                    speechRecognizerRef.current !==
                    recognizer
                ) {
                    return;
                }

                clearSilenceTimer();
                setSilencePromptOpen(false);

                setSpeechError(
                    event.errorDetails ||
                        "Azure Speech recognition was canceled."
                );

                speechRecognizerRef.current = null;
                speechTokenRef.current = null;

                try {
                    recognizer.close();
                } catch {
                    // Already closed.
                }

                setIsListening(false);
                setInterimTranscript("");
            };

            recognizer.sessionStopped = (
                _sender,
                _event
            ) => {
                if (
                    speechRecognizerRef.current ===
                    recognizer
                ) {
                    setIsListening(false);
                }
            };

            await new Promise((resolve, reject) => {
                recognizer.startContinuousRecognitionAsync(
                    () => {
                        setIsListening(true);
                        resolve();
                    },
                    (error) => {
                        reject(
                            new Error(
                                String(error)
                            )
                        );
                    }
                );
            });

        } catch (error) {
            console.error(
                "AZURE STT START ERROR:",
                error
            );

            if (speechRecognizerRef.current) {
                try {
                    speechRecognizerRef.current.close();
                } catch {
                    // Already closed.
                }
            }

            speechRecognizerRef.current = null;
            speechTokenRef.current = null;

            setIsListening(false);
            setInterimTranscript("");

            if (
                error?.name ===
                "NotAllowedError"
            ) {
                setSpeechError(
                    "Microphone permission was denied. Please allow microphone access in your browser."
                );
            } else {
                setSpeechError(
                    error?.message ||
                        "Unable to start Azure Speech recognition. Please try again."
                );
            }
        }
    };

    const handleStopListening = async () => {
        setSilencePromptOpen(false);
        clearSilenceTimer();

        const recognizer =
            speechRecognizerRef.current;

        if (!recognizer) {
            setIsListening(false);
            setInterimTranscript("");
            return;
        }

        speechRecognizerRef.current = null;
        speechTokenRef.current = null;

        try {
            await new Promise((resolve, reject) => {
                recognizer.stopContinuousRecognitionAsync(
                    () => resolve(),
                    (error) =>
                        reject(
                            new Error(
                                String(error)
                            )
                        )
                );
            });
        } catch (error) {
            console.error(
                "AZURE STT STOP ERROR:",
                error
            );

            setSpeechError(
                error?.message ||
                    "Unable to stop speech recognition cleanly."
            );
        } finally {
            try {
                recognizer.close();
            } catch {
                // Already closed.
            }

            setIsListening(false);
            setInterimTranscript("");
        }
    };

    const handleContinueListening = async () => {
        const recognizer = speechRecognizerRef.current;

        if (!recognizer || hasSubmitted || submitting) {
            return;
        }

        try {
            clearSilenceTimer();
            setSilencePromptOpen(false);
            setSpeechError("");
            setInterimTranscript("");

            await new Promise((resolve, reject) => {
                recognizer.startContinuousRecognitionAsync(
                    () => {
                        setIsListening(true);
                        resolve();
                    },
                    (error) => {
                        reject(
                            new Error(
                                String(error)
                            )
                        );
                    }
                );
            });
        } catch (error) {
            console.error(
                "AZURE STT RESUME ERROR:",
                error
            );

            setSpeechError(
                error?.message ||
                    "Unable to continue speech recognition. Please try again."
            );
        }
    };

    const handleClearAnswer = () => {
        if (hasSubmitted) {
            return;
        }

        setAnswer("");
        setInterimTranscript("");
        setError("");
    };

    // =========================================================
    // ANSWER INPUT MODE
    // =========================================================

    const handleAnswerModeChange = async (mode) => {
        if (hasSubmitted || submitting || mode === answerMode) {
            return;
        }

        if (isListening) {
            await handleStopListening();
        }

        setAnswerMode(mode);
        setInterimTranscript("");
        setSpeechError("");
        setSilencePromptOpen(false);
    };

    const handleAnswerChange = (event) => {
        if (hasSubmitted || answerMode !== "type") {
            return;
        }

        setAnswer(event.target.value);
        setError("");
    };

    const handleAnswerPaste = (event) => {
        if (hasSubmitted || answerMode !== "type") {
            return;
        }

        event.preventDefault();

        const pastedText = event.clipboardData?.getData("text") || "";
        if (!pastedText) return;

        const textarea = event.currentTarget;
        const currentValue = answer;
        const selectionStart = textarea.selectionStart ?? currentValue.length;
        const selectionEnd = textarea.selectionEnd ?? currentValue.length;

        const nextValue =
            currentValue.slice(0, selectionStart) +
            pastedText +
            currentValue.slice(selectionEnd);

        setPendingPastedValue(nextValue);
        setPasteWarningOpen(true);
    };

    const handlePasteCancel = () => {
        // The paste has not been committed yet because the paste
        // event is prevented. Keep the user's existing answer
        // exactly as it was and discard only the pending paste.
        setPasteWarningOpen(false);
        setPendingPastedValue("");
        setInterimTranscript("");
    };

    const handlePasteContinue = () => {
        setAnswer(pendingPastedValue);
        setAnswerWasPasted(true);
        setPasteWarningOpen(false);
        setPendingPastedValue("");
        setError("");
    };

    // =========================================================
    // LOAD INTERVIEW
    // =========================================================

    useEffect(() => {
        const loadInterview = async () => {
            try {
                setLoading(true);
                setError("");

                const interviewData = await getInterview(
                    token,
                    interviewId,
                    logout
                );

                const questionData =
                    await getInterviewQuestions(
                        token,
                        interviewId,
                        logout
                    );

                console.log(
                    "INTERVIEW:",
                    interviewData
                );

                console.log(
                    "QUESTIONS:",
                    questionData
                );

                setInterview(interviewData);

                const loadedQuestions =
                    questionData.questions ||
                    questionData ||
                    [];

                setQuestions(loadedQuestions);
            } catch (err) {
                console.error(
                    "INTERVIEW LOAD ERROR:",
                    err
                );

                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token && interviewId) {
            loadInterview();
        }
    }, [token, interviewId, logout]);

    // =========================================================
    // START INTERVIEW
    // =========================================================

    const handleStart = async () => {
        try {
            setStarting(true);
            setError("");

            const data = await startInterview(
                token,
                interviewId,
                logout
            );

            console.log(
                "INTERVIEW STARTED:",
                data
            );

            setInterview((previous) => ({
                ...previous,
                status: data.status,
            }));
        } catch (err) {
            console.error(
                "START INTERVIEW ERROR:",
                err
            );

            setError(err.message);
        } finally {
            setStarting(false);
        }
    };

    // =========================================================
    // SUBMIT ANSWER + EVALUATE
    // =========================================================

    const handleSubmitAnswer = async () => {
        if (speechRecognizerRef.current) {
            await handleStopListening();
        }

        const finalAnswer = answer.trim();

        if (!finalAnswer) {
            setError(
                "Please enter an answer before submitting."
            );
            return;
        }

        try {
            setAnswer(finalAnswer);
            setInterimTranscript("");

            setSubmitting(true);
            setError("");
            setEvaluationError("");

            // =================================================
            // STEP 1
            // Save answer
            // =================================================

            const answerData = await submitAnswer(
                token,
                interviewId,
                currentQuestion.id,
                finalAnswer,
                logout
            );

            console.log(
                "ANSWER SAVED:",
                answerData
            );

            // =================================================
            // STEP 2
            // Mark answer as submitted immediately
            // =================================================

            setSubmittedAnswers((previous) => ({
                ...previous,
                [currentQuestion.id]: {
                    answer: answerData,
                    evaluation: null,
                },
            }));

            // =================================================
            // STEP 3
            // Evaluate answer
            // =================================================

            try {
                const evaluationData =
                    await evaluateAnswer(
                        token,
                        interviewId,
                        answerData.id,
                        logout
                    );

                console.log(
                    "ANSWER EVALUATED:",
                    evaluationData
                );

                // =================================================
                // STEP 4
                // Save evaluation
                // =================================================

                setSubmittedAnswers((previous) => ({
                    ...previous,
                    [currentQuestion.id]: {
                        answer: answerData,
                        evaluation: evaluationData,
                    },
                }));
            } catch (evaluationErr) {
                console.error(
                    "EVALUATION ERROR:",
                    evaluationErr
                );

                /*
                 * IMPORTANT:
                 *
                 * The answer has already been saved.
                 *
                 * We DO NOT call submitAnswer() again.
                 *
                 * The user can retry only the evaluation
                 * using the existing answer ID.
                 */

                setEvaluationError(
                    evaluationErr.message ||
                    "Unable to evaluate your answer right now."
                );
            }
        } catch (err) {
            console.error(
                "ANSWER SUBMISSION ERROR:",
                err
            );

            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================
    // RETRY EVALUATION
    // =========================================================

    const handleRetryEvaluation = async () => {
        const answerData =
            submittedAnswers[
                currentQuestion.id
            ]?.answer;

        if (!answerData?.id) {
            setEvaluationError(
                "Unable to find the saved answer."
            );
            return;
        }

        try {
            setRetryingEvaluation(true);
            setEvaluationError("");
            setError("");

            console.log(
                "RETRYING EVALUATION FOR ANSWER:",
                answerData.id
            );

            const evaluationData =
                await evaluateAnswer(
                    token,
                    interviewId,
                    answerData.id,
                    logout
                );

            console.log(
                "RETRY EVALUATION SUCCESS:",
                evaluationData
            );

            setSubmittedAnswers((previous) => ({
                ...previous,
                [currentQuestion.id]: {
                    answer: answerData,
                    evaluation: evaluationData,
                },
            }));
        } catch (err) {
            console.error(
                "RETRY EVALUATION ERROR:",
                err
            );

            setEvaluationError(
                err.message ||
                "Evaluation is still unavailable."
            );
        } finally {
            setRetryingEvaluation(false);
        }
    };

    // =========================================================
    // NEXT QUESTION / COMPLETE INTERVIEW
    // =========================================================

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(
                (previous) => previous + 1
            );

            setAnswer("");
            setInterimTranscript("");
            setAnswerWasPasted(false);
            setPasteWarningOpen(false);
            setPendingPastedValue("");
            setError("");
            setEvaluationError("");
            setSpeechError("");

            return;
        }

        // =====================================================
        // LAST QUESTION
        // =====================================================

        try {
            setSubmitting(true);
            setError("");

            const data = await completeInterview(
                token,
                interviewId,
                logout
            );

            console.log(
                "INTERVIEW COMPLETED:",
                data
            );

            navigate(
                `/interview/${interviewId}/result`
            );
        } catch (err) {
            console.error(
                "COMPLETE INTERVIEW ERROR:",
                err
            );

            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };


    // =========================================================
    // CURRENT QUESTION
    // =========================================================

    const currentQuestion =
        questions[currentQuestionIndex];

    // =========================================================
    // WELCOME MESSAGE
    // =========================================================

    useEffect(() => {
        if (interview?.status === "created") {
            speakWelcome();
        }
    }, [interview?.status]);

    // =========================================================
    // READ QUESTION ALOUD
    // =========================================================

    useEffect(() => {
        if (
            interview?.status === "in_progress" &&
            currentQuestion?.question_text
        ) {
            speakQuestion(currentQuestion.question_text);
        }

        return () => {
            setIsSpeaking(false);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }
        };
    }, [
        currentQuestionIndex,
        interview?.status,
        currentQuestion?.question_text,
    ]);

    // =========================================================
    // LOADING STATE
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
                <div className="text-center">

                    <div
                        className="
                            w-10
                            h-10
                            border-4
                            border-[#252F4A]
                            border-t-[#6366F1]
                            rounded-full
                            animate-spin
                            mx-auto
                            mb-5
                        "
                    />

                    <p className="text-sm text-[#9CA3AF]">
                        Preparing your interview...
                    </p>

                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR STATE
    // =========================================================

    if (error && !interview) {
        return (
            <div className="min-h-screen bg-[#0B1020] flex items-center justify-center px-6">

                <div
                    className="
                        w-full
                        max-w-md
                        bg-[#11182B]
                        border
                        border-[#252F4A]
                        rounded-2xl
                        p-8
                        text-center
                    "
                >

                    <div
                        className="
                            w-12
                            h-12
                            rounded-full
                            bg-red-500/10
                            border
                            border-red-500/20
                            flex
                            items-center
                            justify-center
                            mx-auto
                            mb-5
                        "
                    >
                        <span className="text-red-400 text-xl">
                            !
                        </span>
                    </div>

                    <h2 className="text-xl font-semibold text-[#E5E7EB] mb-2">
                        Unable to load interview
                    </h2>

                    <p className="text-sm text-[#9CA3AF] mb-6">
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="
                            w-full
                            py-3
                            rounded-xl
                            bg-gradient-to-r
                            from-[#6366F1]
                            to-[#8B5CF6]
                            text-white
                            font-semibold
                            transition
                        "
                    >
                        Back to Dashboard
                    </button>

                </div>

            </div>
        );
    }


    const totalQuestions =
        questions.length;

    const questionNumber =
        currentQuestionIndex + 1;

    const progress =
        totalQuestions > 0
            ? (questionNumber / totalQuestions) * 100
            : 0;

    const currentSubmission =
        currentQuestion
            ? submittedAnswers[
            currentQuestion.id
            ]
            : null;

    const hasSubmitted =
        !!currentSubmission;

    const hasEvaluation =
        !!currentSubmission?.evaluation;

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB]">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <header className="bg-[#11182B] border-b border-[#252F4A]">

                <div
                    className="
                        max-w-6xl
                        mx-auto
                        px-6
                        h-[76px]
                        flex
                        items-center
                        justify-between
                    "
                >

                    {/* BRAND */}

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                w-10
                                h-10
                                rounded-xl
                                bg-gradient-to-br
                                from-[#6366F1]
                                to-[#8B5CF6]
                                flex
                                items-center
                                justify-center
                                shadow-lg
                                shadow-indigo-950/30
                            "
                        >
                            <span className="text-white font-bold text-sm">
                                AI
                            </span>
                        </div>

                        <div>

                            <h1 className="text-base font-semibold text-[#E5E7EB]">
                                AI Interview
                            </h1>

                            <p className="text-xs text-[#6B7280]">
                                Technical Interview
                            </p>

                        </div>

                    </div>

                    {/* RIGHT SIDE */}

                    <div className="flex items-center gap-5">

                        <div className="hidden sm:block text-right">

                            <p className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                                Difficulty
                            </p>

                            <p className="text-sm font-medium text-[#C4C9D4] mt-1 capitalize">
                                {interview?.difficulty}
                            </p>

                        </div>

                        <div className="w-px h-8 bg-[#252F4A]" />

                        <button
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            className="
                                text-sm
                                text-[#9CA3AF]
                                hover:text-[#E5E7EB]
                                transition
                            "
                        >
                            Exit
                        </button>

                    </div>

                </div>

            </header>


            {/* =====================================================
                MAIN
            ====================================================== */}

            <main className="max-w-4xl mx-auto px-6 py-10">

                {/* TOP INFORMATION */}

                <div className="flex items-end justify-between mb-5">

                    <div>

                        <p className="text-xs uppercase tracking-widest text-[#6B7280] mb-2">
                            {interview?.topic}
                        </p>

                        <h2 className="text-2xl md:text-3xl font-semibold text-[#E5E7EB]">
                            Technical Interview
                        </h2>

                    </div>

                    <div className="text-right">

                        <p className="text-lg font-semibold text-[#C4B5FD]">
                            {questionNumber}
                            <span className="text-[#596276]">
                                {" / "}
                                {totalQuestions}
                            </span>
                        </p>

                        <p className="text-xs text-[#6B7280] mt-1">
                            Question
                        </p>

                    </div>

                </div>


                {/* PROGRESS */}

                <div className="mb-8">

                    <div className="h-1.5 bg-[#1B2438] rounded-full overflow-hidden">

                        <div
                            className="
                                h-full
                                rounded-full
                                bg-gradient-to-r
                                from-[#6366F1]
                                to-[#8B5CF6]
                                transition-all
                                duration-500
                            "
                            style={{
                                width: `${progress}%`,
                            }}
                        />

                    </div>

                </div>


                {/* =====================================================
                    BEFORE INTERVIEW STARTS
                ====================================================== */}

                {interview?.status === "created" && (

                    <div
                        className="
                            bg-[#11182B]
                            border
                            border-[#252F4A]
                            rounded-2xl
                            overflow-hidden
                        "
                    >

                        <div className="p-8 md:p-10">

                            <div className="text-center max-w-xl mx-auto">

                                <div
                                    className="
                                        w-16
                                        h-16
                                        mx-auto
                                        rounded-2xl
                                        bg-gradient-to-br
                                        from-[#252D52]
                                        to-[#30234D]
                                        border
                                        border-[#3A4168]
                                        flex
                                        items-center
                                        justify-center
                                        mb-6
                                    "
                                >
                                    <span className="text-[#A78BFA] font-bold text-lg">
                                        AI
                                    </span>
                                </div>

                                <p className="text-xs uppercase tracking-widest text-[#6B7280] mb-3">
                                    {interview?.topic}
                                </p>

                                <h2 className="text-2xl font-semibold text-[#E5E7EB]">
                                    Your interview is ready
                                </h2>

                                <p className="text-sm text-[#7E8799] mt-3 leading-6">
                                    You'll receive one technical question
                                    at a time. Take your time, explain your
                                    reasoning, and submit your answer when
                                    you're ready.
                                </p>

                                <div className="grid grid-cols-2 gap-3 mt-7">

                                    <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                        <p className="text-[10px] uppercase tracking-widest text-[#606A7D]">
                                            Questions
                                        </p>

                                        <p className="text-lg font-semibold text-[#D1D5DB] mt-2">
                                            {totalQuestions}
                                        </p>

                                    </div>

                                    <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                        <p className="text-[10px] uppercase tracking-widest text-[#606A7D]">
                                            Difficulty
                                        </p>

                                        <p className="text-lg font-semibold text-[#D1D5DB] mt-2 capitalize">
                                            {interview?.difficulty}
                                        </p>

                                    </div>

                                </div>

                                <button
                                    onClick={handleStart}
                                    disabled={starting}
                                    className="
                                        w-full
                                        mt-7
                                        py-3.5
                                        rounded-xl
                                        bg-gradient-to-r
                                        from-[#6366F1]
                                        to-[#8B5CF6]
                                        hover:from-[#7073F5]
                                        hover:to-[#9568F8]
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                        text-white
                                        font-semibold
                                        text-sm
                                        shadow-lg
                                        shadow-indigo-950/20
                                        transition
                                        duration-200
                                    "
                                >
                                    {starting
                                        ? "Starting Interview..."
                                        : "Start Interview →"}
                                </button>

                            </div>

                        </div>

                    </div>

                )}


                {/* =====================================================
                    ACTIVE INTERVIEW
                ====================================================== */}

                {interview?.status === "in_progress" &&
                    currentQuestion && (

                        <div>

                            {/* QUESTION CARD */}

                            <div
                                className="
                                    bg-[#11182B]
                                    border
                                    border-[#252F4A]
                                    rounded-2xl
                                    overflow-hidden
                                    shadow-2xl
                                "
                            >

                                {/* Question Header */}

                                <div
                                    className="
                                        px-7
                                        py-5
                                        border-b
                                        border-[#252F4A]
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <div className="flex items-center gap-4">

                                        <div
                                            className="
                                                w-10
                                                h-10
                                                rounded-xl
                                                bg-[#1E2540]
                                                border
                                                border-[#343D63]
                                                flex
                                                items-center
                                                justify-center
                                            "
                                        >
                                            <span className="text-[#A78BFA] text-sm font-semibold">
                                                {String(
                                                    questionNumber
                                                ).padStart(2, "0")}
                                            </span>
                                        </div>

                                        <div>

                                            <p className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                                                Technical Question
                                            </p>

                                            <p className="text-sm font-medium text-[#C7CBD5] mt-1">
                                                {questionNumber} of{" "}
                                                {totalQuestions}
                                            </p>

                                        </div>

                                    </div>

                                    <span
                                        className="
                                            px-3
                                            py-1.5
                                            rounded-full
                                            text-[11px]
                                            font-medium
                                            bg-[#1E2540]
                                            border
                                            border-[#343D63]
                                            text-[#A5A9E8]
                                            capitalize
                                        "
                                    >
                                        {currentQuestion.difficulty ||
                                            interview?.difficulty}
                                    </span>

                                </div>


                                {/* Question text */}

                                {isSpeaking && (
                                    <div className="px-7 pt-6">
                                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1E2540] border border-[#343D63] text-[#C4B5FD]">
                                            <span className="relative flex w-2.5 h-2.5">
                                                <span className="absolute inline-flex w-full h-full rounded-full bg-[#818CF8] opacity-50 animate-ping" />
                                                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#818CF8]" />
                                            </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                className="w-4 h-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 5.5a9 9 0 010 13" />
                                            </svg>
                                            <span className="text-xs font-medium">AI is reading the question...</span>
                                        </div>
                                    </div>
                                )}

                                <div className="px-7 py-8">

                                    <div className="flex items-start gap-4">

                                        <p className="flex-1 text-lg md:text-xl leading-8 text-[#D1D5DF]">
                                            {currentQuestion.question_text}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                speakQuestion(
                                                    currentQuestion.question_text
                                                )
                                            }
                                            disabled={isListening || submitting || isSpeaking}
                                            aria-label="Listen to question again"
                                            title="Listen to question again"
                                            className="
                                                shrink-0
                                                w-10
                                                h-10
                                                rounded-xl
                                                bg-[#1E2540]
                                                border
                                                border-[#343D63]
                                                text-[#C4B5FD]
                                                hover:bg-[#252D4C]
                                                hover:border-[#46516E]
                                                disabled:opacity-40
                                                disabled:cursor-not-allowed
                                                flex
                                                items-center
                                                justify-center
                                                transition
                                            "
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M11 5L6 9H3v6h3l5 4V5z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.5 8.5a5 5 0 010 7"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M18 6a9 9 0 010 12"
                                                />
                                            </svg>
                                        </button>

                                    </div>

                                    <p className="text-xs text-[#5E687A] mt-3">
                                        Click the speaker icon to hear the question again.
                                    </p>

                                </div>


                                {/* Answer section */}

                                <div className="px-7 pb-7">

                                    <div className="flex items-center justify-between gap-4 mb-3">

                                        <label className="block text-sm font-medium text-[#AEB5C3]">
                                            Your Answer
                                        </label>

                                        {!hasSubmitted && (
                                            <div className="inline-flex items-center p-1 rounded-xl bg-[#0B1020] border border-[#293452]">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAnswerModeChange("type")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                                        answerMode === "type"
                                                            ? "bg-[#1E2540] text-[#C4B5FD]"
                                                            : "text-[#737C8E] hover:text-[#C7CBD5]"
                                                    }`}
                                                >
                                                    ⌨ Type
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAnswerModeChange("speak")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                                        answerMode === "speak"
                                                            ? "bg-[#1E2540] text-[#C4B5FD]"
                                                            : "text-[#737C8E] hover:text-[#C7CBD5]"
                                                    }`}
                                                >
                                                    🎙 Speak
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {answerMode === "speak" && !hasSubmitted && (
                                        <p className="text-xs text-[#687184] mb-3">
                                            Speak your answer naturally. Azure will transcribe your response in real time.
                                        </p>
                                    )}

                                    {answerMode === "type" && answerWasPasted && !hasSubmitted && (
                                        <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                            <p className="text-xs text-amber-300">
                                                This answer contains pasted content. Pasted answers may impact your interview score.
                                            </p>
                                        </div>
                                    )}

                                    <div className="relative">

                                        <textarea
                                            value={answer + (answerMode === "speak" ? interimTranscript : "")}
                                            onChange={handleAnswerChange}
                                            onPaste={handleAnswerPaste}
                                            onDrop={(event) => event.preventDefault()}
                                            disabled={hasSubmitted}
                                            placeholder={
                                                answerMode === "speak"
                                                    ? "Click Start Answer and speak your response..."
                                                    : "Type your answer here..."
                                            }
                                            className="
                                                w-full
                                                min-h-[220px]
                                                resize-y
                                                rounded-xl
                                                bg-[#0B1020]
                                                border
                                                border-[#293452]
                                                px-5
                                                py-4
                                                text-sm
                                                leading-7
                                                text-[#D8DCE5]
                                                placeholder:text-[#50596B]
                                                outline-none
                                                focus:border-[#6366F1]
                                                focus:ring-1
                                                focus:ring-[#6366F1]/20
                                                disabled:opacity-70
                                                disabled:cursor-not-allowed
                                                transition
                                            "
                                        />

                                        {isListening && answerMode === "speak" && (
                                            <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                                                <span className="relative flex w-2 h-2">
                                                    <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
                                                    <span className="relative inline-flex w-2 h-2 rounded-full bg-red-400" />
                                                </span>
                                                <span className="text-[11px] font-medium text-red-400">Listening</span>
                                            </div>
                                        )}

                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">

                                        <p className="text-xs text-[#5E687A]">
                                            {hasSubmitted
                                                ? hasEvaluation
                                                    ? "Answer evaluated"
                                                    : "Answer submitted — evaluation pending"
                                                : answerMode === "speak"
                                                    ? isListening
                                                        ? "Speak naturally. Your response will appear here automatically."
                                                        : "Voice mode: click Start Answer to begin speaking."
                                                    : "Type your answer. Pasting is allowed only after you review the warning."}
                                        </p>

                                        <p className="text-xs text-[#5E687A]">
                                            {(answer + (answerMode === "speak" ? interimTranscript : "")).length}{" "}
                                            characters
                                        </p>

                                    </div>

                                    {answerMode === "speak" && !hasSubmitted && (
                                        <div className="flex flex-wrap items-center gap-3 mt-4">
                                            {isListening ? (
                                                <button type="button" onClick={handleStopListening} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition text-sm font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                                    Finish Answer
                                                </button>
                                            ) : (
                                                <button type="button" onClick={handleStartListening} disabled={!speechSupported || submitting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E2540] border border-[#343D63] text-[#C4B5FD] hover:bg-[#252D4C] hover:border-[#46516E] disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium">
                                                    <span>🎙</span>
                                                    Start Answer
                                                </button>
                                            )}
                                            <button type="button" onClick={handleClearAnswer} disabled={!answer && !interimTranscript} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#293452] text-[#7F899C] hover:text-[#C7CBD5] hover:bg-[#151D33] disabled:opacity-30 disabled:cursor-not-allowed transition text-sm font-medium">
                                                Clear
                                            </button>
                                        </div>
                                    )}

                                    {answerMode === "type" && !hasSubmitted && (
                                        <div className="flex justify-end mt-4">
                                            <button type="button" onClick={handleClearAnswer} disabled={!answer} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#293452] text-[#7F899C] hover:text-[#C7CBD5] hover:bg-[#151D33] disabled:opacity-30 disabled:cursor-not-allowed transition text-sm font-medium">
                                                Clear
                                            </button>
                                        </div>
                                    )}

                                    {speechError && !hasSubmitted && (
                                        <div
                                            className="
                                                mt-3
                                                rounded-xl
                                                border
                                                border-red-500/15
                                                bg-red-500/5
                                                px-4
                                                py-3
                                            "
                                        >
                                            <p className="text-xs text-red-400">
                                                {speechError}
                                            </p>
                                        </div>
                                    )}


                                    {/* =====================================================
                                        AI EVALUATION
                                    ====================================================== */}

                                    {hasEvaluation && (
                                        <div className="mt-7">

                                            <div className="flex items-center justify-between mb-4">

                                                <div>
                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        AI Evaluation
                                                    </p>

                                                    <p className="text-sm text-[#9CA3AF] mt-1">
                                                        Gemini evaluated your answer
                                                    </p>
                                                </div>

                                                <div className="text-right">

                                                    <p className="text-3xl font-bold text-[#A78BFA]">
                                                        {
                                                            currentSubmission?.evaluation?.evaluation?.score ??
                                                            currentSubmission?.evaluation?.score ??
                                                            "—"
                                                        }

                                                        <span className="text-base text-[#6B7280] font-medium">
                                                            /10
                                                        </span>

                                                    </p>

                                                </div>

                                            </div>


                                            <div className="grid md:grid-cols-3 gap-3">

                                                {/* CORRECTNESS */}

                                                <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        Correctness
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-3">
                                                        {
                                                            currentSubmission?.evaluation?.evaluation?.correctness ??
                                                            currentSubmission?.evaluation?.correctness ??
                                                            "No feedback available"
                                                        }
                                                    </p>

                                                </div>


                                                {/* RELEVANCE */}

                                                <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        Relevance
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-3">
                                                        {
                                                            currentSubmission?.evaluation?.evaluation?.relevance ??
                                                            currentSubmission?.evaluation?.relevance ??
                                                            "No feedback available"
                                                        }
                                                    </p>

                                                </div>


                                                {/* CLARITY */}

                                                <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        Clarity
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-3">
                                                        {
                                                            currentSubmission?.evaluation?.evaluation?.clarity ??
                                                            currentSubmission?.evaluation?.clarity ??
                                                            "No feedback available"
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            {/* OVERALL FEEDBACK */}

                                            <div className="mt-3 bg-[#151D33] border border-[#252F4A] rounded-xl p-5">

                                                <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                    Overall Feedback
                                                </p>

                                                <p className="text-sm text-[#C7CBD5] leading-7 mt-3">
                                                    {
                                                        currentSubmission?.evaluation?.evaluation?.feedback ??
                                                        currentSubmission?.evaluation?.feedback ??
                                                        "No feedback available"
                                                    }
                                                </p>

                                            </div>

                                        </div>
                                    )}


                                    {/* =====================================================
                                        EVALUATION FAILED
                                    ====================================================== */}

                                    {hasSubmitted &&
                                        !hasEvaluation &&
                                        evaluationError && (

                                            <div
                                                className="
                                                    mt-7
                                                    rounded-2xl
                                                    border
                                                    border-amber-500/20
                                                    bg-amber-500/5
                                                    p-5
                                                "
                                            >

                                                <div className="flex items-start gap-4">

                                                    <div
                                                        className="
                                                            w-10
                                                            h-10
                                                            rounded-xl
                                                            bg-amber-500/10
                                                            border
                                                            border-amber-500/20
                                                            flex
                                                            items-center
                                                            justify-center
                                                            shrink-0
                                                        "
                                                    >
                                                        <span className="text-amber-400 text-lg">
                                                            !
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">

                                                        <p className="text-sm font-semibold text-[#E5E7EB]">
                                                            Evaluation temporarily unavailable
                                                        </p>

                                                        <p className="text-sm text-[#AEB5C3] mt-2 leading-6">
                                                            Your answer has been saved successfully.
                                                            The AI evaluator could not process it right now.
                                                            You can retry the evaluation without submitting
                                                            your answer again.
                                                        </p>

                                                        <p className="text-xs text-amber-300/80 mt-3">
                                                            {evaluationError}
                                                        </p>

                                                        <button
                                                            onClick={
                                                                handleRetryEvaluation
                                                            }
                                                            disabled={
                                                                retryingEvaluation
                                                            }
                                                            className="
                                                                mt-4
                                                                px-5
                                                                py-2.5
                                                                rounded-xl
                                                                bg-gradient-to-r
                                                                from-[#6366F1]
                                                                to-[#8B5CF6]
                                                                hover:from-[#7073F5]
                                                                hover:to-[#9568F8]
                                                                disabled:opacity-50
                                                                disabled:cursor-not-allowed
                                                                text-white
                                                                font-semibold
                                                                text-sm
                                                                transition
                                                            "
                                                        >
                                                            {retryingEvaluation
                                                                ? "Retrying Evaluation..."
                                                                : "Retry Evaluation →"}
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>
                                        )}

                                </div>


                                {/* =====================================================
                                    SUBMIT / CONTINUE
                                ====================================================== */}

                                <div
                                    className="
                                        px-7
                                        py-5
                                        border-t
                                        border-[#252F4A]
                                        bg-[#0E1424]
                                        flex
                                        items-center
                                        justify-between
                                        gap-4
                                    "
                                >

                                    <div>

                                        <p className="text-xs text-[#626C7E]">
                                            Question{" "}
                                            {questionNumber}
                                        </p>

                                        <p className="text-sm text-[#9CA3AF] mt-1">
                                            {!hasSubmitted
                                                ? "Submit your answer when ready"
                                                : !hasEvaluation
                                                    ? "Evaluation pending"
                                                    : currentQuestionIndex ===
                                                        totalQuestions - 1
                                                        ? "Interview ready to finish"
                                                        : "Ready for the next question"}
                                        </p>

                                    </div>


                                    {!hasSubmitted ? (

                                        <button
                                            onClick={
                                                handleSubmitAnswer
                                            }
                                            disabled={
                                                submitting ||
                                                isListening ||
                                                !answer.trim()
                                            }
                                            className="
                                                px-6
                                                py-3
                                                rounded-xl
                                                bg-gradient-to-r
                                                from-[#6366F1]
                                                to-[#8B5CF6]
                                                hover:from-[#7073F5]
                                                hover:to-[#9568F8]
                                                disabled:opacity-40
                                                disabled:cursor-not-allowed
                                                text-white
                                                font-semibold
                                                text-sm
                                                shadow-lg
                                                shadow-indigo-950/20
                                                transition
                                            "
                                        >
                                            {submitting
                                                ? "Submitting & Evaluating..."
                                                : "Submit Answer →"}
                                        </button>

                                    ) : !hasEvaluation ? (

                                        <button
                                            onClick={
                                                handleRetryEvaluation
                                            }
                                            disabled={
                                                retryingEvaluation
                                            }
                                            className="
                                                px-6
                                                py-3
                                                rounded-xl
                                                bg-gradient-to-r
                                                from-[#6366F1]
                                                to-[#8B5CF6]
                                                hover:from-[#7073F5]
                                                hover:to-[#9568F8]
                                                disabled:opacity-40
                                                disabled:cursor-not-allowed
                                                text-white
                                                font-semibold
                                                text-sm
                                                transition
                                            "
                                        >
                                            {retryingEvaluation
                                                ? "Retrying..."
                                                : "Retry Evaluation →"}
                                        </button>

                                    ) : (

                                        <button
                                            onClick={
                                                handleNextQuestion
                                            }
                                            disabled={
                                                submitting
                                            }
                                            className="
                                                px-6
                                                py-3
                                                rounded-xl
                                                bg-gradient-to-r
                                                from-[#6366F1]
                                                to-[#8B5CF6]
                                                hover:from-[#7073F5]
                                                hover:to-[#9568F8]
                                                disabled:opacity-40
                                                disabled:cursor-not-allowed
                                                text-white
                                                font-semibold
                                                text-sm
                                                transition
                                            "
                                        >
                                            {currentQuestionIndex ===
                                                totalQuestions - 1
                                                ? "Finish Interview →"
                                                : "Next Question →"}
                                        </button>

                                    )}

                                </div>

                            </div>


                            {/* =====================================================
                                GENERAL ERROR
                            ====================================================== */}

                            {error && (

                                <div
                                    className="
                                        mt-4
                                        rounded-xl
                                        border
                                        border-red-500/20
                                        bg-red-500/5
                                        px-4
                                        py-3
                                    "
                                >

                                    <p className="text-sm text-red-400">
                                        {error}
                                    </p>

                                </div>

                            )}

                        </div>

                    )}

            </main>


            {/* =========================================================
                PASTE WARNING POPUP
            ========================================================== */}

            {pasteWarningOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#11182B] border border-[#252F4A] rounded-2xl shadow-2xl p-7">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-400 text-xl">!</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#E5E7EB]">Pasted Answer Detected</h3>
                                <p className="text-sm text-[#9CA3AF] mt-2 leading-6">
                                    We noticed that you pasted content into your answer. Pasted or externally prepared answers may affect your score because this interview is designed to evaluate your own reasoning and understanding.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-[#0B1020] border border-[#252F4A] p-4">
                            <p className="text-xs text-[#70798B] leading-5">
                                Choose Clear Pasted Text to discard it, or Continue Anyway to keep it with your answer.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={handlePasteCancel} className="px-5 py-2.5 rounded-xl border border-[#293452] text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#151D33] text-sm font-medium transition">
                                Clear Pasted Text
                            </button>
                            <button type="button" onClick={handlePasteContinue} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#7073F5] hover:to-[#9568F8] text-white font-semibold text-sm transition">
                                Continue Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* =========================================================
                SILENCE CONFIRMATION POPUP
            ========================================================== */}

            {silencePromptOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        px-6
                        bg-black/60
                        backdrop-blur-sm
                    "
                >
                    <div
                        className="
                            w-full
                            max-w-md
                            bg-[#11182B]
                            border
                            border-[#252F4A]
                            rounded-2xl
                            shadow-2xl
                            p-7
                        "
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className="
                                    w-12
                                    h-12
                                    rounded-xl
                                    bg-indigo-500/10
                                    border
                                    border-indigo-500/20
                                    flex
                                    items-center
                                    justify-center
                                    shrink-0
                                "
                            >
                                <span className="text-[#A78BFA] text-xl">
                                    ◌
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-[#E5E7EB]">
                                    Are you done with your answer?
                                </h3>

                                <p className="text-sm text-[#9CA3AF] mt-2 leading-6">
                                    We haven't detected speech for 3 seconds.
                                </p>
                            </div>
                        </div>

                        <div
                            className="
                                mt-5
                                rounded-xl
                                bg-[#0B1020]
                                border
                                border-[#252F4A]
                                p-4
                            "
                        >
                            <p className="text-xs text-[#6B7280] leading-5">
                                Your transcript is safe in the answer box. You can continue speaking or finish your answer.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleContinueListening}
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-[#293452]
                                    text-[#C4B5FD]
                                    hover:bg-[#151D33]
                                    text-sm
                                    font-medium
                                    transition
                                "
                            >
                                Continue Speaking
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    setSilencePromptOpen(false);
                                    await cleanupSpeechRecognizer();
                                }}
                                className="
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    bg-gradient-to-r
                                    from-[#6366F1]
                                    to-[#8B5CF6]
                                    hover:from-[#7073F5]
                                    hover:to-[#9568F8]
                                    text-white
                                    font-semibold
                                    text-sm
                                    transition
                                "
                            >
                                Finish Answer
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* =========================================================
                QUOTA / EVALUATION POPUP
            ========================================================== */}

            {hasSubmitted &&
                !hasEvaluation &&
                evaluationError && (

                    <div
                        className="
                            fixed
                            inset-0
                            z-50
                            flex
                            items-center
                            justify-center
                            px-6
                            bg-black/60
                            backdrop-blur-sm
                        "
                    >

                        <div
                            className="
                                w-full
                                max-w-md
                                bg-[#11182B]
                                border
                                border-[#252F4A]
                                rounded-2xl
                                shadow-2xl
                                p-7
                            "
                        >

                            <div className="flex items-start gap-4">

                                <div
                                    className="
                                        w-12
                                        h-12
                                        rounded-xl
                                        bg-amber-500/10
                                        border
                                        border-amber-500/20
                                        flex
                                        items-center
                                        justify-center
                                        shrink-0
                                    "
                                >
                                    <span className="text-amber-400 text-xl">
                                        !
                                    </span>
                                </div>

                                <div>

                                    <h3 className="text-lg font-semibold text-[#E5E7EB]">
                                        AI Evaluation Unavailable
                                    </h3>

                                    <p className="text-sm text-[#9CA3AF] mt-2 leading-6">
                                        Your answer has already been saved.
                                        The AI evaluator is temporarily
                                        unavailable, possibly because of
                                        a model quota or rate limit.
                                    </p>

                                </div>

                            </div>


                            <div
                                className="
                                    mt-5
                                    rounded-xl
                                    bg-[#0B1020]
                                    border
                                    border-[#252F4A]
                                    p-4
                                "
                            >

                                <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                    What you can do
                                </p>

                                <p className="text-sm text-[#C7CBD5] mt-2 leading-6">
                                    Retry the AI evaluation. Your answer
                                    will not be submitted again.
                                </p>

                            </div>


                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    onClick={() =>
                                        setEvaluationError("")
                                    }
                                    className="
                                        px-5
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-[#293452]
                                        text-[#9CA3AF]
                                        hover:text-[#E5E7EB]
                                        hover:bg-[#151D33]
                                        text-sm
                                        font-medium
                                        transition
                                    "
                                >
                                    Close
                                </button>

                                <button
                                    onClick={
                                        handleRetryEvaluation
                                    }
                                    disabled={
                                        retryingEvaluation
                                    }
                                    className="
                                        px-5
                                        py-2.5
                                        rounded-xl
                                        bg-gradient-to-r
                                        from-[#6366F1]
                                        to-[#8B5CF6]
                                        hover:from-[#7073F5]
                                        hover:to-[#9568F8]
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                        text-white
                                        font-semibold
                                        text-sm
                                        transition
                                    "
                                >
                                    {retryingEvaluation
                                        ? "Retrying..."
                                        : "Retry Evaluation"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}

export default Interview;