import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB]">

      {/* =========================================
          NAVBAR
      ========================================= */}

      <header className="border-b border-[#252F4A] bg-[#11182B]">

        <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">

          {/* Brand */}

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


          {/* Logout */}

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


      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Welcome */}

        <section className="mb-10">

          <p className="text-sm text-[#6B7280] mb-2">
            Welcome back
          </p>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#E5E7EB]">
            Prepare for your next interview.
          </h2>

          <p className="max-w-2xl text-[#81899A] mt-3 leading-7">
            Practice technical interviews with AI-generated questions,
            instant evaluation, and detailed performance insights.
          </p>

        </section>


        {/* =========================================
            HERO / CREATE INTERVIEW
        ========================================= */}

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
            mb-8
          "
        >

          {/* Decorative glow */}

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

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E2540] border border-[#343D63] text-xs text-[#A5A9E8] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              AI-powered interview practice
            </div>

            <h3 className="text-2xl md:text-3xl font-semibold text-[#E5E7EB]">
              Ready for a mock interview?
            </h3>

            <p className="text-[#8B93A3] mt-3 max-w-xl leading-7">
              Choose a topic and difficulty level. Our AI will generate
              technical questions and evaluate your answers.
            </p>

            <button
              onClick={() => navigate("/create-interview")}
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
                duration-200
              "
            >
              Start New Interview →
            </button>

          </div>

        </section>


        {/* =========================================
            STATS
        ========================================= */}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

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
              Interviews
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              0
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              Completed
            </p>

          </div>


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
              —
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              Across interviews
            </p>

          </div>


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
              Questions
            </p>

            <p className="text-3xl font-semibold text-[#D8DCE5] mt-3">
              0
            </p>

            <p className="text-sm text-[#6F7889] mt-1">
              Answered
            </p>

          </div>

        </section>


        {/* =========================================
            QUICK START
        ========================================= */}

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
             onClick={() => navigate("/create-interview?category=dsa")}
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
                Practice arrays, trees, graphs, heaps, hash tables and more.
              </p>

              <p className="text-sm text-[#A78BFA] mt-4">
                Start practice →
              </p>

            </button>


            {/* Backend */}

            <button
              onClick={() => navigate("/create-interview?category=backend")}
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
                Practice APIs, databases, distributed systems and backend concepts.
              </p>

              <p className="text-sm text-[#A78BFA] mt-4">
                Start practice →
              </p>

            </button>


            {/* System Design */}

            <button
              onClick={() => navigate("/create-interview?category=system_design")}
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
                Practice scalability, caching, queues, databases and architecture.
              </p>

              <p className="text-sm text-[#A78BFA] mt-4">
                Start practice →
              </p>

            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;