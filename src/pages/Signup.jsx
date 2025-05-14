import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "../components/auth/AuthForm";

export default function SignupPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Gradient Background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#051937] via-[#004d7a] to-[#008793] items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <h2 className="text-3xl font-bold mb-8">
            Start your learning journey<br />with QuizWhiz today
          </h2>
          
          <div className="w-48 h-48 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-10 flex items-center justify-center border border-white/30 shadow-xl">
            <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <div className="text-3xl font-bold mb-4">QuizWhiz</div>
          <p className="text-blue-100/80">Create flashcards, take quizzes, track your progress</p>
        </div>
      </div>
      
      {/* Right Panel - Sign Up Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Already have an account?
            </button>
            <div className="text-2xl font-bold text-gray-800">Sign Up</div>
          </div>
          
          <AuthForm type="signup" />
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 