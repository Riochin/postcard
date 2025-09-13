"use client";

import { useState } from "react";
import { readRootGet } from "@/src/api";

export default function ApiTestPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const testRootEndpoint = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await readRootGet();

      // Handle different response types
      if (typeof response.data === "string") {
        // If response is HTML or text
        setResult(
          `Response Type: ${typeof response.data}\n\n${response.data.substring(0, 500)}${response.data.length > 500 ? "..." : ""}`,
        );
      } else {
        // If response is JSON
        setResult(JSON.stringify(response.data, null, 2));
      }
    } catch (err: any) {
      // More detailed error information
      const errorMessage = err.message || "Unknown error";
      const statusCode = err.status || "Unknown";
      const errorDetails = err.response?.data || "No additional details";

      setError(
        `Status: ${statusCode}\nMessage: ${errorMessage}\nDetails: ${JSON.stringify(errorDetails, null, 2)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">API Test</h1>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-4">Testing connection to:</p>
          <p className="text-xs bg-gray-100 p-2 rounded break-all">
            http://postcard-dev-alb-437445372.us-east-1.elb.amazonaws.com
          </p>
        </div>

        <button
          onClick={testRootEndpoint}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? "Testing..." : "Test GET /"}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium mb-2">Error Details:</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto border whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        {result && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium mb-2">Response:</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto border whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
