import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { deleteInterview } from "../api/interview";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  // =========================================================
  // DASHBOARD STATE
  // =========================================================

  const [period, setPeriod] = useState("7d");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  // =========================================================
  // DELETE STATE
  // =========================================================

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // =========================================================
  // BULK SELECTION STATE
  // =========================================================

  const [selectedInterviewIds, setSelectedInterviewIds] =
    useState([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] =
    useState(false);

  const [bulkDeleting, setBulkDeleting] =
    useState(false);

  // =========================================================
  // REFRESH STATE
  // =========================================================

  const [refreshKey, setRefreshKey] = useState(0);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError("");

        const response = await fetch(
          `${API_URL}/dashboard/stats?period=${period}`,
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
            "Failed to load dashboard"
          );
        }

        console.log("DASHBOARD STATS:", data);

        setStats(data);
      } catch (err) {
        console.error(
          "DASHBOARD STATS ERROR:",
          err
        );

        setStatsError(
          err.message ||
          "Failed to load dashboard"
        );
      } finally {
        setLoadingStats(false);
      }
    };

    if (token) {
      loadDashboardStats();
    }
  }, [
    token,
    period,
    refreshKey,
    logout,
    navigate,
  ]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =========================================================
  // DELETE INTERVIEW
  // =========================================================

  const handleDeleteInterview = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setStatsError("");

      await deleteInterview(
        token,
        deleteTarget.id,
        logout
      );

      // Remove from local selection state
      setSelectedInterviewIds((previous) =>
        previous.filter(
          (id) => id !== deleteTarget.id
        )
      );

      // Remove interview from current state
      setStats((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          total_interviews: Math.max(
            0,
            (previous.total_interviews || 0) - 1
          ),

          completed_interviews:
            deleteTarget.status === "completed"
              ? Math.max(
                0,
                (previous.completed_interviews || 0) -
                1
              )
              : previous.completed_interviews,

          in_progress_interviews:
            deleteTarget.status === "in_progress"
              ? Math.max(
                0,
                (previous.in_progress_interviews || 0) -
                1
              )
              : previous.in_progress_interviews,

          not_started_interviews:
            deleteTarget.status === "created"
              ? Math.max(
                0,
                (previous.not_started_interviews || 0) -
                1
              )
              : previous.not_started_interviews,

          completed_list:
            (previous.completed_list || []).filter(
              (item) =>
                item.id !== deleteTarget.id
            ),

          in_progress_list:
            (previous.in_progress_list || []).filter(
              (item) =>
                item.id !== deleteTarget.id
            ),

          not_started_list:
            (previous.not_started_list || []).filter(
              (item) =>
                item.id !== deleteTarget.id
            ),
        };
      });

      setDeleteTarget(null);

      // Refresh dashboard so aggregate score is accurate
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      console.error(
        "DELETE INTERVIEW ERROR:",
        err
      );

      setStatsError(
        err.message ||
        "Failed to delete interview"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // BULK DELETE INTERVIEWS
  // =========================================================

  const handleBulkDelete = async () => {
    if (selectedInterviewIds.length === 0) {
      return;
    }

    try {
      setBulkDeleting(true);
      setStatsError("");

      const response = await fetch(
        `${API_URL}/interviews/bulk`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            interview_ids:
              selectedInterviewIds,
          }),
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
          "Failed to delete interviews"
        );
      }

      console.log(
        "BULK DELETE RESPONSE:",
        data
      );

      setSelectedInterviewIds([]);
      setBulkDeleteOpen(false);

      // Reload dashboard data
      setRefreshKey(
        (previous) => previous + 1
      );
    } catch (err) {
      console.error(
        "BULK DELETE ERROR:",
        err
      );

      setStatsError(
        err.message ||
        "Failed to delete interviews"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  // =========================================================
  // PERIOD LABEL
  // =========================================================

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Today";

      case "yesterday":
        return "Yesterday";

      case "30d":
        return "Last 30 Days";

      case "7d":
      default:
        return "Last 7 Days";
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    return new Date(
      dateString
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT TIME TAKEN
  // =========================================================

  const formatTimeTaken = (seconds) => {
    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "—";
    }

    const totalSeconds = Math.max(
      0,
      Number(seconds)
    );

    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const remainingSeconds =
      totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  // =========================================================
  // STATUS STYLES
  // =========================================================

  const getStatusStyles = (status) => {
    if (status === "completed") {
      return {
        wrapper:
          "bg-emerald-500/10 border-emerald-500/20",
        text: "text-emerald-400",
        label: "Completed",
      };
    }

    if (status === "in_progress") {
      return {
        wrapper:
          "bg-amber-500/10 border-amber-500/20",
        text: "text-amber-400",
        label: "In Progress",
      };
    }

    return {
      wrapper:
        "bg-[#1E2540] border-[#343D63]",
      text: "text-[#A5A9E8]",
      label: "Not Started",
    };
  };

  // =========================================================
  // SELECTED INTERVIEWS FOR CURRENT FILTER
  // =========================================================

  const getCurrentInterviewList = () => {
    if (!stats) {
      return [];
    }

    if (selectedStatus === "completed") {
      return stats.completed_list || [];
    }

    if (selectedStatus === "in_progress") {
      return stats.in_progress_list || [];
    }

    if (selectedStatus === "not_started") {
      return stats.not_started_list || [];
    }

    return [
      ...(stats.completed_list || []),
      ...(stats.in_progress_list || []),
      ...(stats.not_started_list || []),
    ].sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );
  };

  const currentInterviewList =
    getCurrentInterviewList();

  // =========================================================
  // SELECTION HELPERS
  // =========================================================

  const isInterviewSelected = (interviewId) => {
    return selectedInterviewIds.includes(
      interviewId
    );
  };

  const allVisibleSelected =
    currentInterviewList.length > 0 &&
    currentInterviewList.every((interview) =>
      selectedInterviewIds.includes(
        interview.id
      )
    );

  const someVisibleSelected =
    currentInterviewList.some((interview) =>
      selectedInterviewIds.includes(
        interview.id
      )
    );

  const handleToggleInterview = (
    interviewId
  ) => {
    setSelectedInterviewIds((previous) => {
      if (previous.includes(interviewId)) {
        return previous.filter(
          (id) => id !== interviewId
        );
      }

      return [
        ...previous,
        interviewId,
      ];
    });
  };

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedInterviewIds(
        (previous) =>
          previous.filter(
            (id) =>
              !currentInterviewList.some(
                (interview) =>
                  interview.id === id
              )
          )
      );

      return;
    }

    setSelectedInterviewIds((previous) => {
      const newIds = currentInterviewList.map(
        (interview) => interview.id
      );

      return Array.from(
        new Set([
          ...previous,
          ...newIds,
        ])
      );
    });
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setSelectedInterviewIds([]);
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    setSelectedStatus("all");
    setSelectedInterviewIds([]);
  };

  // =========================================================
  // CARD STYLE
  // =========================================================

  const getCardStyle = (status) => {
    const isSelected =
      selectedStatus === status;

    return `
      text-left
      bg-[#11182B]
      border
      rounded-xl
      p-6
      transition
      cursor-pointer
      ${isSelected
        ? "border-[#6366F1] shadow-lg shadow-indigo-950/20"
        : "border-[#252F4A] hover:border-[#3B4770]"
      }
    `;
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB]">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="border-b border-[#252F4A] bg-[#11182B]">

        <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">

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
                Practice smarter
              </p>

            </div>

          </div>

          <button
            onClick={handleLogout}
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
            Logout
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* ===================================================
            WELCOME
        ==================================================== */}

        <section className="mb-10">

          <p className="text-sm text-[#6B7280] mb-2">
            Welcome back
          </p>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#E5E7EB]">
            Prepare for your next interview.
          </h2>

          <p className="max-w-2xl text-[#81899A] mt-3 leading-7">
            Practice technical interviews with
            AI-generated questions, instant evaluation,
            and detailed performance insights.
          </p>

        </section>

        {/* ===================================================
            HERO
        ==================================================== */}

        <section
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
            p-8
            md:p-10
            mb-10
          "
        >

          <div
            className="
              absolute
              -top-24
              -right-24
              w-64
              h-64
              rounded-full
              bg-[#6366F1]/10
              blur-3xl
            "
          />

          <div className="relative max-w-3xl">

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-[#1E2540]
                border
                border-[#343D63]
                text-xs
                text-[#A5A9E8]
                mb-5
              "
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              AI-powered interview practice
            </div>

            <h3 className="text-2xl md:text-3xl font-semibold text-[#E5E7EB]">
              Ready for a mock interview?
            </h3>

            <p className="text-[#8B93A3] mt-3 max-w-xl leading-7">
              Choose a topic and difficulty level.
              Our AI will generate technical questions
              and evaluate your answers.
            </p>

            <button
              onClick={() =>
                navigate("/create-interview")
              }
              className="
                mt-7
                px-6
                py-3
                rounded-xl
                bg-gradient-to-r
                from-[#6366F1]
                to-[#8B5CF6]
                hover:from-[#7073F5]
                hover:to-[#9568F8]
                text-white
                font-semibold
                text-sm
                shadow-lg
                shadow-indigo-950/20
                transition
              "
            >
              Start New Interview →
            </button>

          </div>

        </section>

        {/* ===================================================
            PERIOD FILTER
        ==================================================== */}

        <section
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
            mb-5
          "
        >

          <div>

            <h3 className="text-lg font-semibold text-[#DDE1E9]">
              Interview Overview
            </h3>

            <p className="text-sm text-[#70798B] mt-1">
              Showing activity for{" "}
              {getPeriodLabel().toLowerCase()}.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <label
              htmlFor="period"
              className="text-xs uppercase tracking-widest text-[#687184]"
            >
              Period
            </label>

            <select
              id="period"
              value={period}
              onChange={(event) =>
                handlePeriodChange(
                  event.target.value
                )
              }
              className="
                rounded-xl
                bg-[#11182B]
                border
                border-[#303A56]
                px-4
                py-2.5
                text-sm
                text-[#D8DCE5]
                outline-none
                focus:border-[#6366F1]
                focus:ring-1
                focus:ring-[#6366F1]/20
                cursor-pointer
              "
            >
              <option value="today">
                Today
              </option>

              <option value="yesterday">
                Yesterday
              </option>

              <option value="7d">
                Last 7 Days
              </option>

              <option value="30d">
                Last 30 Days
              </option>
            </select>

          </div>

        </section>

        {/* ===================================================
            STATS
        ==================================================== */}

        <section
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-5
            gap-4
            mb-8
          "
        >

          {/* TOTAL */}

          <button
            type="button"
            onClick={() =>
              handleStatusChange("all")
            }
            className={getCardStyle("all")}
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              Total Interviews
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              {loadingStats
                ? "..."
                : stats?.total_interviews ?? 0}
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              All sessions
            </p>

          </button>

          {/* COMPLETED */}

          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "completed"
              )
            }
            className={getCardStyle(
              "completed"
            )}
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              Completed
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              {loadingStats
                ? "..."
                : stats?.completed_interviews ??
                0}
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              View completed
            </p>

          </button>

          {/* IN PROGRESS */}

          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "in_progress"
              )
            }
            className={getCardStyle(
              "in_progress"
            )}
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              In Progress
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              {loadingStats
                ? "..."
                : stats?.in_progress_interviews ??
                0}
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              Continue interviews
            </p>

          </button>

          {/* NOT STARTED */}

          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "not_started"
              )
            }
            className={getCardStyle(
              "not_started"
            )}
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              Not Started
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              {loadingStats
                ? "..."
                : stats?.not_started_interviews ??
                0}
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              Ready to start
            </p>

          </button>

          {/* AVERAGE SCORE */}

          <div
            className="
              bg-[#11182B]
              border
              border-[#252F4A]
              rounded-xl
              p-6
            "
          >

            <p className="text-xs uppercase tracking-widest text-[#687184]">
              Average Score
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              {loadingStats
                ? "..."
                : stats?.average_score !== null &&
                  stats?.average_score !==
                  undefined
                  ? `${stats.average_score}/10`
                  : "—"}
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              Evaluated answers
            </p>

          </div>

        </section>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {statsError && (
          <div
            className="
              mb-8
              rounded-xl
              border
              border-red-500/20
              bg-red-500/5
              px-5
              py-4
            "
          >

            <p className="text-sm text-red-400">
              Unable to load dashboard:{" "}
              {statsError}
            </p>

          </div>
        )}

        {/* ===================================================
            INTERVIEW LIST
        ==================================================== */}

        <section className="mb-12">

          {/* LIST HEADER */}

          <div
            className="
              flex
              flex-col
              md:flex-row
              md:items-end
              md:justify-between
              gap-4
              mb-5
            "
          >

            <div>

              <h3 className="text-lg font-semibold text-[#DDE1E9]">
                {selectedStatus === "all"
                  ? "All Interviews"
                  : selectedStatus ===
                    "completed"
                    ? "Completed Interviews"
                    : selectedStatus ===
                      "in_progress"
                      ? "In Progress Interviews"
                      : "Not Started Interviews"}
              </h3>

              <p className="text-sm text-[#70798B] mt-1">
                {currentInterviewList.length}{" "}
                interview
                {currentInterviewList.length !==
                  1
                  ? "s"
                  : ""}{" "}
                in{" "}
                {getPeriodLabel().toLowerCase()}.
              </p>

            </div>

            {/* BULK ACTION BAR */}

            {!loadingStats &&
              currentInterviewList.length >
              0 && (
                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={
                      handleSelectAll
                    }
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2
                      rounded-lg
                      border
                      border-[#303A56]
                      bg-[#11182B]
                      text-sm
                      text-[#B8BFCD]
                      hover:text-[#E5E7EB]
                      hover:border-[#46516E]
                      transition
                    "
                  >

                    <span
                      className="
                        inline-flex
                        items-center
                        justify-center
                        w-4
                        h-4
                        rounded
                        border
                        border-[#59647E]
                        text-[10px]
                      "
                    >
                      {allVisibleSelected
                        ? "✓"
                        : someVisibleSelected
                          ? "−"
                          : ""}
                    </span>

                    {allVisibleSelected
                      ? "Deselect All"
                      : "Select All"}

                  </button>

                  {selectedInterviewIds.length >
                    0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setBulkDeleteOpen(
                            true
                          )
                        }
                        className="
                        inline-flex
                        items-center
                        gap-2
                        px-4
                        py-2
                        rounded-lg
                        bg-red-500/10
                        border
                        border-red-500/20
                        text-sm
                        text-red-400
                        hover:bg-red-500/15
                        hover:text-red-300
                        transition
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 6h18"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 6l-1 14a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20L5 6"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 10v7"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 10v7"
                          />
                        </svg>

                        Delete Selected (
                        {
                          selectedInterviewIds.length
                        }
                        )

                      </button>
                    )}

                </div>
              )}

          </div>

          {/* LIST */}

          {loadingStats ? (

            <div
              className="
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-xl
                p-8
                text-center
              "
            >
              <p className="text-sm text-[#6F7889]">
                Loading interviews...
              </p>
            </div>

          ) : currentInterviewList.length ===
            0 ? (

            <div
              className="
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-xl
                p-8
                text-center
              "
            >

              <p className="text-sm text-[#8A93A4]">
                No interviews found for this
                selection.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/create-interview"
                  )
                }
                className="
                  mt-4
                  text-sm
                  text-[#A78BFA]
                  hover:text-[#C4B5FD]
                "
              >
                Start a new interview →
              </button>

            </div>

          ) : (

            <div
              className="
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-xl
                overflow-hidden
              "
            >

              {currentInterviewList.map(
                (interview, index) => {

                  const status =
                    getStatusStyles(
                      interview.status
                    );

                  const isCompleted =
                    interview.status ===
                    "completed";

                  const isSelected =
                    isInterviewSelected(
                      interview.id
                    );

                  return (
                    <div
                      key={interview.id}
                      className={`
                        px-6
                        py-5
                        transition
                        ${isSelected
                          ? "bg-[#151D33]"
                          : ""
                        }
                        ${index !==
                          currentInterviewList.length -
                          1
                          ? "border-b border-[#252F4A]"
                          : ""
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          flex-col
                          lg:flex-row
                          lg:items-center
                          lg:justify-between
                          gap-5
                        "
                      >

                        {/* LEFT */}

                        <div className="flex items-center gap-4 min-w-0">

                          {/* CHECKBOX */}

                          <label
                            className="
                              relative
                              inline-flex
                              items-center
                              justify-center
                              shrink-0
                              cursor-pointer
                            "
                          >

                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                handleToggleInterview(
                                  interview.id
                                )
                              }
                              className="
                                peer
                                sr-only
                              "
                            />

                            <span
                              className="
                                w-5
                                h-5
                                rounded-md
                                border
                                border-[#46516E]
                                bg-[#0B1020]
                                flex
                                items-center
                                justify-center
                                transition
                                peer-checked:bg-[#6366F1]
                                peer-checked:border-[#6366F1]
                                peer-focus:ring-2
                                peer-focus:ring-[#6366F1]/20
                              "
                            >

                              {isSelected && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="w-3.5 h-3.5 text-white"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 12.5l4 4L19 7"
                                  />
                                </svg>
                              )}

                            </span>

                          </label>

                          {/* NUMBER */}

                          <div
                            className="
                              w-10
                              h-10
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
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>
                          </div>

                          {/* INFO */}

                          <div className="min-w-0">

                            <p className="text-sm font-medium text-[#D8DCE5] capitalize truncate">
                              {interview.topic}
                            </p>

                            <p className="text-xs text-[#667083] mt-1 capitalize">
                              {
                                interview.difficulty
                              }
                              {" · "}
                              {formatDate(
                                interview.created_at
                              )}
                            </p>

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-4
                            lg:gap-6
                          "
                        >

                          {/* STATUS */}

                          <span
                            className={`
                              px-3
                              py-1.5
                              rounded-full
                              border
                              text-[11px]
                              font-medium
                              ${status.wrapper}
                              ${status.text}
                            `}
                          >
                            {status.label}
                          </span>

                          {/* SCORE */}

                          {isCompleted && (
                            <div>

                              <p className="text-[10px] uppercase tracking-widest text-[#596276]">
                                Score
                              </p>

                              <p className="text-sm font-semibold text-[#C4B5FD] mt-1">
                                {interview.average_score !==
                                  null &&
                                  interview.average_score !==
                                  undefined
                                  ? `${interview.average_score}/10`
                                  : "—"}
                              </p>

                            </div>
                          )}

                          {/* TIME */}

                          {isCompleted && (
                            <div>

                              <p className="text-[10px] uppercase tracking-widest text-[#596276]">
                                Time Taken
                              </p>

                              <p className="text-sm font-medium text-[#B8BFCD] mt-1">
                                {formatTimeTaken(
                                  interview.time_taken_seconds
                                )}
                              </p>

                            </div>
                          )}

                          {/* CREATED */}

                          {!isCompleted && (
                            <div>

                              <p className="text-[10px] uppercase tracking-widest text-[#596276]">
                                Created
                              </p>

                              <p className="text-sm font-medium text-[#B8BFCD] mt-1">
                                {formatDate(
                                  interview.created_at
                                )}
                              </p>

                            </div>
                          )}

                          {/* ACTION */}

                          <button
                            onClick={() => {

                              if (
                                isCompleted
                              ) {
                                navigate(
                                  `/interview/${interview.id}/result`
                                );
                              } else {
                                navigate(
                                  `/interview/${interview.id}`
                                );
                              }

                            }}
                            className="
                              text-sm
                              text-[#A78BFA]
                              hover:text-[#C4B5FD]
                              transition
                              whitespace-nowrap
                            "
                          >
                            {isCompleted
                              ? "View Results →"
                              : interview.status ===
                                "in_progress"
                                ? "Continue →"
                                : "Start Interview →"}
                          </button>

                          {/* DELETE */}

                          <button
                            onClick={() =>
                              setDeleteTarget(
                                interview
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              w-9
                              h-9
                              rounded-lg
                              text-red-400/80
                              hover:text-red-400
                              hover:bg-red-500/10
                              transition
                              cursor-pointer
                            "
                            title="Delete interview"
                            aria-label="Delete interview"
                          >

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="w-4.5 h-4.5"
                            >

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 6h18"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 6l-1 14a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20L5 6"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 10v7"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 10v7"
                              />

                            </svg>

                          </button>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* ===================================================
            QUICK START
        ==================================================== */}

        <section>

          <div className="mb-5">

            <h3 className="text-lg font-semibold text-[#DDE1E9]">
              Quick Start
            </h3>

            <p className="text-sm text-[#70798B] mt-1">
              Choose what you want to practice.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* DSA */}

            <button
              onClick={() =>
                navigate(
                  "/create-interview?category=dsa"
                )
              }
              className="
                text-left
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-xl
                p-6
                hover:border-[#3B4770]
                hover:bg-[#141C32]
                transition
              "
            >

              <div className="w-10 h-10 rounded-lg bg-[#20284A] border border-[#323D68] flex items-center justify-center mb-5">

                <span className="text-[#A5A9E8] font-semibold text-sm">
                  DS
                </span>

              </div>

              <h4 className="text-base font-semibold text-[#D8DCE5]">
                Data Structures
              </h4>

              <p className="text-sm text-[#737C8E] mt-2 leading-6">
                Practice arrays, trees, graphs, heaps,
                hash tables and more.
              </p>

              <p className="text-sm text-[#A78BFA] mt-4">
                Start practice →
              </p>

            </button>

            {/* BACKEND */}

            <button
              onClick={() =>
                navigate(
                  "/create-interview?category=backend"
                )
              }
              className="
                text-left
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-xl
                p-6
                hover:border-[#3B4770]
                hover:bg-[#141C32]
                transition
              "
            >

              <div className="w-10 h-10 rounded-lg bg-[#20284A] border border-[#323D68] flex items-center justify-center mb-5">

                <span className="text-[#A5A9E8] font-semibold text-sm">
                  BE
                </span>

              </div>

              <h4 className="text-base font-semibold text-[#D8DCE5]">
                Backend
              </h4>

              <p className="text-sm text-[#737C8E] mt-2 leading-6">
                Practice APIs, databases, distributed
                systems and backend concepts.
              </p>

              <p className="text-sm text-[#A78BFA] mt-4">
                Start practice →
              </p>

            </button>

            {/* SYSTEM DESIGN */}

            <button
              onClick={() =>
                navigate(
                  "/create-interview?category=system_design"
                )
              }
              className="
                text-left
                bg-[#11182B]
                border
                border-[#252F4A]
                rounded-xl
                p-6
                hover:border-[#3B4770]
                hover:bg-[#141C32]
                transition
              "
            >

              <div className="w-10 h-10 rounded-lg bg-[#20284A] border border-[#323D68] flex items-center justify-center mb-5">

                <span className="text-[#A5A9E8] font-semibold text-sm">
                  SD
                </span>

              </div>

              <h4 className="text-base font-semibold text-[#D8DCE5]">
                System Design
              </h4>

              <p className="text-sm text-[#737C8E] mt-2 leading-6">
                Practice scalability, caching, queues,
                databases and architecture.
              </p>

              <p className="text-sm text-[#A78BFA] mt-4">
                Start practice →
              </p>

            </button>

          </div>

        </section>

      </main>

      {/* =====================================================
          SINGLE DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteTarget && (

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
                  bg-red-500/10
                  border
                  border-red-500/20
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <span className="text-red-400 text-xl">
                  !
                </span>
              </div>

              <div>

                <h3 className="text-lg font-semibold text-[#E5E7EB]">
                  Delete Interview?
                </h3>

                <p className="text-sm text-[#9CA3AF] mt-2 leading-6">
                  Are you sure you want to permanently
                  delete this interview?
                </p>

              </div>

            </div>

            {/* INTERVIEW DETAILS */}

            <div
              className="
                mt-5
                bg-[#0B1020]
                border
                border-[#252F4A]
                rounded-xl
                p-4
              "
            >

              <p className="text-sm font-medium text-[#D8DCE5] capitalize">
                {deleteTarget.topic}
              </p>

              <p className="text-xs text-[#697387] mt-1 capitalize">
                {deleteTarget.difficulty}
                {" · "}
                {
                  getStatusStyles(
                    deleteTarget.status
                  ).label
                }
              </p>

            </div>

            <p className="text-xs text-red-400/80 mt-4 leading-5">
              This will permanently remove the interview,
              questions, answers, and AI evaluations.
            </p>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  border-[#293452]
                  text-[#9CA3AF]
                  hover:text-[#E5E7EB]
                  hover:bg-[#151D33]
                  disabled:opacity-50
                  text-sm
                  font-medium
                  transition
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  handleDeleteInterview
                }
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-red-500/90
                  hover:bg-red-500
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  text-white
                  font-semibold
                  text-sm
                  transition
                "
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Interview"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          BULK DELETE CONFIRMATION MODAL
      ====================================================== */}

      {bulkDeleteOpen && (

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
                  bg-red-500/10
                  border
                  border-red-500/20
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <span className="text-red-400 text-xl">
                  !
                </span>
              </div>

              <div>

                <h3 className="text-lg font-semibold text-[#E5E7EB]">
                  Delete Selected Interviews?
                </h3>

                <p className="text-sm text-[#9CA3AF] mt-2 leading-6">
                  You have selected{" "}
                  <span className="text-[#E5E7EB] font-semibold">
                    {
                      selectedInterviewIds.length
                    }
                  </span>{" "}
                  interview
                  {selectedInterviewIds.length !==
                    1
                    ? "s"
                    : ""}{" "}
                  for deletion.
                </p>

              </div>

            </div>

            <div
              className="
                mt-5
                bg-[#0B1020]
                border
                border-[#252F4A]
                rounded-xl
                p-4
              "
            >

              <p className="text-sm text-[#A7AFBF] leading-6">
                This action will permanently remove
                the selected interviews, their questions,
                answers, and AI evaluations.
              </p>

            </div>

            <p className="text-xs text-red-400/80 mt-4 leading-5">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setBulkDeleteOpen(false)
                }
                disabled={bulkDeleting}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  border-[#293452]
                  text-[#9CA3AF]
                  hover:text-[#E5E7EB]
                  hover:bg-[#151D33]
                  disabled:opacity-50
                  text-sm
                  font-medium
                  transition
                "
              >
                Cancel
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-red-500/90
                  hover:bg-red-500
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  text-white
                  font-semibold
                  text-sm
                  transition
                "
              >
                {bulkDeleting
                  ? "Deleting..."
                  : `Delete ${selectedInterviewIds.length} ${selectedInterviewIds.length === 1
                    ? "Interview"
                    : "Interviews"
                  }`}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;