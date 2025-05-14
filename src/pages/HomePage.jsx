import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const HomePage = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 via-orange-500 to-yellow-400 opacity-90"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-20"></div>
          
          {/* Decorative circles */}
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-600/30 backdrop-blur-sm"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-yellow-500/30 backdrop-blur-sm"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              QuizWhiz
            </h1>
            <p className="mt-6 max-w-xl mx-auto text-xl text-white/80">
              Accelerate your knowledge with interactive study tools. Create, learn, and master any subject with our intuitive learning tools.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                  <Link
                    to="/login"
                    className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              A better way to learn
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Create flashcards, take quizzes, and track your progress all in one place.
            </p>
          </div>

          <div className="relative mt-12 lg:mt-20 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-center">
            <div className="mt-10 space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:mt-0 lg:col-span-3">
              {[
                {
                  name: 'Flashcards',
                  description: 'Create, organize, and study flashcards for any subject.',
                  icon: (
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  ),
                },
                {
                  name: 'Quizzes',
                  description: 'Test your knowledge with interactive quizzes and get instant feedback.',
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ),
                },
                {
                  name: 'Progress Tracking',
                  description: 'Monitor your learning journey with detailed statistics and progress reports.',
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  ),
                },
                {
                  name: 'Achievements',
                  description: 'Earn badges and rewards as you make progress in your learning journey.',
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  ),
                },
              ].map((feature) => (
                <div key={feature.name} className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-purple-600 to-orange-500 text-white">
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        {feature.icon}
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-lg leading-6 font-medium text-gray-900">{feature.name}</dt>
                    <dd className="mt-2 text-base text-gray-500">{feature.description}</dd>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-tr from-purple-800 via-orange-500 to-yellow-400">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to boost your learning?</span>
            <span className="block">Start using QuizWhiz today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-white/80">
            Join thousands of students who are already using QuizWhiz to accelerate their learning and mastery.
          </p>
          <Link
            to="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 sm:w-auto transition-colors duration-200"
          >
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 