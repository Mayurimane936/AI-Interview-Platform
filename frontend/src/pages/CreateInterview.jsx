import { useEffect, useState } from "react";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { createInterview } from "../api/interview";
import { useAuth } from "../context/AuthContext";

function CreateInterview() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [searchParams] = useSearchParams();

    const categoryFromUrl = searchParams.get("category");

    // ==========================================
    // CATEGORY OPTIONS
    // ==========================================

    const categoryOptions = {
        dsa: {
            label: "Data Structures",
            shortLabel: "DSA",
            description:
                "Algorithms and core data structures",
            topics: [
                "Arrays & Strings",
                "Linked Lists",
                "Stacks & Queues",
                "Trees",
                "Binary Search Trees",
                "Heaps",
                "Hash Tables",
                "Graphs",
                "Dynamic Programming",
                "Sorting & Searching",
            ],
        },

        backend: {
            label: "Backend",
            shortLabel: "Backend",
            description:
                "APIs, databases and backend engineering",
            topics: [
                "REST APIs",
                "FastAPI",
                "Node.js",
                "Databases",
                "SQL",
                "Redis",
                "Caching",
                "Authentication",
                "Microservices",
                "Distributed Systems",
                "Message Queues",
            ],
        },

        system_design: {
            label: "System Design",
            shortLabel: "System Design",
            description:
                "Scalable systems and architecture",
            topics: [
                "URL Shortener",
                "Chat Application",
                "Rate Limiter",
                "Notification System",
                "File Storage",
                "Food Delivery",
                "Video Streaming",
                "Social Media Feed",
                "Payment System",
                "Distributed Cache",
            ],
        },
    };

    // ==========================================
    // STATE
    // ==========================================

    const validCategory =
        categoryFromUrl &&
            categoryOptions[categoryFromUrl]
            ? categoryFromUrl
            : "";

    const [mode, setMode] = useState(
        validCategory ? "quick" : "custom"
    );

    const [category, setCategory] =
        useState(validCategory);

    const [topic, setTopic] = useState(() => {
        if (
            validCategory &&
            categoryOptions[validCategory]
        ) {
            return categoryOptions[
                validCategory
            ].topics[0];
        }

        return "";
    });

    const [difficulty, setDifficulty] =
        useState("medium");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] = useState("");

    // ==========================================
    // HANDLE URL CATEGORY
    // ==========================================

    useEffect(() => {
        if (
            categoryFromUrl &&
            categoryOptions[categoryFromUrl]
        ) {
            const selectedCategory =
                categoryOptions[categoryFromUrl];

            setMode("quick");
            setCategory(categoryFromUrl);
            setTopic(selectedCategory.topics[0]);
            setError("");
        }
    }, [categoryFromUrl]);

    // ==========================================
    // CATEGORY SELECT
    // ==========================================

    const handleCategorySelect = (
        selectedCategory
    ) => {
        const selected =
            categoryOptions[selectedCategory];

        setMode("quick");
        setCategory(selectedCategory);
        setTopic(selected.topics[0]);
        setError("");

        navigate(
            `/create-interview?category=${selectedCategory}`,
            { replace: true }
        );
    };

    // ==========================================
    // CUSTOM SELECT
    // ==========================================

    const handleCustomSelect = () => {
        setMode("custom");
        setCategory("");
        setTopic("");
        setError("");

        navigate("/create-interview", {
            replace: true,
        });
    };

    // ==========================================
    // CREATE INTERVIEW
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!topic.trim()) {
            setError(
                "Please select or enter an interview topic."
            );
            return;
        }

        if (!token) {
            setError(
                "Your session has expired. Please login again."
            );
            return;
        }

        setLoading(true);

        try {
            const data = await createInterview(token, {
                topic: topic.trim(),
                difficulty,
            });

            console.log(
                "INTERVIEW CREATED:",
                data
            );

            navigate(`/interview/${data.id}`);
        } catch (err) {
            console.error(
                "CREATE INTERVIEW ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to create interview."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // DIFFICULTY OPTIONS
    // ==========================================

    const difficulties = [
        {
            value: "easy",
            label: "Easy",
            description:
                "Fundamental concepts",
        },

        {
            value: "medium",
            label: "Medium",
            description:
                "Interview-level questions",
        },

        {
            value: "hard",
            label: "Hard",
            description:
                "Advanced concepts",
        },
    ];

    // ==========================================
    // CURRENT CATEGORY
    // ==========================================

    const currentCategory =
        category
            ? categoryOptions[category]
            : null;

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB]">

            {/* ==========================================
          HEADER
      ========================================== */}

            <header className="bg-[#11182B] border-b border-[#252F4A]">

                <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">

                    {/* BRAND */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="flex items-center gap-3"
                    >

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

                        <div className="text-left">

                            <h1 className="text-base font-semibold text-[#E5E7EB]">
                                AI Interview Platform
                            </h1>

                            <p className="text-xs text-[#6B7280]">
                                Practice smarter
                            </p>

                        </div>

                    </button>


                    {/* DASHBOARD */}

                    <button
                        type="button"
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
                        ← Dashboard
                    </button>

                </div>

            </header>


            {/* ==========================================
          MAIN
      ========================================== */}

            <main className="max-w-5xl mx-auto px-6 py-12">

                {/* BREADCRUMB */}

                <div className="flex items-center gap-2 text-xs mb-6">

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="
              text-[#687184]
              hover:text-[#A5A9E8]
              transition
            "
                    >
                        Dashboard
                    </button>

                    <span className="text-[#454D60]">
                        /
                    </span>

                    <span className="text-[#9CA3AF]">
                        Create Interview
                    </span>

                </div>


                {/* PAGE TITLE */}

                <div className="mb-10">

                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#E5E7EB]">
                        Create a new interview
                    </h2>

                    <p className="text-[#81899A] mt-3 max-w-2xl leading-7">
                        Choose a practice area or create a
                        completely custom interview tailored
                        to what you want to learn.
                    </p>

                </div>


                {/* ==========================================
            QUICK PRACTICE
        ========================================== */}

                {!validCategory && (

                    <section className="mb-8">

                        <div className="mb-4">

                            <h3 className="text-lg font-semibold text-[#DDE1E9]">
                                Quick Practice
                            </h3>

                            <p className="text-sm text-[#70798B] mt-1">
                                Start with a predefined interview category.
                            </p>

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {Object.entries(
                                categoryOptions
                            ).map(([key, item]) => {

                                const selected =
                                    mode === "quick" &&
                                    category === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() =>
                                            handleCategorySelect(key)
                                        }
                                        className={`
                      text-left
                      rounded-2xl
                      border
                      p-6
                      transition
                      duration-200
                      ${selected
                                                ? "border-[#6366F1] bg-[#181F39] shadow-lg shadow-indigo-950/10"
                                                : "border-[#252F4A] bg-[#11182B] hover:border-[#3B4770] hover:bg-[#141C32]"
                                            }
                    `}
                                    >

                                        <div className="flex items-center justify-between mb-5">

                                            <div
                                                className={`
                          w-11
                          h-11
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          border
                          ${selected
                                                        ? "bg-[#292F55] border-[#454D80]"
                                                        : "bg-[#1A2138] border-[#2B3554]"
                                                    }
                        `}
                                            >

                                                <span
                                                    className={`
                            text-xs font-bold
                            ${selected
                                                            ? "text-[#C4B5FD]"
                                                            : "text-[#9CA3AF]"
                                                        }
                          `}
                                                >
                                                    {key === "dsa"
                                                        ? "DS"
                                                        : key === "backend"
                                                            ? "BE"
                                                            : "SD"}
                                                </span>

                                            </div>


                                            <span
                                                className={`
                          text-lg
                          transition
                          ${selected
                                                        ? "text-[#A78BFA]"
                                                        : "text-[#4B5563]"
                                                    }
                        `}
                                            >
                                                →
                                            </span>

                                        </div>


                                        <h4 className="text-base font-semibold text-[#D8DCE5]">
                                            {item.label}
                                        </h4>

                                        <p className="text-sm text-[#737C8E] mt-2 leading-6">
                                            {item.description}
                                        </p>

                                    </button>
                                );
                            })}

                        </div>

                    </section>

                )}


                {/* ==========================================
            SELECTED QUICK CATEGORY
        ========================================== */}

                {mode === "quick" &&
                    currentCategory && (

                        <section
                            className="
                mb-8
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-2xl
                p-7
              "
                        >

                            <div className="flex items-start justify-between gap-5 mb-6">

                                <div>

                                    <div className="flex items-center gap-3 mb-2">

                                        <div
                                            className="
                        w-10
                        h-10
                        rounded-xl
                        bg-[#20284A]
                        border
                        border-[#343D63]
                        flex
                        items-center
                        justify-center
                      "
                                        >

                                            <span className="text-[#A78BFA] font-bold text-xs">
                                                {category === "dsa"
                                                    ? "DS"
                                                    : category === "backend"
                                                        ? "BE"
                                                        : "SD"}
                                            </span>

                                        </div>

                                        <div>

                                            <h3 className="text-lg font-semibold text-[#DDE1E9]">
                                                {currentCategory.label}
                                            </h3>

                                            <p className="text-sm text-[#70798B]">
                                                {currentCategory.description}
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {/* Change category */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategory("");
                                        setTopic("");
                                        setMode("custom");

                                        navigate(
                                            "/create-interview",
                                            { replace: true }
                                        );
                                    }}
                                    className="
                    text-xs
                    text-[#7C8494]
                    hover:text-[#A78BFA]
                    transition
                  "
                                >
                                    Change
                                </button>

                            </div>


                            {/* TOPIC */}

                            <label className="block text-sm font-medium text-[#B8BFCC] mb-2">
                                Choose a topic
                            </label>

                            <p className="text-xs text-[#697386] mb-3">
                                Select a focused topic for your interview.
                            </p>

                            <select
                                value={topic}
                                onChange={(e) =>
                                    setTopic(e.target.value)
                                }
                                className="
                  w-full
                  bg-[#0B1020]
                  border
                  border-[#293452]
                  rounded-xl
                  px-4
                  py-3.5
                  text-sm
                  text-[#D8DCE5]
                  outline-none
                  focus:border-[#6366F1]
                  focus:ring-1
                  focus:ring-[#6366F1]/20
                  transition
                "
                            >

                                {currentCategory.topics.map(
                                    (item) => (
                                        <option
                                            key={item}
                                            value={item}
                                            className="bg-[#11182B]"
                                        >
                                            {item}
                                        </option>
                                    )
                                )}

                            </select>

                            <div className="mt-5 flex items-center justify-between">

                                <p className="text-sm text-[#697386]">
                                    Can't find the topic you're looking for?
                                </p>

                                <button
                                    type="button"
                                    onClick={handleCustomSelect}
                                    className="
                    text-sm
                    font-medium
                    text-[#A78BFA]
                    hover:text-[#C4B5FD]
                    transition
                    "
                                >
                                    Create Custom Interview →
                                </button>

                            </div>

                        </section>

                    )}


                {/* ==========================================
            CUSTOM INTERVIEW
        ========================================== */}

                {!validCategory && (

                    <section
                        className={`
              mb-8
              rounded-2xl
              border
              p-7
              transition
              ${mode === "custom"
                                ? "border-[#6366F1] bg-[#151B31]"
                                : "border-[#252F4A] bg-[#11182B]"
                            }
            `}
                    >

                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                            <div>

                                <div className="flex items-center gap-3 mb-2">

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
                    "
                                    >
                                        <span className="text-[#A78BFA] text-sm font-semibold">
                                            +
                                        </span>
                                    </div>

                                    <h3 className="text-base font-semibold text-[#DDE1E9]">
                                        Custom Interview
                                    </h3>

                                </div>

                                <p className="text-sm text-[#737C8E] max-w-xl leading-6">
                                    Have something specific in mind?
                                    Enter any technical topic and let AI
                                    generate the questions.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={handleCustomSelect}
                                className={`
                  px-5
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                  transition
                  ${mode === "custom"
                                        ? "bg-[#6366F1] text-white"
                                        : "border border-[#343E61] text-[#AEB5C3] hover:text-white hover:border-[#4A577A]"
                                    }
                `}
                            >
                                {mode === "custom"
                                    ? "Selected"
                                    : "Use Custom"}
                            </button>

                        </div>


                        {/* CUSTOM TOPIC INPUT */}

                        {mode === "custom" && (

                            <div className="mt-6">

                                <label className="block text-sm font-medium text-[#B8BFCC] mb-2">
                                    Your Topic
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. Operating Systems, Docker, Cyber Security"
                                    value={topic}
                                    onChange={(e) =>
                                        setTopic(e.target.value)
                                    }
                                    className="
                    w-full
                    bg-[#0B1020]
                    border
                    border-[#293452]
                    rounded-xl
                    px-4
                    py-3.5
                    text-sm
                    text-[#D8DCE5]
                    placeholder:text-[#545D70]
                    outline-none
                    focus:border-[#6366F1]
                    focus:ring-1
                    focus:ring-[#6366F1]/20
                    transition
                  "
                                />

                            </div>

                        )}

                    </section>

                )}


                {/* ==========================================
            DIFFICULTY
        ========================================== */}

                <section
                    className="
            bg-[#11182B]
            border
            border-[#252F4A]
            rounded-2xl
            p-7
            mb-8
          "
                >

                    <div className="mb-5">

                        <h3 className="text-base font-semibold text-[#DDE1E9]">
                            Difficulty Level
                        </h3>

                        <p className="text-sm text-[#70798B] mt-1">
                            Choose how challenging you want the interview to be.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {difficulties.map((item) => {

                            const selected =
                                difficulty === item.value;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setDifficulty(item.value)
                                    }
                                    className={`
                    text-left
                    p-5
                    rounded-xl
                    border
                    transition
                    duration-200
                    ${selected
                                            ? "bg-[#1A203A] border-[#6366F1]"
                                            : "bg-[#0D1425] border-[#293452] hover:border-[#39476D]"
                                        }
                  `}
                                >

                                    <div className="flex items-center justify-between mb-3">

                                        <span
                                            className={`
                        text-sm
                        font-semibold
                        ${selected
                                                    ? "text-[#C4B5FD]"
                                                    : "text-[#C5CBD6]"
                                                }
                      `}
                                        >
                                            {item.label}
                                        </span>

                                        <span
                                            className={`
                        w-4
                        h-4
                        rounded-full
                        border
                        flex
                        items-center
                        justify-center
                        ${selected
                                                    ? "border-[#8B5CF6]"
                                                    : "border-[#46516D]"
                                                }
                      `}
                                        >

                                            {selected && (
                                                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                                            )}

                                        </span>

                                    </div>

                                    <p className="text-xs text-[#737C8E]">
                                        {item.description}
                                    </p>

                                </button>
                            );
                        })}

                    </div>

                </section>


                {/* ==========================================
            AI INFORMATION
        ========================================== */}

                <section
                    className="
            bg-[#151B30]
            border
            border-[#2C3555]
            rounded-2xl
            p-6
            mb-8
          "
                >

                    <div className="flex items-start gap-4">

                        <div
                            className="
                w-10
                h-10
                rounded-xl
                bg-gradient-to-br
                from-[#252D52]
                to-[#30234D]
                border
                border-[#3A4168]
                flex
                items-center
                justify-center
                shrink-0
              "
                        >
                            <span className="text-[#A78BFA] text-xs font-bold">
                                AI
                            </span>
                        </div>

                        <div>

                            <h4 className="text-sm font-semibold text-[#D5D9E2]">
                                AI-generated interview
                            </h4>

                            <p className="text-sm text-[#788194] mt-1 leading-6">
                                We'll generate five technical
                                questions based on your selected
                                topic and difficulty.
                            </p>

                        </div>

                    </div>

                </section>


                {/* ==========================================
            ERROR
        ========================================== */}

                {error && (

                    <div
                        className="
              rounded-xl
              border
              border-red-500/20
              bg-red-500/5
              px-4
              py-3
              mb-6
            "
                    >

                        <p className="text-sm text-red-400">
                            {error}
                        </p>

                    </div>

                )}


                {/* ==========================================
            ACTIONS
        ========================================== */}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="
              px-5
              py-3
              rounded-xl
              border
              border-[#303A56]
              text-sm
              text-[#81899A]
              hover:text-[#D1D5DB]
              hover:border-[#46516E]
              transition
            "
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="
              px-7
              py-3
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
                        {loading
                            ? "Generating Interview..."
                            : "Generate Interview →"}
                    </button>

                </div>

            </main>

        </div>
    );
}

export default CreateInterview;