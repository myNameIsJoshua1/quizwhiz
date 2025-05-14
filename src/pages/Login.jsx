// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { AuthForm } from "../components/auth/AuthForm";

// export default function LoginPage() {
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");

//   // Redirect if already logged in
//   useEffect(() => {
//     if (token) {
//       navigate("/dashboard");
//     }
//   }, [token, navigate]);

//   return (
//     <div className="flex min-h-screen">
//       {/* Left Panel - Gradient Background */}
//       <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#051937] via-[#004d7a] to-[#008793] items-center justify-center p-12">
//         <div className="max-w-md text-center text-white">
//           <h2 className="text-3xl font-bold mb-8">
//             Welcome back to<br />your learning journey
//           </h2>
          
//           <div className="w-48 h-48 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-10 flex items-center justify-center border border-white/30 shadow-xl">
//             <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//             </svg>
//           </div>
          
//           <div className="text-3xl font-bold mb-4">QuizWhiz</div>
//           <p className="text-blue-100/80">Your personal flashcard and quiz assistant</p>
//         </div>
//       </div>
      
//       {/* Right Panel - Login Form */}
//       <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
//         <div className="w-full max-w-md space-y-8 px-4">
//           <div className="flex justify-between items-center mb-8">
//             <button 
//               onClick={() => navigate("/signup")}
//               className="text-sm font-medium text-blue-600 hover:text-blue-800"
//             >
//               Create account
//             </button>
//             <div className="text-2xl font-bold text-gray-800">Log In</div>
//           </div>
          
//           <AuthForm type="login" />
          
//           <div className="mt-8 text-center">
//             <button 
//               onClick={() => navigate("/")}
//               className="text-sm text-gray-500 hover:text-gray-700"
//             >
//               ← Back to home
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// } 