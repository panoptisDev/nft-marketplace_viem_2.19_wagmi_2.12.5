//@ts-nocheck

import React from "react";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

const NotFound: React.FC<ErrorProps> = ({ error, reset }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-nft-gray-3 dark:text-white p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Page not found</h1>
      <p className="text-lg text-nft-black-1 dark:text-[#CBCFCE] my-4">
        Please try refreshing the page, or go back to the homepage.
      </p>
      <div>
        <button
          onClick={reset}
          className="m-3 bg-nft-red-violet text-[#082622] font-medium text-sm p-3 rounded-lg hover:opacity-80 "
        >
          Try Again
        </button>
        <a
          href="/"
           className="m-3 bg-nft-gray-2 text-[#082622] font-medium text-sm p-3 rounded-lg hover:opacity-80 "
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
};

export default NotFound;