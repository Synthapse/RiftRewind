import React from 'react';

export function formatAnalysisText(text: string): React.ReactNode[] {
  if (!text) return [];
  
  return text.split('\n').map((line, index) => {
    // Handle headers
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} className="text-4xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
          {line.substring(2)}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6">
          {line.substring(3)}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">
          {line.substring(4)}
        </h3>
      );
    }
    if (line.startsWith('#### ')) {
      return (
        <h4 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-3">
          {line.substring(5)}
        </h4>
      );
    }
    
    // Handle bold text with colons
    if (line.includes('**') && line.includes(':')) {
      const parts = line.split('**');
      return (
        <p key={index} className="mb-3">
          <strong className="font-semibold text-gray-900 dark:text-white text-lg">
            {parts[1]}:
          </strong>
          {parts[2] && <span className="ml-2">{parts[2]}</span>}
        </p>
      );
    }
    
    // Handle bullet points
    if (line.startsWith('- ')) {
      return (
        <li key={index} className="ml-6 mb-2 list-disc text-gray-700 dark:text-gray-300">
          {line.substring(2)}
        </li>
      );
    }
    
    // Handle numbered lists
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={index} className="ml-6 mb-2 list-decimal text-gray-700 dark:text-gray-300">
          {line.replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    
    // Handle empty lines
    if (line.trim() === '') {
      return <br key={index} />;
    }
    
    // Handle regular paragraphs
    return (
      <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
        {line}
      </p>
    );
  });
}

