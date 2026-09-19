import { useEffect, useState } from "react";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { createInterview } from "../api/interview";
import { API_URL } from "../api/config";
import { useAuth } from "../context/AuthContext";

function CreateInterview() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [searchParams] = useSearchParams();

    const topicFromUrl =
        searchParams.get("topic");

    const difficultyFromUrl =
        searchParams.get("difficulty");

    const interviewModeFromUrl =
        searchParams.get("interview_mode");

    // ==========================================
    // TOPIC STATE
    // ==========================================

    const [topics, setTopics] = useState([]);

    const [topic, setTopic] =
        useState("");

    const [topicSearch, setTopicSearch] =
        useState("");

    const [topicsLoading, setTopicsLoading] =
        useState(false);

    const [showTopicResults, setShowTopicResults] =
        useState(false);

    // ==========================================
    // SELECTED CATEGORY METADATA
    // ==========================================

    // Category is detected by the backend.
    // It is NOT a user input anymore.
    const [selectedCategory, setSelectedCategory] =
        useState(null);

    // ==========================================
    // CUSTOM TOPIC STATE
    // ==========================================

    const [showCustomTopicModal, setShowCustomTopicModal] =
        useState(false);

    const [customTopic, setCustomTopic] =
        useState("");

    const [customTopicLoading, setCustomTopicLoading] =
        useState(false);

    const [customTopicError, setCustomTopicError] =
        useState("");

    // ==========================================
    // OTHER STATE
    // ==========================================

    const [difficulty, setDifficulty] =
        useState(
            ["easy", "medium", "hard"].includes(
                difficultyFromUrl
            )
                ? difficultyFromUrl
                : "medium"
        );

    const [interviewMode, setInterviewMode] =
        useState(
            ["timed", "untimed"].includes(
                interviewModeFromUrl
            )
                ? interviewModeFromUrl
                : "untimed"
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [recentPractice, setRecentPractice] =
        useState([]);

    const [recentPracticeLoading, setRecentPracticeLoading] =
        useState(true);

    // ==========================================
    // LOAD RECENT PRACTICE
    // ==========================================

    useEffect(() => {
        const loadRecentPractice = async () => {
            if (!token) {
                setRecentPracticeLoading(false);
                return;
            }

            try {
                setRecentPracticeLoading(true);

                const response = await fetch(
                    `${API_URL}/dashboard/recent-practice`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                        "Failed to load recent practice"
                    );
                }

                setRecentPractice(
                    data.recent_practice || []
                );
            } catch (err) {
                console.error(
                    "RECENT PRACTICE LOAD ERROR:",
                    err
                );

                setRecentPractice([]);
            } finally {
                setRecentPracticeLoading(false);
            }
        };

        loadRecentPractice();
    }, [token]);

    // ==========================================
    // LOAD TOPIC FROM URL
    // ==========================================

    useEffect(() => {
        if (!topicFromUrl) {
            return;
        }

        const trimmedTopic =
            topicFromUrl.trim();

        if (!trimmedTopic) {
            return;
        }

        setTopic(trimmedTopic);
        setTopicSearch(trimmedTopic);
        setTopics([]);
        setShowTopicResults(false);

        // Resolve the category for a topic loaded
        // through Recent Practice / URL.
        const resolveTopicCategory = async () => {
            try {
                const params =
                    new URLSearchParams();

                params.set(
                    "search",
                    trimmedTopic
                );

                const response =
                    await fetch(
                        `${API_URL}/interviews/topic-search?${params.toString()}`
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    return;
                }

                const results =
                    data.results || [];

                const exactMatch =
                    results.find(
                        (item) =>
                            item?.topic
                                ?.trim()
                                .toLowerCase() ===
                            trimmedTopic.toLowerCase()
                    );

                if (exactMatch) {
                    setSelectedCategory({
                        value:
                            exactMatch.category,
                        label:
                            exactMatch.category_label,
                    });
                }
            } catch (err) {
                console.error(
                    "TOPIC CATEGORY RESOLUTION ERROR:",
                    err
                );
            }
        };

        resolveTopicCategory();
    }, [topicFromUrl]);

    // ==========================================
    // LOAD DIFFICULTY / INTERVIEW MODE FROM URL
    // ==========================================

    useEffect(() => {
        if (
            ["easy", "medium", "hard"].includes(
                difficultyFromUrl
            )
        ) {
            setDifficulty(
                difficultyFromUrl
            );
        }

        if (
            ["timed", "untimed"].includes(
                interviewModeFromUrl
            )
        ) {
            setInterviewMode(
                interviewModeFromUrl
            );
        }
    }, [
        difficultyFromUrl,
        interviewModeFromUrl,
    ]);

    // ==========================================
    // TOPIC SEARCH
    // ==========================================

    useEffect(() => {
        const searchValue =
            topicSearch.trim();

        // A selected topic is already resolved.
        if (
            topic &&
            topic.trim().toLowerCase() ===
            searchValue.toLowerCase()
        ) {
            setTopics([]);
            setTopicsLoading(false);
            setShowTopicResults(false);
            return;
        }

        // Don't search for empty input.
        if (!searchValue) {
            setTopics([]);
            setTopicsLoading(false);
            setShowTopicResults(false);
            return;
        }

        const timeoutId =
            setTimeout(async () => {
                try {
                    setTopicsLoading(true);
                    setError("");

                    const params =
                        new URLSearchParams();

                    params.set(
                        "search",
                        searchValue
                    );

                    const response =
                        await fetch(
                            `${API_URL}/interviews/topic-search?${params.toString()}`
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.detail ||
                            "Failed to search topics"
                        );
                    }

                    setTopics(
                        data.results || []
                    );

                    setShowTopicResults(true);
                } catch (err) {
                    console.error(
                        "TOPIC SEARCH ERROR:",
                        err
                    );

                    setError(
                        err.message ||
                        "Failed to search topics."
                    );

                    setTopics([]);
                    setShowTopicResults(true);
                } finally {
                    setTopicsLoading(false);
                }
            }, 300);

        return () =>
            clearTimeout(timeoutId);
    }, [
        topic,
        topicSearch,
    ]);

    // ==========================================
    // TOPIC SELECT
    // ==========================================

    const handleTopicSelect = (
        selectedTopic
    ) => {
        if (!selectedTopic) {
            return;
        }

        setTopic(
            selectedTopic.topic
        );

        setTopicSearch(
            selectedTopic.topic
        );

        setSelectedCategory({
            value:
                selectedTopic.category,
            label:
                selectedTopic.category_label,
        });

        setTopics([]);
        setShowTopicResults(false);
        setError("");
    };

    // ==========================================
    // CHANGE SELECTED TOPIC
    // ==========================================

    const handleChangeTopic = () => {
        setTopic("");
        setTopicSearch("");
        setSelectedCategory(null);
        setTopics([]);
        setShowTopicResults(false);
        setError("");
    };

    // ==========================================
    // CUSTOM TOPIC
    // ==========================================

    const handleOpenCustomTopic = () => {
        const searchedTopic =
            topicSearch.trim();

        setCustomTopic(
            searchedTopic
        );

        setCustomTopicError("");
        setError("");
        setShowTopicResults(false);
        setShowCustomTopicModal(true);
    };

    const handleCloseCustomTopic = () => {
        if (customTopicLoading) {
            return;
        }

        setShowCustomTopicModal(false);
        setCustomTopic("");
        setCustomTopicError("");
    };

    const handleCustomTopicSubmit =
        async () => {
            const trimmedTopic =
                customTopic.trim();

            setCustomTopicError("");
            setError("");

            if (!trimmedTopic) {
                setCustomTopicError(
                    "Please enter a valid software/technical topic."
                );
                return;
            }

            if (!token) {
                setCustomTopicError(
                    "Your session has expired. Please login again."
                );
                return;
            }

            setCustomTopicLoading(true);

            try {
                const response =
                    await fetch(
                        `${API_URL}/interviews/custom-topic`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Authorization:
                                    `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                topic:
                                    trimmedTopic,
                                difficulty,
                                interview_mode:
                                    interviewMode,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                        "The topic could not be verified."
                    );
                }

                if (!data.id) {
                    throw new Error(
                        "The interview could not be created."
                    );
                }

                setShowCustomTopicModal(
                    false
                );

                setCustomTopic("");
                setCustomTopicError("");

                setTopic(
                    data.topic ||
                    trimmedTopic
                );

                setTopicSearch(
                    data.topic ||
                    trimmedTopic
                );

                // The custom-topic backend already
                // identifies the category internally.
                if (data.catalogue_category) {
                    setSelectedCategory({
                        value:
                            data.catalogue_category,
                        label:
                            data.catalogue_category,
                    });
                }

                navigate(
                    `/interview/${data.id}`
                );
            } catch (err) {
                console.error(
                    "CUSTOM TOPIC ERROR:",
                    err
                );

                setCustomTopicError(
                    err.message ||
                    "Failed to verify the custom topic."
                );
            } finally {
                setCustomTopicLoading(
                    false
                );
            }
        };

    // ==========================================
    // CREATE INTERVIEW
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!topic.trim()) {
            setError(
                "Please select a topic from the search results."
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
            const data =
                await createInterview(
                    token,
                    {
                        topic:
                            topic.trim(),
                        difficulty,
                        interview_mode:
                            interviewMode,
                    },
                    logout
                );

            console.log(
                "INTERVIEW CREATED:",
                data
            );

            navigate(
                `/interview/${data.id}`
            );
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
    // RECENT PRACTICE SELECT
    // ==========================================

    const handleRecentPractice =
        async (item) => {
            if (!item?.topic) {
                return;
            }

            setError("");

            const params =
                new URLSearchParams();

            params.set(
                "topic",
                item.topic
            );

            if (item.difficulty) {
                params.set(
                    "difficulty",
                    item.difficulty
                );
            }

            if (
                item.interview_mode ===
                    "timed" ||
                item.interview_mode ===
                    "untimed"
            ) {
                params.set(
                    "interview_mode",
                    item.interview_mode
                );
            }

            navigate(
                `/create-interview?${params.toString()}`
            );
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
    // QUICK PRACTICE TOPICS
    // ==========================================

    const quickPracticeTopics = [
        {
            topic: "Arrays",
            category:
                "Data Structures & Algorithms",
            description:
                "Practice array fundamentals and interview patterns.",
        },
        {
            topic: "Binary Search",
            category:
                "Data Structures & Algorithms",
            description:
                "Practice searching, boundaries, and optimization.",
        },
        {
            topic: "REST APIs",
            category:
                "Backend",
            description:
                "Practice API design and backend fundamentals.",
        },
    ];

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
                        Search for any technical
                        topic and we'll automatically
                        identify the interview area for you.
                    </p>

                </div>

                {/* ==========================================
                    QUICK PRACTICE
                ========================================== */}

                {!topic && (
                    <section className="mb-8">

                        <div className="mb-4">

                            <h3 className="text-lg font-semibold text-[#DDE1E9]">
                                Popular Practice
                            </h3>

                            <p className="text-sm text-[#70798B] mt-1">
                                Jump into a common interview topic.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {quickPracticeTopics.map(
                                (item) => {

                                    const initials =
                                        item.topic
                                            .split(" ")
                                            .map(
                                                (word) =>
                                                    word[0]
                                            )
                                            .join("")
                                            .slice(
                                                0,
                                                2
                                            )
                                            .toUpperCase();

                                    return (
                                        <button
                                            key={
                                                item.topic
                                            }
                                            type="button"
                                            onClick={() => {
                                                setTopic(
                                                    item.topic
                                                );

                                                setTopicSearch(
                                                    item.topic
                                                );

                                                setSelectedCategory(
                                                    {
                                                        value: "",
                                                        label:
                                                            item.category,
                                                    }
                                                );

                                                setShowTopicResults(
                                                    false
                                                );
                                            }}
                                            className="
                                                text-left
                                                rounded-2xl
                                                border
                                                border-[#252F4A]
                                                bg-[#11182B]
                                                p-6
                                                hover:border-[#3B4770]
                                                hover:bg-[#141C32]
                                                transition
                                            "
                                        >

                                            <div className="flex items-center justify-between mb-5">

                                                <div
                                                    className="
                                                        w-11
                                                        h-11
                                                        rounded-xl
                                                        bg-[#1A2138]
                                                        border
                                                        border-[#2B3554]
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <span className="text-[#A78BFA] font-bold text-xs">
                                                        {
                                                            initials
                                                        }
                                                    </span>
                                                </div>

                                                <span className="text-[#4B5563] text-lg">
                                                    →
                                                </span>

                                            </div>

                                            <h4 className="text-base font-semibold text-[#D8DCE5]">
                                                {
                                                    item.topic
                                                }
                                            </h4>

                                            <p className="text-xs text-[#7A8497] mt-2">
                                                {
                                                    item.category
                                                }
                                            </p>

                                        </button>
                                    );
                                }
                            )}

                        </div>

                        {/* ==================================
                            RECENTLY PRACTICED
                        ================================== */}

                        {recentPractice.length >
                            0 && (
                            <div className="mt-8">

                                <div className="mb-4">

                                    <h3 className="text-lg font-semibold text-[#DDE1E9]">
                                        Recently Practiced
                                    </h3>

                                    <p className="text-sm text-[#70798B] mt-1">
                                        Continue practicing topics you worked on recently.
                                    </p>

                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                                    {recentPractice.map(
                                        (item) => (
                                            <button
                                                key={
                                                    item.interview_id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    handleRecentPractice(
                                                        item
                                                    )
                                                }
                                                className="
                                                    w-full
                                                    text-left
                                                    rounded-xl
                                                    border
                                                    border-[#252F4A]
                                                    bg-[#11182B]
                                                    px-4
                                                    py-4
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-4
                                                    hover:border-[#6366F1]
                                                    hover:bg-[#141C32]
                                                    focus:outline-none
                                                    focus:ring-2
                                                    focus:ring-[#6366F1]/30
                                                    transition
                                                "
                                            >

                                                <div className="min-w-0">

                                                    <p className="text-sm font-medium text-[#D8DCE5] truncate capitalize">
                                                        {
                                                            item.topic
                                                        }
                                                    </p>

                                                    <p className="text-xs text-[#687184] mt-1 capitalize">
                                                        {
                                                            item.difficulty
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            item.status
                                                        }
                                                    </p>

                                                </div>

                                                <span className="text-xs text-[#8B5CF6] shrink-0">
                                                    Practice →
                                                </span>

                                            </button>
                                        )
                                    )}

                                </div>

                            </div>
                        )}

                        {recentPracticeLoading && (
                            <div className="mt-8">

                                <p className="text-sm text-[#687184]">
                                    Loading recent practice...
                                </p>

                            </div>
                        )}

                    </section>
                )}

                {/* ==========================================
                    INTERVIEW CONFIGURATION
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

                    {/* ==================================
                        TOPIC SEARCH
                    ================================== */}

                    <div className="mb-7">

                        <label
                            htmlFor="topic-search"
                            className="block text-sm font-medium text-[#B8BFCC] mb-2"
                        >
                            Search Topic
                        </label>

                        <p className="text-xs text-[#697386] mb-3">
                            Start typing a technical topic. We'll automatically identify its category.
                        </p>

                        <div className="relative">

                            <div
                                className="
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-[#5E687C]
                                    pointer-events-none
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
                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="6.5"
                                    />

                                    <path
                                        strokeLinecap="round"
                                        d="M16 16l4.5 4.5"
                                    />
                                </svg>
                            </div>

                            <input
                                id="topic-search"
                                type="text"
                                value={
                                    topicSearch
                                }
                                onChange={(event) => {

                                    const value =
                                        event.target
                                            .value;

                                    setTopicSearch(
                                        value
                                    );

                                    // Clear previous selection
                                    // when user starts typing.
                                    setTopic("");

                                    setSelectedCategory(
                                        null
                                    );

                                    setShowTopicResults(
                                        Boolean(
                                            value.trim()
                                        )
                                    );

                                    setError("");
                                }}
                                onFocus={() => {

                                    if (
                                        topicSearch.trim()
                                    ) {
                                        setShowTopicResults(
                                            true
                                        );
                                    }

                                }}
                                placeholder="Search topics, e.g. tree, redis, docker, jwt..."
                                className="
                                    w-full
                                    bg-[#0B1020]
                                    border
                                    border-[#293452]
                                    rounded-xl
                                    pl-12
                                    pr-12
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

                            {topicsLoading && (
                                <div
                                    className="
                                        absolute
                                        right-4
                                        top-1/2
                                        -translate-y-1/2
                                    "
                                >
                                    <div
                                        className="
                                            w-4
                                            h-4
                                            rounded-full
                                            border-2
                                            border-[#39445F]
                                            border-t-[#8B5CF6]
                                            animate-spin
                                        "
                                    />
                                </div>
                            )}

                            {/* ==================================
                                SEARCH RESULTS
                            ================================== */}

                            {showTopicResults &&
                                topicSearch.trim() &&
                                !topicsLoading && (

                                    <div
                                        className="
                                            absolute
                                            left-0
                                            right-0
                                            top-full
                                            mt-2
                                            z-30
                                            bg-[#11182B]
                                            border
                                            border-[#303A56]
                                            rounded-xl
                                            shadow-2xl
                                            shadow-black/30
                                            overflow-hidden
                                        "
                                    >

                                        {topics.length >
                                            0 ? (

                                            <div className="max-h-72 overflow-y-auto py-2">

                                                {topics.map(
                                                    (
                                                        item
                                                    ) => {

                                                        const selected =
                                                            topic
                                                                .trim()
                                                                .toLowerCase() ===
                                                            item.topic
                                                                ?.trim()
                                                                .toLowerCase();

                                                        return (
                                                            <button
                                                                key={`${item.category}-${item.topic}`}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleTopicSelect(
                                                                        item
                                                                    )
                                                                }
                                                                className={`
                                                                    w-full
                                                                    px-4
                                                                    py-3
                                                                    text-left
                                                                    flex
                                                                    items-center
                                                                    justify-between
                                                                    gap-4
                                                                    transition
                                                                    ${
                                                                        selected
                                                                            ? "bg-[#1E2540]"
                                                                            : "hover:bg-[#151D33]"
                                                                    }
                                                                `}
                                                            >

                                                                <div className="min-w-0">

                                                                    <p
                                                                        className={`
                                                                            text-sm
                                                                            truncate
                                                                            ${
                                                                                selected
                                                                                    ? "text-[#C4B5FD]"
                                                                                    : "text-[#B8BFCD]"
                                                                            }
                                                                        `}
                                                                    >
                                                                        {
                                                                            item.topic
                                                                        }
                                                                    </p>

                                                                    <p className="text-xs text-[#697386] mt-1">
                                                                        {
                                                                            item.category_label
                                                                        }
                                                                    </p>

                                                                </div>

                                                                {selected && (
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        className="w-4 h-4 shrink-0 text-[#8B5CF6]"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M5 12.5l4 4L19 7"
                                                                        />
                                                                    </svg>
                                                                )}

                                                            </button>
                                                        );
                                                    }
                                                )}

                                            </div>

                                        ) : (

                                            <div className="px-5 py-5">

                                                <p className="text-sm text-[#8992A4]">
                                                    No matching topics found.
                                                </p>

                                                <p className="text-xs text-[#606A7D] mt-1">
                                                    You can ask AI to verify a custom technical topic.
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleOpenCustomTopic
                                                    }
                                                    className="
                                                        mt-4
                                                        text-sm
                                                        font-medium
                                                        text-[#A78BFA]
                                                        hover:text-[#C4B5FD]
                                                        transition
                                                    "
                                                >
                                                    Can't find your topic?
                                                </button>

                                            </div>

                                        )}

                                    </div>
                                )}

                        </div>

                        {/* ==================================
                            SELECTED TOPIC
                        ================================== */}

                        {topic && (
                            <div
                                className="
                                    mt-4
                                    px-4
                                    py-4
                                    rounded-xl
                                    bg-[#151D33]
                                    border
                                    border-[#303A56]
                                "
                            >

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="text-[10px] uppercase tracking-widest text-[#687184]">
                                            Selected Topic
                                        </p>

                                        <p className="text-sm font-medium text-[#D8DCE5] mt-1">
                                            {topic}
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleChangeTopic
                                        }
                                        className="
                                            text-xs
                                            text-[#697386]
                                            hover:text-[#C4B5FD]
                                            transition
                                        "
                                    >
                                        Change
                                    </button>

                                </div>

                                {/* AUTO DETECTED CATEGORY */}

                                {selectedCategory && (
                                    <div
                                        className="
                                            mt-4
                                            pt-4
                                            border-t
                                            border-[#293452]
                                            flex
                                            items-center
                                            gap-3
                                        "
                                    >

                                        <div
                                            className="
                                                w-8
                                                h-8
                                                rounded-lg
                                                bg-[#20284A]
                                                border
                                                border-[#343D63]
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

                                            <p className="text-[10px] uppercase tracking-widest text-[#687184]">
                                                Detected Category
                                            </p>

                                            <p className="text-xs font-medium text-[#C4B5FD] mt-1">
                                                {
                                                    selectedCategory.label
                                                }
                                            </p>

                                        </div>

                                    </div>
                                )}

                            </div>
                        )}

                    </div>

                    {/* ==========================================
                        DIFFICULTY
                    ========================================== */}

                    <div>

                        <div className="mb-5">

                            <h3 className="text-base font-semibold text-[#DDE1E9]">
                                Difficulty Level
                            </h3>

                            <p className="text-sm text-[#70798B] mt-1">
                                Choose how challenging you want the interview to be.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {difficulties.map(
                                (item) => {

                                    const selected =
                                        difficulty ===
                                        item.value;

                                    return (
                                        <button
                                            key={
                                                item.value
                                            }
                                            type="button"
                                            onClick={() =>
                                                setDifficulty(
                                                    item.value
                                                )
                                            }
                                            className={`
                                                text-left
                                                p-5
                                                rounded-xl
                                                border
                                                transition
                                                duration-200
                                                ${
                                                    selected
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
                                                        ${
                                                            selected
                                                                ? "text-[#C4B5FD]"
                                                                : "text-[#C5CBD6]"
                                                        }
                                                    `}
                                                >
                                                    {
                                                        item.label
                                                    }
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
                                                        ${
                                                            selected
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
                                                {
                                                    item.description
                                                }
                                            </p>

                                        </button>
                                    );
                                }
                            )}

                        </div>

                    </div>

                    {/* ==========================================
                        INTERVIEW MODE
                    ========================================== */}

                    <div className="mt-8">

                        <div className="mb-5">

                            <h3 className="text-base font-semibold text-[#DDE1E9]">
                                Interview Mode
                            </h3>

                            <p className="text-sm text-[#70798B] mt-1">
                                Choose whether you want to practice with a question time limit.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {[
                                {
                                    value: "timed",
                                    label: "Timed Interview",
                                    description:
                                        "Practice under interview pressure with a fixed time per question.",
                                    details:
                                        "Easy 3 min · Medium 5 min · Hard 8 min",
                                },
                                {
                                    value: "untimed",
                                    label: "No Timer",
                                    description:
                                        "Take your time and focus on understanding and explaining the solution.",
                                    details:
                                        "No question deadline",
                                },
                            ].map(
                                (item) => {

                                    const selected =
                                        interviewMode ===
                                        item.value;

                                    return (
                                        <button
                                            key={
                                                item.value
                                            }
                                            type="button"
                                            onClick={() =>
                                                setInterviewMode(
                                                    item.value
                                                )
                                            }
                                            className={`
                                                text-left
                                                p-5
                                                rounded-xl
                                                border
                                                transition
                                                duration-200
                                                ${
                                                    selected
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
                                                        ${
                                                            selected
                                                                ? "text-[#C4B5FD]"
                                                                : "text-[#C5CBD6]"
                                                        }
                                                    `}
                                                >
                                                    {
                                                        item.label
                                                    }
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
                                                        ${
                                                            selected
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

                                            <p className="text-xs text-[#737C8E] leading-5">
                                                {
                                                    item.description
                                                }
                                            </p>

                                            <p className="text-xs text-[#A78BFA] mt-3">
                                                {
                                                    item.details
                                                }
                                            </p>

                                        </button>
                                    );
                                }
                            )}

                        </div>

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
                                topic and difficulty. Previously
                                used questions for this topic and
                                difficulty are excluded from generation.
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
                        disabled={
                            loading ||
                            !topic
                        }
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

            {/* ==========================================
                CUSTOM TOPIC MODAL
            ========================================== */}

            {showCustomTopicModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        bg-black/60
                        backdrop-blur-sm
                        px-4
                    "
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                                event.currentTarget &&
                            !customTopicLoading
                        ) {
                            handleCloseCustomTopic();
                        }

                    }}
                >

                    <div
                        className="
                            w-full
                            max-w-md
                            rounded-2xl
                            border
                            border-[#303A56]
                            bg-[#11182B]
                            shadow-2xl
                            shadow-black/40
                            p-6
                        "
                    >

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <h3 className="text-lg font-semibold text-[#E5E7EB]">
                                    Enter your topic
                                </h3>

                                <p className="text-sm text-[#7E8799] mt-2 leading-6">
                                    We'll verify that this is a technical
                                    topic, identify its category, and generate
                                    your interview questions in one step.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCloseCustomTopic
                                }
                                disabled={
                                    customTopicLoading
                                }
                                className="
                                    text-[#687184]
                                    hover:text-[#D1D5DB]
                                    disabled:opacity-40
                                    transition
                                "
                                aria-label="Close custom topic dialog"
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
                                        d="M6 6l12 12M18 6L6 18"
                                    />

                                </svg>

                            </button>

                        </div>

                        <div className="mt-6">

                            <label
                                htmlFor="custom-topic"
                                className="
                                    block
                                    text-sm
                                    font-medium
                                    text-[#B8BFCC]
                                    mb-2
                                "
                            >
                                Topic
                            </label>

                            <input
                                id="custom-topic"
                                type="text"
                                value={
                                    customTopic
                                }
                                onChange={(event) =>
                                    setCustomTopic(
                                        event.target
                                            .value
                                    )
                                }
                                onKeyDown={(event) => {

                                    if (
                                        event.key ===
                                            "Enter" &&
                                        !customTopicLoading
                                    ) {
                                        event.preventDefault();

                                        handleCustomTopicSubmit();
                                    }

                                }}
                                autoFocus
                                disabled={
                                    customTopicLoading
                                }
                                placeholder="e.g. Kubernetes Operators"
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
                                    disabled:opacity-50
                                "
                            />

                            {customTopicError && (
                                <div
                                    className="
                                        mt-4
                                        rounded-xl
                                        border
                                        border-red-500/20
                                        bg-red-500/5
                                        px-3
                                        py-2.5
                                    "
                                >

                                    <p className="text-xs leading-5 text-red-400">
                                        {
                                            customTopicError
                                        }
                                    </p>

                                </div>
                            )}

                        </div>

                        <div className="flex justify-end gap-3 mt-7">

                            <button
                                type="button"
                                onClick={
                                    handleCloseCustomTopic
                                }
                                disabled={
                                    customTopicLoading
                                }
                                className="
                                    px-4
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-[#303A56]
                                    text-sm
                                    text-[#81899A]
                                    hover:text-[#D1D5DB]
                                    hover:border-[#46516E]
                                    disabled:opacity-40
                                    transition
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleCustomTopicSubmit
                                }
                                disabled={
                                    customTopicLoading ||
                                    !customTopic.trim()
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
                                    text-sm
                                    font-semibold
                                    transition
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                {customTopicLoading && (
                                    <span
                                        className="
                                            w-4
                                            h-4
                                            rounded-full
                                            border-2
                                            border-white/30
                                            border-t-white
                                            animate-spin
                                        "
                                    />
                                )}

                                {customTopicLoading
                                    ? "Verifying..."
                                    : "Continue"}

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default CreateInterview;