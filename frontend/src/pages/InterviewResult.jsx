import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const API_URL = "http://127.0.0.1:8000";

function InterviewResult() {
    const { interviewId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadResult = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/interviews/${interviewId}/result`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                        data.message ||
                        "Failed to fetch interview result"
                    );
                }

                console.log("INTERVIEW RESULT:", data);

                setResult(data);
            } catch (err) {
                console.error(
                    "RESULT LOAD ERROR:",
                    err
                );

                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token && interviewId) {
            loadResult();
        }
    }, [token, interviewId]);

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
                        Preparing your results...
                    </p>

                </div>
            </div>
        );
    }

    if (error) {
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

                    <h2 className="text-xl font-semibold text-[#E5E7EB] mb-3">
                        Unable to load results
                    </h2>

                    <p className="text-sm text-[#9CA3AF] mb-6">
                        {error}
                    </p>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="
                            w-full
                            py-3
                            rounded-xl
                            bg-gradient-to-r
                            from-[#6366F1]
                            to-[#8B5CF6]
                            text-white
                            font-semibold
                        "
                    >
                        Back to Dashboard
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB]">

            <header className="bg-[#11182B] border-b border-[#252F4A]">
                <div className="max-w-6xl mx-auto px-6 h-[76px] flex items-center justify-between">

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
                            "
                        >
                            <span className="text-white font-bold text-sm">
                                AI
                            </span>
                        </div>

                        <div>
                            <h1 className="text-base font-semibold">
                                Interview Results
                            </h1>

                            <p className="text-xs text-[#6B7280]">
                                Performance Summary
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-sm text-[#9CA3AF] hover:text-[#E5E7EB]"
                    >
                        Dashboard
                    </button>

                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">

                {/* HEADER */}

                <div className="mb-8">

                    <p className="text-xs uppercase tracking-widest text-[#6B7280] mb-2">
                        {result?.topic}
                    </p>

                    <h2 className="text-3xl font-semibold">
                        Interview Completed
                    </h2>

                    <p className="text-sm text-[#7E8799] mt-2">
                        Here's how you performed in your interview.
                    </p>

                </div>


                {/* SCORE CARD */}

                <div
                    className="
                        bg-[#11182B]
                        border
                        border-[#252F4A]
                        rounded-2xl
                        p-8
                        mb-8
                    "
                >

                    <div className="grid md:grid-cols-3 gap-6">

                        <div>
                            <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                Overall Score
                            </p>

                            <p className="text-5xl font-bold text-[#A78BFA] mt-3">
                                {result?.average_score ?? 0}
                                <span className="text-xl text-[#6B7280]">
                                    /10
                                </span>
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                Difficulty
                            </p>

                            <p className="text-xl font-semibold capitalize mt-3">
                                {result?.difficulty}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                                Status
                            </p>

                            <p className="text-xl font-semibold text-emerald-400 mt-3 capitalize">
                                {result?.status}
                            </p>
                        </div>

                    </div>

                </div>


                {/* QUESTION RESULTS */}

                <div>

                    <div className="mb-5">

                        <h3 className="text-xl font-semibold">
                            Question-by-Question Review
                        </h3>

                        <p className="text-sm text-[#7E8799] mt-1">
                            Review your answers and AI feedback.
                        </p>

                    </div>

                    <div className="space-y-5">

                        {result?.questions?.map(
                            (item, index) => (
                                <div
                                    key={item.question_id}
                                    className="
                                        bg-[#11182B]
                                        border
                                        border-[#252F4A]
                                        rounded-2xl
                                        overflow-hidden
                                    "
                                >

                                    {/* QUESTION HEADER */}

                                    <div
                                        className="
                                            px-6
                                            py-5
                                            border-b
                                            border-[#252F4A]
                                            flex
                                            items-center
                                            justify-between
                                            gap-4
                                        "
                                    >

                                        <div className="flex items-start gap-4">

                                            <div
                                                className="
                                                    w-9
                                                    h-9
                                                    rounded-lg
                                                    bg-[#1E2540]
                                                    border
                                                    border-[#343D63]
                                                    flex
                                                    items-center
                                                    justify-center
                                                    shrink-0
                                                "
                                            >
                                                <span className="text-xs font-semibold text-[#A78BFA]">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                            </div>

                                            <p className="text-sm md:text-base leading-6 text-[#D1D5DF]">
                                                {item.question_text}
                                            </p>

                                        </div>

                                        <div className="shrink-0 text-right">

                                            <p className="text-2xl font-bold text-[#A78BFA]">
                                                {item.evaluation?.score ?? 0}
                                                <span className="text-sm text-[#6B7280]">
                                                    /10
                                                </span>
                                            </p>

                                        </div>

                                    </div>


                                    {/* ANSWER */}

                                    <div className="px-6 py-5">

                                        <p className="text-xs uppercase tracking-widest text-[#6B7280] mb-2">
                                            Your Answer
                                        </p>

                                        <p className="text-sm leading-7 text-[#B8BFCD] whitespace-pre-wrap">
                                            {item.answer_text || "No answer submitted."}
                                        </p>

                                    </div>


                                    {/* AI FEEDBACK */}

                                    {item.evaluation && (
                                        <div
                                            className="
                                                px-6
                                                py-5
                                                border-t
                                                border-[#252F4A]
                                                bg-[#0E1424]
                                            "
                                        >

                                            <p className="text-xs uppercase tracking-widest text-[#6B7280] mb-4">
                                                AI Feedback
                                            </p>

                                            <div className="grid md:grid-cols-3 gap-4">

                                                <div>
                                                    <p className="text-xs text-[#6B7280]">
                                                        Correctness
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-2">
                                                        {item.evaluation.correctness}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#6B7280]">
                                                        Relevance
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-2">
                                                        {item.evaluation.relevance}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#6B7280]">
                                                        Clarity
                                                    </p>

                                                    <p className="text-sm text-[#C7CBD5] leading-6 mt-2">
                                                        {item.evaluation.clarity}
                                                    </p>
                                                </div>

                                            </div>

                                            <div className="mt-5">

                                                <p className="text-xs text-[#6B7280]">
                                                    Overall Feedback
                                                </p>

                                                <p className="text-sm text-[#C7CBD5] leading-7 mt-2">
                                                    {item.evaluation.feedback}
                                                </p>

                                            </div>

                                        </div>
                                    )}

                                </div>
                            )
                        )}

                    </div>

                </div>


                {/* BOTTOM BUTTON */}

                <div className="mt-8 flex justify-center">

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="
                            px-7
                            py-3
                            rounded-xl
                            bg-gradient-to-r
                            from-[#6366F1]
                            to-[#8B5CF6]
                            text-white
                            font-semibold
                            text-sm
                            shadow-lg
                            shadow-indigo-950/20
                        "
                    >
                        Back to Dashboard
                    </button>

                </div>

            </main>

        </div>
    );
}

export default InterviewResult;