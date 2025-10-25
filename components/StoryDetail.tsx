import React, { useState, useMemo } from 'react';
import type { Story, WordDetails } from '../types';
import StoryParser from './StoryParser';
import WordListModal from './WordListModal';
import { EyeIcon, EyeOffIcon, ListBulletIcon, AcademicCapIcon } from './Icons';


interface StoryDetailProps {
  story: Story;
  storyIndex: number;
  onWordClick: (word: string) => void;
  dictionary: Record<string, WordDetails>;
  onStartQuiz: (story: Story) => void;
  activeWord: string | null;
  learnedWords: string[];
  favoritedWords: string[];
}

const StoryDetail: React.FC<StoryDetailProps> = ({ story, storyIndex, onWordClick, dictionary, onStartQuiz, activeWord, learnedWords, favoritedWords }) => {
  const [showTranslations, setShowTranslations] = useState(true);
  const [isWordListOpen, setWordListOpen] = useState(false);

  const uniqueStoryWords = useMemo(() => {
    const wordRegex = /\b([a-zA-Z']+)\s*\([^)]+\)/g;
    const matches = story.content.matchAll(wordRegex);
    return [...new Set(Array.from(matches, match => match[1].toLowerCase()))];
  }, [story.content]);

  const learnedCount = useMemo(() => {
    return uniqueStoryWords.filter(word => learnedWords.includes(word)).length;
  }, [uniqueStoryWords, learnedWords]);

  const totalWords = uniqueStoryWords.length;
  const progressPercentage = totalWords > 0 ? (learnedCount / totalWords) * 100 : 0;

  return (
    <>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
          <div className="mb-6 border-b border-slate-200 pb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">{storyIndex + 1}. {story.title}</h1>
              
              {/* --- Learning Progress Bar --- */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="font-semibold text-slate-600">学习进度</span>
                  <span className="text-slate-500">{learnedCount} / {totalWords} 单词</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-start items-center gap-2 flex-wrap">
                 <button
                  onClick={() => onStartQuiz(story)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="开始测验"
                  title="开始测验"
                >
                  <AcademicCapIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">开始测验</span>
                </button>
                <button
                  onClick={() => setWordListOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="单词列表"
                  title="单词列表"
                >
                  <ListBulletIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">单词列表</span>
                </button>
                <button
                  onClick={() => setShowTranslations(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="切换模式"
                  title="切换模式"
                >
                  {showTranslations ? <EyeOffIcon /> : <EyeIcon />}
                  <span className="hidden sm:inline">{showTranslations ? '隐藏翻译' : '显示翻译'}</span>
                </button>
              </div>
          </div>
          <div className="text-lg leading-relaxed text-slate-600 whitespace-pre-line">
              <StoryParser 
                  text={story.content} 
                  onWordClick={onWordClick} 
                  showTranslations={showTranslations}
                  activeWord={activeWord}
                  learnedWords={learnedWords}
                  favoritedWords={favoritedWords}
              />
          </div>
      </div>
      {isWordListOpen && (
        <WordListModal
          words={uniqueStoryWords}
          onClose={() => setWordListOpen(false)}
          dictionary={dictionary}
        />
      )}
    </>
  );
};

export default StoryDetail;