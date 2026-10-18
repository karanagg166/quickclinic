import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-6xl font-extrabold text-blue-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-slate-300 text-sm mb-6">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        <Link
          to="/user/home"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
