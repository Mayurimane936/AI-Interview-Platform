import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_URL } from "../api/config";
import { useAuth } from "../context/AuthContext";

function InterviewResult() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD RESULT
  // =========================================================

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
          if (response.status === 401) {
            logout();
            navigate("/login");
            return;
          }

          throw new Error(
            data.detail ||
              data.message ||
              "Failed to load interview result"
          );
        }

        // console.log(
        //   "INTERVIEW RESULT:",
        //   data
        // );

        setResult(data);
      } catch (err) {
        console.error(
          "INTERVIEW RESULT ERROR:",
          err
        );

        setError(
          err.message ||
            "Failed to load interview result"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token && interviewId) {
      loadResult();
    }
  }, [
    token,
    interviewId,
    logout,
    navigate,
  ]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "—";
    }

    return new Date(
      dateString
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getScoreColor = (score) => {
    if (score >= 8) {
      return "text-emerald-400";
    }

    if (score >= 5) {
      return "text-amber-400";
    }

    return "text-red-400";
  };

  const getScoreBg = (score) => {
    if (score >= 8) {
      return "bg-emerald-500/10 border-emerald-500/20";
    }

    if (score >= 5) {
      return "bg-amber-500/10 border-amber-500/20";
    }

    return "bg-red-500/10 border-red-500/20";
  };

  const getPerformanceLabel = (score) => {
    if (score >= 9) {
      return "Excellent";
    }

    if (score >= 8) {
      return "Strong Performance";
    }

    if (score >= 6) {
      return "Good Attempt";
    }

    if (score >= 4) {
      return "Needs Improvement";
    }

    return "Keep Practicing";
  };

  const getStatusLabel = (status) => {
    if (status === "completed") {
      return "Completed";
    }

    if (status === "in_progress") {
      return "In Progress";
    }

    return "Not Started";
  };

  const normalizeAnswer = (answer) => {
    if (
      answer === null ||
      answer === undefined ||
      answer.trim() === "" ||
      answer.trim().toLowerCase() === "na"
    ) {
      return "No answer provided";
    }

    return answer;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB] flex items-center justify-center px-6">

        <div className="text-center">

          <div
            className="
              w-12
              h-12
              rounded-full
              border-4
              border-[#252F4A]
              border-t-[#6366F1]
              animate-spin
              mx-auto
            "
          />

          <p className="text-sm text-[#7D8799] mt-5">
            Loading interview results...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB] flex items-center justify-center px-6">

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
              w-14
              h-14
              mx-auto
              rounded-xl
              bg-red-500/10
              border
              border-red-500/20
              flex
              items-center
              justify-center
            "
          >
            <span className="text-red-400 text-xl">
              !
            </span>
          </div>

          <h2 className="text-lg font-semibold text-[#E5E7EB] mt-5">
            Unable to load results
          </h2>

          <p className="text-sm text-[#8B93A3] mt-2 leading-6">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="
              mt-6
              px-5
              py-2.5
              rounded-xl
              bg-gradient-to-r
              from-[#6366F1]
              to-[#8B5CF6]
              text-white
              text-sm
              font-semibold
              hover:opacity-90
              transition
            "
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  if (!result) {
    return null;
  }

  const averageScore =
    result.average_score ?? 0;

  const questions =
    result.questions || [];

  const answeredQuestions =
    questions.filter(
      (question) =>
        question.answer_text &&
        question.answer_text.trim() !== "" &&
        question.answer_text
          .trim()
          .toLowerCase() !== "na"
    ).length;

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB]">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="border-b border-[#252F4A] bg-[#11182B]">

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
                AI Interview Platform
              </h1>

              <p className="text-xs text-[#6B7280]">
                Interview Results
              </p>

            </div>

          </div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="
              px-4
              py-2
              rounded-lg
              border
              border-[#303A56]
              text-sm
              text-[#9CA3AF]
              hover:text-[#E5E7EB]
              hover:border-[#46516E]
              transition
            "
          >
            Dashboard
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <section className="mb-8">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="
              text-sm
              text-[#7D8799]
              hover:text-[#C4B5FD]
              transition
              mb-5
            "
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>

              <p className="text-sm text-[#6B7280] mb-2">
                Interview Completed
              </p>

              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#E5E7EB] capitalize">
                {result.topic}
              </h2>

              <p className="text-[#7D8799] mt-3">
                Here's how you performed in your interview.
              </p>

            </div>

            <div className="text-sm text-[#687184]">
              Completed{" "}
              {formatDate(
                result.completed_at
              )}
            </div>

          </div>

        </section>

        {/* ===================================================
            SUMMARY
        ==================================================== */}

        <section
          className="
            grid
            grid-cols-1
            lg:grid-cols-[1.3fr_1fr_1fr]
            gap-4
            mb-10
          "
        >

          {/* SCORE CARD */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-[#2A3454]
              bg-gradient-to-br
              from-[#11182B]
              via-[#141A2D]
              to-[#17152D]
              p-7
            "
          >

            <div
              className="
                absolute
                -top-20
                -right-20
                w-48
                h-48
                rounded-full
                bg-[#6366F1]/10
                blur-3xl
              "
            />

            <div className="relative">

              <p className="text-xs uppercase tracking-widest text-[#687184]">
                Overall Score
              </p>

              <div className="flex items-end gap-3 mt-5">

                <span
                  className={`
                    text-6xl
                    font-semibold
                    tracking-tight
                    ${getScoreColor(
                      averageScore
                    )}
                  `}
                >
                  {averageScore}
                </span>

                <span className="text-xl text-[#596276] pb-2">
                  /10
                </span>

              </div>

              <p className="text-sm text-[#9CA3AF] mt-3">
                {getPerformanceLabel(
                  averageScore
                )}
              </p>

            </div>

          </div>

          {/* DIFFICULTY */}

          <div
            className="
              rounded-2xl
              border
              border-[#252F4A]
              bg-[#11182B]
              p-7
            "
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              Difficulty
            </p>

            <div className="flex items-center gap-3 mt-5">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-[#1E2540]
                  border
                  border-[#343D63]
                  flex
                  items-center
                  justify-center
                "
              >
                <span className="text-[#A78BFA] text-lg">
                  ◆
                </span>
              </div>

              <p className="text-xl font-semibold text-[#D8DCE5] capitalize">
                {result.difficulty}
              </p>

            </div>

            <p className="text-sm text-[#6F7889] mt-4">
              Selected interview level
            </p>

          </div>

          {/* STATUS */}

          <div
            className="
              rounded-2xl
              border
              border-[#252F4A]
              bg-[#11182B]
              p-7
            "
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              Status
            </p>

            <div className="flex items-center gap-3 mt-5">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-emerald-500/10
                  border
                  border-emerald-500/20
                  flex
                  items-center
                  justify-center
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5 text-emerald-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12.5l4 4L19 7"
                  />
                </svg>
              </div>

              <p className="text-xl font-semibold text-[#D8DCE5]">
                {getStatusLabel(
                  result.status
                )}
              </p>

            </div>

            <p className="text-sm text-[#6F7889] mt-4">
              {answeredQuestions} of{" "}
              {questions.length} questions answered
            </p>

          </div>

        </section>

        {/* ===================================================
            QUESTION REVIEW
        ==================================================== */}

        <section>

          <div className="mb-6">

            <h3 className="text-xl font-semibold text-[#DDE1E9]">
              Question-by-Question Review
            </h3>

            <p className="text-sm text-[#70798B] mt-2">
              Review your answers and AI feedback.
            </p>

          </div>

          <div className="space-y-5">

            {questions.map(
              (question, index) => {

                const evaluation =
                  question.evaluation;

                const questionScore =
                  evaluation?.score ?? 0;

                const answer =
                  normalizeAnswer(
                    question.answer_text
                  );

                const noAnswer =
                  answer ===
                  "No answer provided";

                return (
                  <article
                    key={
                      question.id ||
                      index
                    }
                    className="
                      rounded-2xl
                      border
                      border-[#252F4A]
                      bg-[#11182B]
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
                      "
                    >

                      <div className="flex items-start gap-4">

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
                            shrink-0
                          "
                        >
                          <span className="text-xs font-semibold text-[#A78BFA]">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">

                          <p className="text-xs uppercase tracking-widest text-[#667083] mb-2">
                            Question {index + 1}
                          </p>

                          <h4 className="text-base md:text-lg font-medium leading-7 text-[#E1E5EC]">
                            {
                              question.question_text
                            }
                          </h4>

                        </div>

                        <div
                          className={`
                            shrink-0
                            px-3
                            py-2
                            rounded-lg
                            border
                            ${getScoreBg(
                              questionScore
                            )}
                          `}
                        >
                          <span
                            className={`
                              text-sm
                              font-semibold
                              ${getScoreColor(
                                questionScore
                              )}
                            `}
                          >
                            {questionScore}/10
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* ANSWER */}

                    <div className="px-6 py-6">

                      <p className="text-xs uppercase tracking-widest text-[#687184] mb-3">
                        Your Answer
                      </p>

                      <div
                        className={`
                          rounded-xl
                          border
                          px-5
                          py-4
                          ${
                            noAnswer
                              ? "bg-red-500/5 border-red-500/10"
                              : "bg-[#0B1020] border-[#252F4A]"
                          }
                        `}
                      >

                        <p
                          className={`
                            text-sm
                            leading-7
                            ${
                              noAnswer
                                ? "text-[#9A6A6A]"
                                : "text-[#B8BFCD]"
                            }
                          `}
                        >
                          {answer}
                        </p>

                      </div>

                    </div>

                    {/* AI FEEDBACK */}

                    {evaluation && (
                      <div
                        className="
                          px-6
                          pb-6
                        "
                      >

                        <div className="flex items-center gap-3 mb-5">

                          <div
                            className="
                              w-8
                              h-8
                              rounded-lg
                              bg-gradient-to-br
                              from-[#6366F1]
                              to-[#8B5CF6]
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <span className="text-white text-[10px] font-bold">
                              AI
                            </span>
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-[#D8DCE5]">
                              AI Feedback
                            </p>

                            <p className="text-xs text-[#616B7D]">
                              Automated answer evaluation
                            </p>

                          </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

                          {/* CORRECTNESS */}

                          <div
                            className="
                              rounded-xl
                              bg-[#0B1020]
                              border
                              border-[#252F4A]
                              p-4
                            "
                          >

                            <p className="text-[10px] uppercase tracking-widest text-[#596276]">
                              Correctness
                            </p>

                            <p className="text-sm text-[#AAB2C0] mt-3 leading-6">
                              {
                                evaluation.correctness
                              }
                            </p>

                          </div>

                          {/* RELEVANCE */}

                          <div
                            className="
                              rounded-xl
                              bg-[#0B1020]
                              border
                              border-[#252F4A]
                              p-4
                            "
                          >

                            <p className="text-[10px] uppercase tracking-widest text-[#596276]">
                              Relevance
                            </p>

                            <p className="text-sm text-[#AAB2C0] mt-3 leading-6">
                              {
                                evaluation.relevance
                              }
                            </p>

                          </div>

                          {/* CLARITY */}

                          <div
                            className="
                              rounded-xl
                              bg-[#0B1020]
                              border
                              border-[#252F4A]
                              p-4
                            "
                          >

                            <p className="text-[10px] uppercase tracking-widest text-[#596276]">
                              Clarity
                            </p>

                            <p className="text-sm text-[#AAB2C0] mt-3 leading-6">
                              {
                                evaluation.clarity
                              }
                            </p>

                          </div>

                        </div>

                        {/* OVERALL FEEDBACK */}

                        <div
                          className="
                            rounded-xl
                            bg-[#151D33]
                            border
                            border-[#252F4A]
                            p-5
                          "
                        >

                          <p className="text-[10px] uppercase tracking-widest text-[#687184]">
                            Overall Feedback
                          </p>

                          <p className="text-sm text-[#B8BFCD] mt-3 leading-7">
                            {
                              evaluation.feedback
                            }
                          </p>

                        </div>

                      </div>
                    )}

                  </article>
                );
              }
            )}

          </div>

        </section>

        {/* ===================================================
            FOOTER ACTION
        ==================================================== */}

        <section className="mt-10">

          <div
            className="
              rounded-2xl
              border
              border-[#252F4A]
              bg-[#11182B]
              p-6
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-5
            "
          >

            <div>

              <p className="text-base font-semibold text-[#D8DCE5]">
                Ready for another round?
              </p>

              <p className="text-sm text-[#737C8E] mt-1">
                Keep practicing to improve your interview performance.
              </p>

            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  navigate("/dashboard")
                }
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  border-[#303A56]
                  text-sm
                  text-[#B8BFCD]
                  hover:text-[#E5E7EB]
                  hover:bg-[#151D33]
                  transition
                "
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/create-interview"
                  )
                }
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-gradient-to-r
                  from-[#6366F1]
                  to-[#8B5CF6]
                  text-white
                  text-sm
                  font-semibold
                  shadow-lg
                  shadow-indigo-950/20
                  hover:opacity-90
                  transition
                "
              >
                New Interview →
              </button>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default InterviewResult;