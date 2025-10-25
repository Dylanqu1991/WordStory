import React from 'react';
import type { VocabularyLibrary } from '../types';
import { BookOpenIcon } from './Icons';

interface LibrarySelectionProps {
  libraries: VocabularyLibrary[];
  onSelectLibrary: (id: string) => void;
}

const LibrarySelection: React.FC<LibrarySelectionProps> = ({ libraries, onSelectLibrary }) => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">看故事背单词</h1>
      <p className="text-slate-500 mb-8">
        <span className="font-semibold">提示：</span>选择一个词库开始学习。词库下可能有多个系列的故事集，每个系列故事包含的词汇一样，仅故事风格不一样。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {libraries.map((lib) => (
          <button
            key={lib.id}
            onClick={() => onSelectLibrary(lib.id)}
            className="text-left bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-start gap-4">
               <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <BookOpenIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-700">{lib.title}</h2>
                <p className="text-slate-500 mt-1">{lib.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LibrarySelection;