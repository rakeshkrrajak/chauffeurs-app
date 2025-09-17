

import React, { useState, useCallback } from 'react';
import { Vehicle, GroundingChunk } from '../types';
import { getMaintenanceAdviceFromGemini } from '../services/geminiService';
import { CogIcon } from '../constants';

interface GeminiMaintenanceAdvisorProps {
  vehicle: Vehicle;
}

const GeminiMaintenanceAdvisor: React.FC<GeminiMaintenanceAdvisorProps> = ({ vehicle }) => {
  const [advice, setAdvice] = useState<string[] | null>(null);
  const [sources, setSources] = useState<GroundingChunk[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAdvice(null);
    setSources(null);

    const result = await getMaintenanceAdviceFromGemini(
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.mileage
    );

    if (result.error) {
      setError(result.error);
    } else {
      setAdvice(result.advice);
      setSources(result.sources);
    }
    setIsLoading(false);
  }, [vehicle]);

  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-xl shadow-xl">
      <h3 className="text-xl font-semibold text-gray-100 mb-3 flex items-center">
        <CogIcon className="w-6 h-6 mr-2 text-sky-400" />
        AI Maintenance Advisor
      </h3>
      <p className="text-sm text-gray-400 mb-5">
        Get AI-powered maintenance suggestions for this {vehicle.make} {vehicle.model} ({vehicle.year}) with {vehicle.mileage.toLocaleString()} km.
      </p>
      <button
        onClick={fetchAdvice}
        disabled={isLoading}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching Advice...
          </>
        ) : (
          'Get Maintenance Advice'
        )}
      </button>

      {error && (
        <div className="mt-5 p-4 bg-red-900 bg-opacity-30 text-red-300 border border-red-700 rounded-lg text-sm">
          <strong className="font-semibold">Error:</strong> {error}
          {error.includes("API Key") && <p className="mt-1">Please ensure your Gemini API Key is correctly configured.</p>}
        </div>
      )}

      {advice && advice.length > 0 && (
        <div className="mt-5 p-5 bg-gray-700 border border-gray-600 rounded-lg">
          <h4 className="font-semibold text-gray-100 text-base">Gemini's Advice:</h4>
          <ul className="list-disc pl-5 space-y-2 mt-2 text-sm text-gray-300">
            {advice.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      
      {sources && sources.length > 0 && (
        <div className="mt-4 p-4 bg-sky-900 bg-opacity-30 border border-sky-700 rounded-lg">
          <h5 className="font-semibold text-sky-300 text-sm">Information Sources (from Google Search):</h5>
          <ul className="list-disc list-inside mt-2 text-xs text-sky-400 space-y-1">
            {sources.map((source, index) => {
              const uri = source.web?.uri || source.retrievedContext?.uri;
              const title = source.web?.title || source.retrievedContext?.title;
              if (uri) {
                return (
                  <li key={index}>
                    <a href={uri} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-sky-200 transition-colors">
                      {title || uri}
                    </a>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GeminiMaintenanceAdvisor;