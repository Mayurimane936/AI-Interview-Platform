import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await registerUser({
        name,
        email,
        password,
      });

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E5E7EB] flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">

          <div
            className="
              w-14
              h-14
              mx-auto
              rounded-2xl
              bg-gradient-to-br
              from-[#6366F1]
              to-[#8B5CF6]
              flex
              items-center
              justify-center
              shadow-lg
              shadow-indigo-950/30
              mb-5
            "
          >
            <span className="text-white font-bold text-lg">
              AI
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-[#E5E7EB]">
            AI Interview Platform
          </h1>

          <p className="text-sm text-[#6B7280] mt-2">
            Build confidence before your next interview.
          </p>

        </div>


        {/* Register Card */}
        <div
          className="
            bg-[#11182B]
            border
            border-[#252F4A]
            rounded-2xl
            p-8
            shadow-2xl
          "
        >

          <div className="mb-7">

            <h2 className="text-xl font-semibold text-[#DDE1E9]">
              Create your account
            </h2>

            <p className="text-sm text-[#737C8E] mt-2">
              Start practicing with AI-powered interviews.
            </p>

          </div>


          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>

              <label className="block text-sm text-[#A8AFBD] mb-2">
                Name
              </label>

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="
                  w-full
                  bg-[#0B1020]
                  border
                  border-[#293452]
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  text-[#D8DCE5]
                  placeholder:text-[#545D70]
                  outline-none
                  focus:border-[#6366F1]
                  focus:ring-1
                  focus:ring-[#6366F1]/30
                  transition
                "
              />

            </div>


            {/* Email */}
            <div>

              <label className="block text-sm text-[#A8AFBD] mb-2">
                Email
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full
                  bg-[#0B1020]
                  border
                  border-[#293452]
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  text-[#D8DCE5]
                  placeholder:text-[#545D70]
                  outline-none
                  focus:border-[#6366F1]
                  focus:ring-1
                  focus:ring-[#6366F1]/30
                  transition
                "
              />

            </div>


            {/* Password */}
            <div>

              <label className="block text-sm text-[#A8AFBD] mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  w-full
                  bg-[#0B1020]
                  border
                  border-[#293452]
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  text-[#D8DCE5]
                  placeholder:text-[#545D70]
                  outline-none
                  focus:border-[#6366F1]
                  focus:ring-1
                  focus:ring-[#6366F1]/30
                  transition
                "
              />

            </div>


            {/* Error */}
            {error && (
              <div
                className="
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


            {/* Success */}
            {success && (
              <div
                className="
                  rounded-xl
                  border
                  border-emerald-500/20
                  bg-emerald-500/5
                  px-4
                  py-3
                "
              >
                <p className="text-sm text-emerald-400">
                  {success}
                </p>
              </div>
            )}


            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
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
                transition
                duration-200
                shadow-lg
                shadow-indigo-950/20
              "
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>


          {/* Login link */}
          <div className="mt-7 text-center">

            <p className="text-sm text-[#697386]">

              Already have an account?{" "}

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="
                  text-[#A78BFA]
                  hover:text-[#C4B5FD]
                  font-medium
                  transition
                "
              >
                Sign in
              </button>

            </p>

          </div>

        </div>


        <p className="text-center text-xs text-[#50596B] mt-6">
          Secure AI-powered technical interview practice
        </p>

      </div>

    </div>
  );
}

export default Register;