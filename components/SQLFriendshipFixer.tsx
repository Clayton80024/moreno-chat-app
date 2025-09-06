"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function SQLFriendshipFixer() {
  const { user } = useAuth();
  const [showSQL, setShowSQL] = useState(false);

  if (!user) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <p className="text-yellow-800">Please log in to see SQL fix</p>
    </div>;
  }

  return (
    <div className="p-6 bg-blue-100 dark:bg-blue-900 border border-blue-400 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          🔧 SQL Fix for Friendship Issue
        </h3>
        <button
          onClick={() => setShowSQL(!showSQL)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showSQL ? 'Hide SQL' : 'Show SQL'}
        </button>
      </div>

      <div className="text-sm text-blue-800 dark:text-blue-200 mb-4">
        <p><strong>Issue:</strong> First friendship created successfully, second one failed with empty error.</p>
        <p><strong>Solution:</strong> Use SQL to create the friendship directly in the database.</p>
      </div>

      {showSQL && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">SQL Commands to Run in Supabase:</h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">1. First, check if friendship exists:</p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`SELECT 
  'Jackie as user' as relationship_type,
  f.*
FROM friends f
WHERE f.user_id = '941700bd-5410-4e22-8e39-e6f3aa2ae15f'
  AND f.friend_id = '82b6db52-6370-4320-8ddf-653bd23bf192'

UNION ALL

SELECT 
  'Jackie as friend' as relationship_type,
  f.*
FROM friends f
WHERE f.user_id = '82b6db52-6370-4320-8ddf-653bd23bf192'
  AND f.friend_id = '941700bd-5410-4e22-8e39-e6f3aa2ae15f';`}
              </pre>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">2. If no results, create the friendship:</p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`INSERT INTO friends (user_id, friend_id, status, created_at)
VALUES 
  ('941700bd-5410-4e22-8e39-e6f3aa2ae15f', '82b6db52-6370-4320-8ddf-653bd23bf192', 'accepted', NOW()),
  ('82b6db52-6370-4320-8ddf-653bd23bf192', '941700bd-5410-4e22-8e39-e6f3aa2ae15f', 'accepted', NOW());`}
              </pre>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">3. Verify the friendship was created:</p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
{`SELECT 
  f.*,
  up.full_name as friend_name
FROM friends f
LEFT JOIN user_profiles up ON up.id = f.friend_id
WHERE f.user_id = '941700bd-5410-4e22-8e39-e6f3aa2ae15f'
ORDER BY f.created_at DESC;`}
              </pre>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Instructions:</strong>
            </p>
            <ol className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 list-decimal list-inside space-y-1">
              <li>Go to Supabase Dashboard → SQL Editor</li>
              <li>Run the first query to check if friendship exists</li>
              <li>If no results, run the second query to create friendship</li>
              <li>Run the third query to verify it was created</li>
              <li>Refresh your app - the friend should now appear!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
