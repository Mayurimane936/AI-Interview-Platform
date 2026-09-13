import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { synthesizeSpeech } from "../api/speech";
import { transcribeAudio } from "../api/stt";

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
            // Stop previous audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            // Release previous object URL
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }

            const audioUrl = await synthesizeSpeech(text);

            audioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            await audio.play();
        } catch (error) {
            console.error("AZURE TTS ERROR:", error);
        }
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

    // =========================================================
    // VOICE ANSWER STATE
    // =========================================================

    const [isListening, setIsListening] =
        useState(false);

    const [speechSupported, setSpeechSupported] =
        useState(true);

    const [speechError, setSpeechError] =
        useState("");

    const [interimTranscript, setInterimTranscript] =
        useState("");

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const mediaStreamRef = useRef(null);

    const [submittedAnswers, setSubmittedAnswers] =
        useState({});

    // =========================================================
    // SPEECH RECOGNITION SETUP
    // =========================================================


    // Stop speech recognition whenever
    // the user moves to another question.
    useEffect(() => {
        if (mediaRecorderRef.current) {
            try {
                if (
                    mediaRecorderRef.current.state !==
                    "inactive"
                ) {
                    mediaRecorderRef.current.stop();
                }
            } catch (error) {
                console.error(
                    "RECORDER STOP ERROR:",
                    error
                );
            }

            mediaRecorderRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            mediaStreamRef.current = null;
        }

        audioChunksRef.current = [];

        setIsListening(false);
        setInterimTranscript("");
        setSpeechError("");
    }, [currentQuestionIndex]);
    // =========================================================
    // START / STOP VOICE INPUT
    // =========================================================
    const handleStartListening = async () => {
        if (hasSubmitted || submitting) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setSpeechSupported(false);
            setSpeechError(
                "Microphone recording is not supported in this browser."
            );
            return;
        }

        try {
            setSpeechError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            mediaStreamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder =
                new MediaRecorder(stream);

            mediaRecorderRef.current =
                mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(
                        event.data
                    );
                }
            };

            mediaRecorder.onstart = () => {
                setIsListening(true);
            };

            mediaRecorder.start();

        } catch (error) {
            console.error(
                "MICROPHONE START ERROR:",
                error
            );

            setIsListening(false);

            if (error.name === "NotAllowedError") {
                setSpeechError(
                    "Microphone permission was denied. Please allow microphone access in your browser."
                );
            } else {
                setSpeechError(
                    "Unable to access your microphone. Please try again."
                );
            }
        }
    };

    const handleStopListening = () => {
        const mediaRecorder = mediaRecorderRef.current;

        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.onstop = async () => {
            setIsListening(false);

            if (mediaStreamRef.current) {
                mediaStreamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());

                mediaStreamRef.current = null;
            }

            const audioBlob = new Blob(
                audioChunksRef.current,
                {
                    type: "audio/webm",
                }
            );

            audioChunksRef.current = [];

            if (!audioBlob.size) {
                setSpeechError(
                    "No audio was recorded. Please try again."
                );
                return;
            }

            try {
                setSpeechError("");

                const data =
                    await transcribeAudio(audioBlob);

                const transcript =
                    data?.transcript?.trim();

                if (!transcript) {
                    setSpeechError(
                        "No speech was recognized. Please try again."
                    );
                    return;
                }

                setAnswer((previous) => {
                    const separator =
                        previous &&
                            !previous.endsWith(" ")
                            ? " "
                            : "";

                    return (
                        previous +
                        separator +
                        transcript
                    );
                });

            } catch (error) {
                console.error(
                    "AZURE STT ERROR:",
                    error
                );

                setSpeechError(
                    error.message ||
                    "Unable to transcribe your answer. Please try again."
                );
            }
        };

        mediaRecorder.stop();
        mediaRecorderRef.current = null;
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
    // ANSWER TEXTAREA - DELETE ONLY
    // =========================================================

    const handleAnswerChange = (event) => {
        if (hasSubmitted) {
            return;
        }

        const newValue =
            event.target.value;

        const displayedValue =
            answer + interimTranscript;

        // Only allow the value to become
        // shorter. This prevents normal typing.
        if (
            newValue.length <
            displayedValue.length
        ) {
            setAnswer(newValue);
            setInterimTranscript("");
            return;
        }

        // Allow React to keep the exact same
        // value, but reject typed/pasted
        // insertions.
        if (
            newValue === displayedValue
        ) {
            return;
        }
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
        const finalAnswer = (
            answer + interimTranscript
        ).trim();

        if (!finalAnswer) {
            setError(
                "Please enter an answer before submitting."
            );
            return;
        }

        try {
            handleStopListening();

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

                                <div className="px-7 py-8">

                                    <p className="text-lg md:text-xl leading-8 text-[#D1D5DF]">
                                        {currentQuestion.question_text}
                                    </p>

                                </div>


                                {/* Answer section */}

                                <div className="px-7 pb-7">

                                    <label className="block text-sm font-medium text-[#AEB5C3] mb-3">
                                        Your Answer
                                    </label>

                                    <div className="relative">

                                        <textarea
                                            value={
                                                answer +
                                                interimTranscript
                                            }
                                            onChange={
                                                handleAnswerChange
                                            }
                                            onPaste={(event) =>
                                                event.preventDefault()
                                            }
                                            onDrop={(event) =>
                                                event.preventDefault()
                                            }
                                            disabled={hasSubmitted}
                                            placeholder={
                                                speechSupported
                                                    ? "Click Start Answer and speak your response..."
                                                    : "Speech recognition is not supported in this browser."
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
                                                pr-5
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

                                        {isListening && (
                                            <div
                                                className="
                                                    absolute
                                                    top-4
                                                    right-4
                                                    inline-flex
                                                    items-center
                                                    gap-2
                                                    px-3
                                                    py-1.5
                                                    rounded-full
                                                    bg-red-500/10
                                                    border
                                                    border-red-500/20
                                                "
                                            >
                                                <span className="relative flex w-2 h-2">
                                                    <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
                                                    <span className="relative inline-flex w-2 h-2 rounded-full bg-red-400" />
                                                </span>

                                                <span className="text-[11px] font-medium text-red-400">
                                                    Listening
                                                </span>
                                            </div>
                                        )}

                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">

                                        <p className="text-xs text-[#5E687A]">
                                            {hasSubmitted
                                                ? hasEvaluation
                                                    ? "Answer evaluated"
                                                    : "Answer submitted — evaluation pending"
                                                : isListening
                                                    ? "Speak naturally. Your response will appear here automatically."
                                                    : "Voice input only. You can delete or clear the transcript before submitting."}
                                        </p>

                                        <p className="text-xs text-[#5E687A]">
                                            {
                                                (
                                                    answer +
                                                    interimTranscript
                                                ).length
                                            }{" "}
                                            characters
                                        </p>

                                    </div>

                                    {!hasSubmitted && (
                                        <div className="flex flex-wrap items-center gap-3 mt-4">

                                            {isListening ? (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleStopListening
                                                    }
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-2
                                                        px-4
                                                        py-2.5
                                                        rounded-xl
                                                        bg-red-500/10
                                                        border
                                                        border-red-500/20
                                                        text-red-400
                                                        hover:bg-red-500/15
                                                        transition
                                                        text-sm
                                                        font-medium
                                                    "
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                                    Stop Answer
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleStartListening
                                                    }
                                                    disabled={
                                                        !speechSupported ||
                                                        submitting
                                                    }
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-2
                                                        px-4
                                                        py-2.5
                                                        rounded-xl
                                                        bg-[#1E2540]
                                                        border
                                                        border-[#343D63]
                                                        text-[#C4B5FD]
                                                        hover:bg-[#252D4C]
                                                        hover:border-[#46516E]
                                                        disabled:opacity-40
                                                        disabled:cursor-not-allowed
                                                        transition
                                                        text-sm
                                                        font-medium
                                                    "
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        className="w-4 h-4"
                                                    >
                                                        <rect
                                                            x="7"
                                                            y="3"
                                                            width="10"
                                                            height="14"
                                                            rx="5"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            d="M5 11a7 7 0 0 0 14 0"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            d="M12 18v3"
                                                        />
                                                    </svg>

                                                    Start Answer
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={
                                                    handleClearAnswer
                                                }
                                                disabled={
                                                    !answer &&
                                                    !interimTranscript
                                                }
                                                className="
                                                    inline-flex
                                                    items-center
                                                    gap-2
                                                    px-4
                                                    py-2.5
                                                    rounded-xl
                                                    border
                                                    border-[#293452]
                                                    text-[#7F899C]
                                                    hover:text-[#C7CBD5]
                                                    hover:bg-[#151D33]
                                                    disabled:opacity-30
                                                    disabled:cursor-not-allowed
                                                    transition
                                                    text-sm
                                                    font-medium
                                                "
                                            >
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