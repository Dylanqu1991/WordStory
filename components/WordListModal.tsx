import React from 'react';
import type { WordDetails } from '../types';
import { SpeakerIcon, CloseIcon } from './Icons';

// Sub-component for a single word in the list
interface WordListItemProps {
  word: string;
  dictionary: Record<string, WordDetails>;
}
const WordListItem: React.FC<WordListItemProps> = ({ word, dictionary }) => {
  const details = dictionary[word.toLowerCase()];

  const playSound = () => {
    if (!details?.word) return;
    const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(details.word)}`;
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Error playing audio:", e));
  };
  
  if (!details) {
    return (
      <li className="flex items-center justify-between p-4">
        <span className="font-semibold capitalize text-slate-700">{word}</span>
        <span className="text-sm text-red-500">Definition not found.</span>
      </li>
    );
  }

  return (
    <li className="p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold capitalize text-xl text-slate-800">{details.word}</p>
          <p className="text-slate-500">{details.phonetic}</p>
          <button
            onClick={playSound}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={`Play pronunciation for ${details.word}`}
          >
            <SpeakerIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {details.definitions.length > 0 ? (
            details.definitions.map((def, i) => (
              <div key={i} className="flex text-sm">
                <span className="font-semibold text-blue-600 w-12 shrink-0">{def.partOfSpeech}</span>
                <span className="text-slate-600">{def.meaning}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No definition available</p>
          )}
        </div>
      </div>
    </li>
  );
};


// Main Modal Component
interface WordListModalProps {
  words: string[];
  onClose: () => void;
  dictionary: Record<string, WordDetails>;
}

const WordListModal: React.FC<WordListModalProps> = ({ words, onClose, dictionary }) => {
  // FIX: Using Array.from is a more robust way to convert a Set to an array,
  // which resolves type inference issues with the spread operator in some TypeScript environments.
  const uniqueWords: string[] = Array.from(new Set(words.map(w => w.toLowerCase())));
  const sortedWords = uniqueWords.sort((a, b) => a.localeCompare(b));
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-slate-800">单词列表 ({sortedWords.length})</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close word list"
          >
            <CloseIcon />
          </button>
        </header>
        
        <div className="flex-grow overflow-y-auto">
          {sortedWords.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {sortedWords.map((word, index) => (
                <WordListItem key={`${word}-${index}`} word={word} dictionary={dictionary} />
              ))}
            </ul>
          ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No words found in this story.</p>
             </div>
          )}
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WordListModal;