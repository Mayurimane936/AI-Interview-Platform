import { useEffect, useState } from "react";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { createInterview } from "../api/interview";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://127.0.0.1:8000";

function CreateInterview() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [searchParams] = useSearchParams();

    const categoryFromUrl =
        searchParams.get("category");

    const topicFromUrl =
        searchParams.get("topic");

    const difficultyFromUrl =
        searchParams.get("difficulty");

    const interviewModeFromUrl =
        searchParams.get("interview_mode");

    // ==========================================
    // CATEGORY STATE
    // ==========================================

    const [categories, setCategories] =
        useState([]);

    const [categoriesLoading, setCategoriesLoading] =
        useState(true);

    const [category, setCategory] =
        useState("");

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

    const [recentPractice, setRecentPractice] = useState([]);
    const [recentPracticeLoading, setRecentPracticeLoading] = useState(true);

    // ==========================================
    // LOAD CATEGORIES
    // ==========================================

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategoriesLoading(true);

                const response = await fetch(
                    `${API_URL}/interviews/categories`
                );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                        "Failed to load categories"
                    );
                }

                setCategories(
                    data.categories || []
                );
            } catch (err) {
                console.error(
                    "CATEGORY LOAD ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to load interview categories."
                );
            } finally {
                setCategoriesLoading(false);
            }
        };

        loadCategories();
    }, []);

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
    // SET CATEGORY FROM URL
    // ==========================================

    useEffect(() => {
        if (!categories.length) {
            return;
        }

        const categoryExists =
            categories.some(
                (item) =>
                    item.value === categoryFromUrl
            );

        if (categoryExists) {
            setCategory(categoryFromUrl);
        } else {
            setCategory("");
        }
    }, [
        categories,
        categoryFromUrl,
    ]);

    // ==========================================
    // LOAD TOPIC / DIFFICULTY / MODE FROM URL
    // ==========================================

    useEffect(() => {
        if (!category || !topicFromUrl) {
            return;
        }

        setTopic(topicFromUrl);
        setTopicSearch(topicFromUrl);
        setTopics([]);
        setShowTopicResults(false);
    }, [category, topicFromUrl]);

    useEffect(() => {
        if (["easy", "medium", "hard"].includes(difficultyFromUrl)) {
            setDifficulty(difficultyFromUrl);
        }

        if (["timed", "untimed"].includes(interviewModeFromUrl)) {
            setInterviewMode(interviewModeFromUrl);
        }
    }, [difficultyFromUrl, interviewModeFromUrl]);

    // ==========================================
    // LOAD TOPICS ONLY AFTER USER TYPES
    // ==========================================

    useEffect(() => {
        if (!category) {
            setTopics([]);
            setTopicsLoading(false);
            setShowTopicResults(false);
            return;
        }

        const searchValue =
            topicSearch.trim();

        // A topic loaded from a recent-practice shortcut is already selected.
        if (topic && topic.trim() === searchValue) {
            setTopics([]);
            setTopicsLoading(false);
            setShowTopicResults(false);
            return;
        }

        // Do NOT show all topics when search is empty.
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
                        "category",
                        category
                    );

                    params.set(
                        "search",
                        searchValue
                    );

                    const response =
                        await fetch(
                            `${API_URL}/interviews/topics?${params.toString()}`
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.detail ||
                            "Failed to load topics"
                        );
                    }

                    setTopics(
                        data.topics || []
                    );

                    setShowTopicResults(
                        true
                    );
                } catch (err) {
                    console.error(
                        "TOPIC LOAD ERROR:",
                        err
                    );

                    setError(
                        err.message ||
                        "Failed to load topics."
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
        category,
        topicSearch,
    ]);

    // ==========================================
    // CATEGORY SELECT
    // ==========================================

    const handleCategorySelect = (
        selectedCategory
    ) => {
        setCategory(
            selectedCategory
        );

        setTopic("");
        setTopicSearch("");
        setTopics([]);
        setShowTopicResults(false);
        setError("");

        const params = new URLSearchParams();

        if (selectedCategory) {
            params.set("category", selectedCategory);
        }

        params.set("interview_mode", interviewMode);

        navigate(
            `/create-interview?${params.toString()}`,
            {
                replace: true,
            }
        );
    };

    // ==========================================
    // TOPIC SELECT
    // ==========================================

    const handleTopicSelect = (
        selectedTopic
    ) => {
        setTopic(selectedTopic);
        setTopicSearch(selectedTopic);
        setShowTopicResults(false);
        setError("");
    };

    // ==========================================
    // CREATE INTERVIEW
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!category) {
            setError(
                "Please select an interview category."
            );
            return;
        }

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
                        topic: topic.trim(),
                        difficulty,
                        interview_mode: interviewMode,
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

    const handleRecentPractice = async (item) => {
        if (!item?.topic) {
            return;
        }

        setError("");

        // Prefer category supplied by the backend.
        let recentCategory = item.category;

        // Older recent-practice responses may not contain category.
        // Resolve it from the catalogue before navigating.
        if (!recentCategory && categories.length) {
            const normalizedTopic = item.topic.trim().toLowerCase();

            try {
                for (const categoryItem of categories) {
                    const params = new URLSearchParams();
                    params.set("category", categoryItem.value);
                    params.set("search", item.topic.trim());

                    const response = await fetch(
                        `${API_URL}/interviews/topics?${params.toString()}`
                    );

                    if (!response.ok) {
                        continue;
                    }

                    const data = await response.json();
                    const matchingTopics = data.topics || [];

                    const exactMatch = matchingTopics.find(
                        (value) =>
                            value?.trim().toLowerCase() === normalizedTopic
                    );

                    if (exactMatch) {
                        recentCategory = categoryItem.value;
                        break;
                    }
                }
            } catch (err) {
                console.error(
                    "RECENT PRACTICE CATEGORY RESOLUTION ERROR:",
                    err
                );
            }
        }

        if (!recentCategory) {
            setError("This recent topic could not be linked to a category. Please search for it instead.");
            return;
        }

        const params = new URLSearchParams();
        params.set("category", recentCategory);
        params.set("topic", item.topic);

        if (item.difficulty) {
            params.set("difficulty", item.difficulty);
        }

        if (item.interview_mode === "timed" || item.interview_mode === "untimed") {
            params.set("interview_mode", item.interview_mode);
        }

        navigate(`/create-interview?${params.toString()}`);
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
        categories.find(
            (item) =>
                item.value === category
        );

    // ==========================================
    // QUICK PRACTICE CATEGORIES
    // ==========================================

    const quickPracticeKeys = [
        "dsa",
        "backend",
        "system_design",
    ];

    const quickPracticeCategories =
        quickPracticeKeys
            .map((key) =>
                categories.find(
                    (item) => item.value === key
                )
            )
            .filter(Boolean);

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
                        Choose a technical area, search
                        for a topic, and let AI generate
                        your interview.
                    </p>

                </div>

                {/* ==========================================
                    QUICK PRACTICE
                ========================================== */}

                {!category && (
                    <section className="mb-8">

                        {/* POPULAR PRACTICE */}

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#DDE1E9]">
                                Popular Practice
                            </h3>

                            <p className="text-sm text-[#70798B] mt-1">
                                Start with one of the most common interview areas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {quickPracticeCategories.map((item) => {

                                const initials =
                                    item.label
                                        .split(" ")
                                        .map((word) => word[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() =>
                                            handleCategorySelect(item.value)
                                        }
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
                                                    {initials}
                                                </span>
                                            </div>

                                            <span className="text-[#4B5563] text-lg">
                                                →
                                            </span>

                                        </div>

                                        <h4 className="text-base font-semibold text-[#D8DCE5]">
                                            {item.label}
                                        </h4>

                                    </button>
                                );
                            })}
                        </div>

                        {/* RECENTLY PRACTICED */}

                        {recentPractice.length > 0 && (
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
                                    {recentPractice.map((item) => (
                                        <button
                                            key={item.interview_id}
                                            type="button"
                                            onClick={() => handleRecentPractice(item)}
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
                                                    {item.topic}
                                                </p>

                                                <p className="text-xs text-[#687184] mt-1 capitalize">
                                                    {item.difficulty} · {item.status}
                                                </p>
                                            </div>

                                            <span className="text-xs text-[#8B5CF6] shrink-0">
                                                Practice →
                                            </span>
                                        </button>
                                    ))}
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

                    {/* CATEGORY */}

                    <div className="mb-7">

                        <label
                            htmlFor="category"
                            className="block text-sm font-medium text-[#B8BFCC] mb-2"
                        >
                            Interview Category
                        </label>

                        <p className="text-xs text-[#697386] mb-3">
                            Choose the area you want to practice.
                        </p>

                        <select
                            id="category"
                            value={category}
                            onChange={(event) =>
                                handleCategorySelect(
                                    event.target.value
                                )
                            }
                            disabled={
                                categoriesLoading
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
                                cursor-pointer
                                disabled:opacity-50
                            "
                        >

                            <option value="">
                                {categoriesLoading
                                    ? "Loading categories..."
                                    : "Select a category"}
                            </option>

                            {categories.map(
                                (item) => (
                                    <option
                                        key={
                                            item.value
                                        }
                                        value={
                                            item.value
                                        }
                                        className="bg-[#11182B]"
                                    >
                                        {
                                            item.label
                                        }
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    {/* SELECTED CATEGORY */}

                    {currentCategory && (
                        <div
                            className="
                                flex
                                items-center
                                gap-3
                                mb-7
                                px-4
                                py-3
                                rounded-xl
                                bg-[#151D33]
                                border
                                border-[#2A3454]
                            "
                        >

                            <div
                                className="
                                    w-9
                                    h-9
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
                                    {currentCategory.label
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
                                        .toUpperCase()}
                                </span>
                            </div>

                            <div>

                                <p className="text-sm font-medium text-[#D8DCE5]">
                                    {
                                        currentCategory.label
                                    }
                                </p>

                                <p className="text-xs text-[#6F7889] mt-0.5">
                                    {
                                        currentCategory.description ||
                                        "Technical interview practice"
                                    }
                                </p>

                            </div>

                        </div>
                    )}

                    {/* TOPIC SEARCH */}

                    <div className="mb-7">

                        <label
                            htmlFor="topic-search"
                            className="block text-sm font-medium text-[#B8BFCC] mb-2"
                        >
                            Search Topic
                        </label>

                        <p className="text-xs text-[#697386] mb-3">
                            Search for a topic within your selected category.
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
                                value={topicSearch}
                                onChange={(event) => {
                                    const value =
                                        event.target
                                            .value;

                                    setTopicSearch(
                                        value
                                    );

                                    // Clear previously selected
                                    // topic if user starts typing again.
                                    setTopic("");

                                    setShowTopicResults(
                                        Boolean(
                                            value.trim()
                                        )
                                    );
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
                                disabled={!category}
                                placeholder={
                                    category
                                        ? "Search topics, e.g. tree, redis, process..."
                                        : "Select a category first"
                                }
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
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
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
                                category &&
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
                                                            topic ===
                                                            item;

                                                        return (
                                                            <button
                                                                key={
                                                                    item
                                                                }
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
                                                                    ${selected
                                                                        ? "bg-[#1E2540] text-[#C4B5FD]"
                                                                        : "text-[#B8BFCD] hover:bg-[#151D33] hover:text-[#E5E7EB]"
                                                                    }
                                                                `}
                                                            >

                                                                <span className="text-sm">
                                                                    {
                                                                        item
                                                                    }
                                                                </span>

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
                                                    Try another keyword within this category.
                                                </p>

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
                                    flex
                                    items-center
                                    justify-between
                                    gap-4
                                    px-4
                                    py-3
                                    rounded-xl
                                    bg-[#151D33]
                                    border
                                    border-[#303A56]
                                "
                            >

                                <div>

                                    <p className="text-[10px] uppercase tracking-widest text-[#687184]">
                                        Selected Topic
                                    </p>

                                    <p className="text-sm font-medium text-[#D8DCE5] mt-1 capitalize">
                                        {topic}
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setTopic("");
                                        setTopicSearch("");
                                        setTopics([]);
                                        setShowTopicResults(
                                            false
                                        );
                                    }}
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
                                    description: "Practice under interview pressure with a fixed time per question.",
                                    details: "Easy 3 min · Medium 5 min · Hard 8 min",
                                },
                                {
                                    value: "untimed",
                                    label: "No Timer",
                                    description: "Take your time and focus on understanding and explaining the solution.",
                                    details: "No question deadline",
                                },
                            ].map((item) => {
                                const selected = interviewMode === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setInterviewMode(item.value)}
                                        className={`text-left p-5 rounded-xl border transition duration-200 ${selected ? "bg-[#1A203A] border-[#6366F1]" : "bg-[#0D1425] border-[#293452] hover:border-[#39476D]"}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-sm font-semibold ${selected ? "text-[#C4B5FD]" : "text-[#C5CBD6]"}`}>
                                                {item.label}
                                            </span>
                                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? "border-[#8B5CF6]" : "border-[#46516D]"}`}>
                                                {selected && <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />}
                                            </span>
                                        </div>

                                        <p className="text-xs text-[#737C8E] leading-5">
                                            {item.description}
                                        </p>

                                        <p className="text-xs text-[#A78BFA] mt-3">
                                            {item.details}
                                        </p>
                                    </button>
                                );
                            })}
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
                            !category ||
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

        </div>
    );
}

export default CreateInterview;