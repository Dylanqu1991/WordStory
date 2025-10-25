import React from 'react';

interface StoryParserProps {
  text: string;
  onWordClick: (word: string) => void;
  showTranslations: boolean;
  activeWord: string | null;
  learnedWords: string[];
  favoritedWords: string[];
}

const StoryParser: React.FC<StoryParserProps> = ({ text, onWordClick, showTranslations, activeWord, learnedWords, favoritedWords }) => {
  const wordRegex = /(\b[a-zA-Z']+\s*\([^)]+\))/g;
  const parts = text.split(wordRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(wordRegex)) {
          const wordMatch = part.match(/\b([a-zA-Z']+)\s*\(([^)]+)\)/);
          if (wordMatch) {
            const englishWord = wordMatch[1];
            const lowerCaseWord = englishWord.toLowerCase();
            const chineseTranslation = wordMatch[2];

            const isActive = activeWord && lowerCaseWord === activeWord.toLowerCase();
            const isFavorited = favoritedWords.includes(lowerCaseWord);
            const isLearned = learnedWords.includes(lowerCaseWord);

            let className = 'cursor-pointer hover:underline transition-colors';
            let prefix = null;

            if (isFavorited) {
              className += ' font-bold text-yellow-500 hover:text-yellow-600';
              prefix = <span className="text-yellow-400 mr-0.5">★</span>;
            } else if (isLearned) {
              className += ' font-medium text-blue-400 hover:text-blue-600';
            } else {
              className += ' font-bold text-blue-600 hover:text-blue-800';
            }

            if (isActive) {
              className += ' bg-blue-200 rounded';
            }

            return (
              <React.Fragment key={index}>
                <span
                  onClick={() => onWordClick(englishWord)}
                  className={className}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onWordClick(englishWord)}
                >
                  {prefix}{englishWord}
                </span>
                {showTranslations && <span className="text-slate-500/90"> ({chineseTranslation})</span>}
              </React.Fragment>
            );
          }
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default StoryParser;
