import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { WordDetails, Story } from '../types';
import { SpeakerIcon, CloseIcon, StarIcon, BookmarkIcon, AcademicCapIcon, TrashIcon } from './Icons';

interface WordModalProps {
  details: WordDetails | null;
  wordForDisplay: string | null;
  isLoading: boolean;
  onClose: () => void;
  onToggleFavorite: (word: string) => void;
  isFavorited: boolean;
}

const WordModal: React.FC<WordModalProps> = ({ details, wordForDisplay, isLoading, onClose, onToggleFavorite, isFavorited }) => {
  
  const playSound = () => {
    if (!details?.word) return;
    const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(details.word)}`;
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Error playing audio:", e));
  };

  const highlightWord = (sentence: string, wordToHighlight: string) => {
    if (!wordToHighlight) return sentence;
    
    // Escape special characters for regex
    const escapedWord = wordToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(\\b${escapedWord}\\b)`, 'gi');
    const parts = sentence.split(regex);
    
    return (
        <>
            {parts.map((part, index) => 
                part.toLowerCase() === wordToHighlight.toLowerCase() ? (
                    <strong key={index} className="font-bold text-blue-600 bg-blue-100/50 px-1 rounded-md">{part}</strong>
                ) : (
                    part
                )
            )}
        </>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close word details"
        >
          <CloseIcon />
        </button>
        
        {isLoading && (
          <div className="flex flex-col justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-500">Fetching definition for "{wordForDisplay}"...</p>
          </div>
        )}
        
        {!isLoading && !details && (
            <div className="flex justify-center items-center h-48">
                <p className="text-red-500 text-center px-4">
                    Definition for "<strong>{wordForDisplay}</strong>" could not be found.
                    <br />
                    <span className="text-sm text-slate-500">The API may not have an entry for this word.</span>
                </p>
            </div>
        )}
        
        {!isLoading && details && (
          <div className="space-y-6">
            <div>
              <div className="flex items-start gap-3">
                 <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-bold text-slate-800 capitalize break-words">{details.word}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-slate-500">{details.phonetic}</p>
                      <button
                      onClick={playSound}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      aria-label="Play pronunciation"
                      >
                      <SpeakerIcon className="w-5 h-5" />
                      </button>
                    </div>
                </div>
                <button
                    onClick={() => onToggleFavorite(details.word)}
                    className={`p-2 rounded-full transition-colors ${
                        isFavorited
                        ? 'text-yellow-400 hover:bg-yellow-100'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    aria-label={isFavorited ? 'Remove from notebook' : 'Add to notebook'}
                    title={isFavorited ? 'Remove from notebook' : 'Add to notebook'}
                >
                    <StarIcon className="w-6 h-6" filled={isFavorited} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Definitions</h3>
              <ul className="space-y-2">
                {details.definitions.map((def, i) => (
                  <li key={i} className="flex items-start">
                    <span className="font-semibold text-blue-600 w-12 shrink-0">{def.partOfSpeech}</span>
                    <span className="text-slate-600">{def.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {details.examples && details.examples.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Examples</h3>
                  <ul className="space-y-4 text-slate-600">
                    {details.examples.map((ex, i) => (
                      <li key={i}>
                        <p>{highlightWord(ex.english, details.word)}</p>
                        <p className="text-sm text-slate-500 mt-1">{ex.chinese}</p>
                      </li>
                    ))}
                  </ul>
                </div>
            )}
          </div>
        )}
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

export default WordModal;


// =================================================================
// NOTEBOOK MODAL
// =================================================================
interface NotebookModalProps {
  words: string[];
  onClose: () => void;
  dictionary: Record<string, WordDetails>;
  onToggleFavorite: (word: string) => void;
  onWordClick: (word: string) => void;
  onStartQuiz: () => void;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({ words, onClose, dictionary, onToggleFavorite, onWordClick, onStartQuiz }) => {
  const sortedWords = [...words].sort((a, b) => a.localeCompare(b));

  const playSound = (wordToPlay: string) => {
    if (!wordToPlay) return;
    const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(wordToPlay)}`;
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Error playing audio:", e));
  };
  
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
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">我的生词本 ({sortedWords.length})</h2>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={onStartQuiz} className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm font-semibold">
                <AcademicCapIcon className="w-5 h-5" />
                <span>开始测验</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close notebook"><CloseIcon /></button>
          </div>
        </header>
        
        <div className="flex-grow overflow-y-auto">
          {sortedWords.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {sortedWords.map((word) => {
                const details = dictionary[word.toLowerCase()];
                if (!details) return null;
                return (
                  <li key={word} className="p-4 flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                          <p className="font-bold capitalize text-lg text-slate-800">{details.word}</p>
                          <p className="text-slate-500">{details.phonetic}</p>
                           <button onClick={() => playSound(details.word)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                <SpeakerIcon className="w-4 h-4"/>
                           </button>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {details.definitions.slice(0, 3).map(def => `${def.partOfSpeech} ${def.meaning}`).join('; ')}
                      </div>
                    </div>
                    <button 
                      onClick={() => onToggleFavorite(word)} 
                      className="p-2 text-slate-400 hover:text-red-500"
                      title="Remove from notebook"
                    >
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
             <div className="flex items-center justify-center h-full text-center text-slate-500">
                <div>
                    <p>生词本是空的。</p>
                    <p className="text-sm mt-1">在单词弹窗中点击星星 ☆ 即可收藏。</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};


// =================================================================
// QUIZ MODAL
// =================================================================
interface QuizModalProps {
  words: string[];
  title: string;
  dictionary: Record<string, WordDetails>;
  onEndQuiz: (correctlyAnsweredWords: string[], incorrectlyAnsweredWords: string[]) => void;
  soundUrls: { correct: string, wrong: string };
}

type Question = {
  word: string;
  correctAnswer: string;
  options: string[];
};

export const QuizModal: React.FC<QuizModalProps> = ({ words, title, dictionary, onEndQuiz, soundUrls }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<{ selected: string, correct: string } | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
    
    const validQuizWords = uniqueWords.filter((word: string) => 
        dictionary[word] && dictionary[word].definitions.length > 0
    );

    if (validQuizWords.length < 2) {
      setQuestions([]);
      return;
    }

    const generatedQuestions = validQuizWords
      .map((word: string) => {
        const details = dictionary[word];
        if (!details) return null;

        const correctAnswer = details.definitions[0].meaning;
        const numDistractors = Math.min(3, validQuizWords.length - 1);
        
        const distractors = validQuizWords
          .filter((w: string) => w !== word)
          .sort(() => 0.5 - Math.random())
          .slice(0, numDistractors)
          .map((w: string) => dictionary[w].definitions[0].meaning);
        
        if (distractors.length < numDistractors) return null;

        const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());
        return { word, correctAnswer, options };
      })
      .filter((q): q is Question => q !== null)
      .sort(() => 0.5 - Math.random());
      
    setQuestions(generatedQuestions);
  }, [words, dictionary]);

  useEffect(() => {
    if (modalContainerRef.current) {
      modalContainerRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const playSound = (wordToPlay: string) => {
      if (!wordToPlay) return;
      const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(wordToPlay)}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.error("Error playing audio:", e));
  };
  
  const playSoundFeedback = (isCorrect: boolean) => {
    try {
      const audioUrl = isCorrect ? soundUrls.correct : soundUrls.wrong;
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.error(`Audio feedback failed for ${audioUrl}:`, e));
    } catch (e) {
      console.error("Audio feedback failed:", e);
    }
  };

  const handleAnswer = (answer: string) => {
    if (feedback) return; // Prevent answering again while feedback is shown

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    playSoundFeedback(isCorrect);
    
    setUserAnswers(prev => [...prev, answer]);
    setFeedback({ selected: answer, correct: currentQuestion.correctAnswer });
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
    } else {
        setIsFinished(true);
    }
  };
  
  const score = useMemo(() => {
    return userAnswers.reduce((acc, answer, index) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [userAnswers, questions]);

  const currentQuestion = questions[currentQuestionIndex];
  
  const handleCloseAndReport = () => {
    const correctlyAnsweredWords = questions
        .filter((q, index) => userAnswers[index] === q.correctAnswer)
        .map(q => q.word);
    const incorrectlyAnsweredWords = questions
        .filter((q, index) => userAnswers.length > index && userAnswers[index] !== q.correctAnswer)
        .map(q => q.word);
    onEndQuiz(correctlyAnsweredWords, incorrectlyAnsweredWords);
  };

  const renderContent = () => {
    if (questions.length < 2) {
      return <div className="text-center text-slate-500 p-8">无法为此生成测验 (至少需要2个单词)。</div>
    }

    if (isFinished) {
      return (
        <div className="p-8 text-center flex flex-col items-center">
          <h3 className="text-2xl font-bold text-slate-800">测验完成！</h3>
          <p className="text-4xl font-bold my-4">
            <span className={score / questions.length > 0.7 ? 'text-green-500' : 'text-amber-500'}>{score}</span>
            <span className="text-2xl text-slate-500"> / {questions.length}</span>
          </p>
          <p className="text-slate-600 mb-6">你答对了 {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}% 的题目。</p>
          <button onClick={handleCloseAndReport} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">关闭</button>
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <div className="p-6">
          <p className="text-sm text-slate-500 text-center mb-4">
            问题 {currentQuestionIndex + 1} / {questions.length}
          </p>
          <div className="flex justify-center items-center gap-3 mb-8">
             <h3 className="text-center text-3xl font-bold text-slate-800 capitalize">{currentQuestion.word}</h3>
             <button onClick={() => playSound(currentQuestion.word)} className="text-blue-600 hover:text-blue-800 transition-colors">
                <SpeakerIcon />
             </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, idx) => {
              let buttonClass = 'border-slate-200 hover:border-blue-500 hover:bg-blue-50';
              if (feedback) {
                  buttonClass = 'border-slate-200 text-slate-500 cursor-not-allowed';
                  if (option === feedback.correct) {
                    buttonClass = 'border-green-500 bg-green-50 text-green-800 font-semibold ring-2 ring-green-500';
                  } else if (option === feedback.selected) {
                    buttonClass = 'border-red-500 bg-red-50 text-red-800';
                  }
              }
              return (
                  <button
                      key={`${currentQuestionIndex}-${idx}`}
                      onClick={() => handleAnswer(option)}
                      disabled={!!feedback}
                      className={`w-full text-left p-4 bg-white rounded-lg border-2 transition-all ${buttonClass}`}
                  >
                      {option}
                  </button>
              );
            })}
          </div>
          {feedback && (
            <div className="mt-6 text-center">
                <button
                    onClick={handleNextQuestion}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors animate-fade-in"
                >
                    {currentQuestionIndex < questions.length - 1 ? '下一题' : '完成测验'}
                </button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div 
        ref={modalContainerRef}
        tabIndex={-1}
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg transform transition-all animate-fade-in-up focus:outline-none" 
        onClick={e => e.stopPropagation()}
      >
         <header className="flex justify-between items-center p-4 border-b border-slate-200">
           <div className="flex items-center gap-3">
            <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">
                {title.endsWith('测验') ? title : `"${title}" 测验`}
            </h2>
          </div>
          <button onClick={handleCloseAndReport} className="text-slate-400 hover:text-slate-700" aria-label="Close quiz"><CloseIcon /></button>
        </header>
        {renderContent()}
      </div>
    </div>
  );
};

// =================================================================
// ADD MISSED WORDS MODAL
// =================================================================
interface AddMissedWordsModalProps {
  wordCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AddMissedWordsModal: React.FC<AddMissedWordsModalProps> = ({ wordCount, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in-up text-center" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-missed-title"
      >
        <h3 id="add-missed-title" className="text-xl font-bold text-slate-800">测验结束</h3>
        <p className="my-4 text-slate-600">
          本次测验您有 {wordCount} 个错词。
          <br />
          是否要将它们加入生词本以便后续复习？
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={onCancel} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">
            不了，谢谢
          </button>
          <button onClick={onConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            加入生词本
          </button>
        </div>
      </div>
    </div>
  );
};