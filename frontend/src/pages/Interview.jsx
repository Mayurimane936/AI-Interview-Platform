import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
    getInterview,
    getInterviewQuestions,
    startInterview,
    submitAnswer,
    evaluateAnswer,
    completeInterview
} from "../api/interview";

function Interview() {
    const { interviewId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [interview, setInterview] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [currentQuestionIndex, setCurrentQuestionIndex] =
        useState(0);

    const [answer, setAnswer] = useState("");

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    const [submittedAnswers, setSubmittedAnswers] = useState({});

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
                    interviewId
                );

                const questionData =
                    await getInterviewQuestions(
                        token,
                        interviewId
                    );

                console.log("INTERVIEW:", interviewData);
                console.log("QUESTIONS:", questionData);

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
    }, [token, interviewId]);

    // =========================================================
    // START INTERVIEW
    // =========================================================

    const handleStart = async () => {
        try {
            setStarting(true);
            setError("");

            const data = await startInterview(
                token,
                interviewId
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
    // SUBMIT ANSWER
    // =========================================================

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) {
            setError("Please enter an answer before submitting.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            // 1. Save the answer
            const answerData = await submitAnswer(
                token,
                interviewId,
                currentQuestion.id,
                answer.trim()
            );

            // 2. Ask Gemini to evaluate the answer
            const evaluationData = await evaluateAnswer(
                token,
                interviewId,
                answerData.id
            );

            // 3. Store both answer + evaluation
            setSubmittedAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: {
                    answer: answerData,
                    evaluation: evaluationData,
                },
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================
    // NEXT QUESTION
    // =========================================================

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(
                (previous) => previous + 1
            );

            setAnswer("");
            setError("");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const data = await completeInterview(
                token,
                interviewId
            );

            console.log("INTERVIEW COMPLETED:", data);

            navigate(`/interview/${interviewId}/result`);
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

    const currentQuestion =
        questions[currentQuestionIndex];

    const totalQuestions =
        questions.length;

    const questionNumber =
        currentQuestionIndex + 1;

    const progress =
        totalQuestions > 0
            ? (questionNumber / totalQuestions) * 100
            : 0;

    const hasSubmitted =
        currentQuestion &&
        !!submittedAnswers[currentQuestion.id];

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

                            {/* START STATE */}

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


                                {/* Interview details */}

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


                                {/* Start Button */}

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

                                {/* Answer section */}

                                <div className="px-7 pb-7">

                                    <label className="block text-sm font-medium text-[#AEB5C3] mb-3">
                                        Your Answer
                                    </label>

                                    <textarea
                                        value={answer}
                                        onChange={(e) =>
                                            setAnswer(e.target.value)
                                        }
                                        disabled={hasSubmitted}
                                        placeholder="Explain your approach, reasoning, and answer..."
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

                                    <div className="flex items-center justify-between mt-3">

                                        <p className="text-xs text-[#5E687A]">
                                            {hasSubmitted
                                                ? "Answer submitted"
                                                : "Be clear and explain your reasoning."}
                                        </p>

                                        <p className="text-xs text-[#5E687A]">
                                            {answer.length} characters
                                        </p>

                                    </div>


                                    {/* =====================================================
        AI EVALUATION
    ====================================================== */}

                                    {hasSubmitted && (
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
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.evaluation?.score ??
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.score ??
                                                            "—"
                                                        }
                                                        <span className="text-base text-[#6B7280] font-medium">
                                                            /10
                                                        </span>
                                                    </p>

                                                </div>

                                            </div>


                                            <div className="grid md:grid-cols-3 gap-3">

                                                {/* Correctness */}

                                                <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        Correctness
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-3">
                                                        {
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.evaluation?.correctness ??
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.correctness ??
                                                            "No feedback available"
                                                        }
                                                    </p>

                                                </div>


                                                {/* Relevance */}

                                                <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        Relevance
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-3">
                                                        {
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.evaluation?.relevance ??
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.relevance ??
                                                            "No feedback available"
                                                        }
                                                    </p>

                                                </div>


                                                {/* Clarity */}

                                                <div className="bg-[#0B1020] border border-[#252F4A] rounded-xl p-4">

                                                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                        Clarity
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-3">
                                                        {
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.evaluation?.clarity ??
                                                            submittedAnswers[
                                                                currentQuestion.id
                                                            ]?.evaluation?.clarity ??
                                                            "No feedback available"
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            {/* Overall Feedback */}

                                            <div className="mt-3 bg-[#151D33] border border-[#252F4A] rounded-xl p-5">

                                                <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                                    Overall Feedback
                                                </p>

                                                <p className="text-sm text-[#C7CBD5] leading-7 mt-3">
                                                    {
                                                        submittedAnswers[
                                                            currentQuestion.id
                                                        ]?.evaluation?.evaluation?.feedback ??
                                                        submittedAnswers[
                                                            currentQuestion.id
                                                        ]?.evaluation?.feedback ??
                                                        "No feedback available"
                                                    }
                                                </p>

                                            </div>

                                        </div>
                                    )}

                                </div>


                                {/* Submit / Continue */}

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
                                            {hasSubmitted
                                                ? "Ready for the next question"
                                                : "Submit your answer when ready"}
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
                                                ? "Submitting..."
                                                : "Submit Answer →"}
                                        </button>

                                    ) : (

                                        <button
                                            onClick={
                                                handleNextQuestion
                                            }
                                            disabled={submitting}
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
                                                ? "All Questions Completed"
                                                : "Next Question →"}
                                        </button>

                                    )}

                                </div>

                            </div>


                            {/* Error below active interview */}

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

        </div>
    );
}

export default Interview;