

import React, { useState, useEffect, useMemo } from 'react';
import type { Story, StorySeries, VocabularyLibrary, WordDetails, User, ActivationCode } from './types';
import { fetchMultipleWordDetailsFromApi } from './services/translationService';
import { LeanCloudService } from './services/leanCloudService';

import Auth from './components/Auth';
import LibrarySelection from './components/LibrarySelection';
import SeriesList from './components/SeriesList';
import StoryDetail from './components/StoryDetail';
import WordModal, { NotebookModal, QuizModal, AddMissedWordsModal } from './components/WordModal';
import StoryManagementModal from './components/StoryManagementModal';
import UserManagementModal from './components/UserManagementModal';
import { PlusCircleIcon, ChevronLeftIcon, HomeIcon, BookOpenIcon, BookmarkIcon, UserGroupIcon, LogoutIcon, CloseIcon } from './components/Icons';

type ReviewState = {
  story: Story;
  libraryId: string;
  seriesId: string;
  wordsToProcess: string[];
} | null;

type QuizState = {
  words: string[];
  title: string;
  source: 'story' | 'notebook';
} | null;

const loadingMessages = [
  "同学，你准备好了嘛？",
  "同学要开始了！",
  "同学加油，你可以的！",
  "正在加载学习资料，请稍候...",
  "单词正在向你奔来！",
  "准备好迎接今天的挑战了吗？"
];

const getRandomLoadingMessage = () => loadingMessages[Math.floor(Math.random() * loadingMessages.length)];


// --- Helper Component for Loading ---
interface LoadingScreenProps {
  message?: string;
  isInitial?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, isInitial = false }) => {
    const [randomMessage] = useState(getRandomLoadingMessage);
    const displayMessage = message || randomMessage;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 flex-col font-sans px-4">
          {isInitial ? (
            <>
              <h1 className="text-4xl font-bold text-slate-800 mb-4">看故事背单词</h1>
              <p className="text-base text-slate-500 mb-8">{randomMessage}</p>
            </>
          ) : (
            <h2 className="text-xl font-semibold mb-6 text-center">{displayMessage}</h2>
          )}
          <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 overflow-hidden relative">
            <div 
              className="absolute h-full bg-blue-600 animate-indeterminate-loader"
            ></div>
          </div>
          <style>{`
            @keyframes indeterminate-loader {
              0% { left: -35%; right: 100%; }
              60% { left: 100%; right: -90%; }
              100% { left: 100%; right: -90%; }
            }
            .animate-indeterminate-loader {
              width: auto;
              will-change: left, right;
              animation: indeterminate-loader 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
            }
          `}</style>
        </div>
    );
};


// --- Helper Component for Connection Errors ---
const LeanCloudConnectionError: React.FC<{ error: Error }> = ({ error }) => {
  const currentOrigin = window.location.origin;
  const isDomainError = error.message.includes('安全域名');
  const isAuthError = error.message.includes('认证失败');
  const isInitError = error.message.includes('初始化错误');

  let title = "后端连接失败";
  let description = "应用无法连接到 LeanCloud 云服务。请根据以下提示检查您的后台配置。";
  let instructions: React.ReactNode = null;

  if (isAuthError) {
    title = "后端认证失败 (401)";
    description = "应用无法连接到 LeanCloud，因为认证信息不正确。这几乎总是因为代码中的配置与您 LeanCloud 控制台中的密钥不匹配。请必须完成以下核对步骤：";
    instructions = (
       <>
        <div className="mt-6 p-4 bg-amber-50 rounded-lg text-left border border-amber-200">
            <p className="font-bold text-amber-900 text-lg">请核对并修正 <code>config.ts</code> 文件</p>
            <p className="text-slate-700 mt-1 mb-3 text-sm">项目代码中的 App Keys 是示例值，您必须用自己应用的值替换它们。</p>
            <ol className="list-decimal list-inside text-slate-700 space-y-3">
            <li>
                登录您的 <a href="https://console.leancloud.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LeanCloud 控制台</a>。
            </li>
            <li>
                在控制台中，进入应用 &rarr; 设置 &rarr; <strong>应用 Keys</strong>。您会在这里看到三项关键信息。
            </li>
            <li>
                在您的代码编辑器中，找到并打开 <code>config.ts</code> 文件。
            </li>
             <li>
                <strong>逐一复制并替换：</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-2 text-sm">
                    <li>将控制台的 <strong>App ID</strong> 复制，粘贴并覆盖 <code>config.ts</code> 中的 <code>LEANCLOUD_APP_ID</code> 的值。</li>
                    <li>将控制台的 <strong>App Key</strong> 复制，粘贴并覆盖 <code>config.ts</code> 中的 <code>LEANCLOUD_APP_KEY</code> 的值。</li>
                    <li>将控制台的 <strong>REST API 服务器地址</strong> 复制，粘贴并覆盖 <code>config.ts</code> 中的 <code>LEANCLOUD_SERVER_URL</code> 的值。(这一步非常重要！)</li>
                </ul>
            </li>
            <li>保存 <code>config.ts</code> 文件后，刷新本页面。</li>
            </ol>
        </div>
      </>
    );
  } else if (isDomainError) {
    title = "后端连接失败 (安全域名)";
    description = "应用无法连接到 LeanCloud 云服务，因为当前的应用网址没有被添加到后台的 Web 安全域名列表中。";
    instructions = (
      <div className="mt-6 p-4 bg-amber-50 rounded-lg text-left">
        <p className="font-semibold text-amber-800">请按以下步骤操作来修复：</p>
        <ol className="list-decimal list-inside mt-2 text-slate-700 space-y-2">
          <li>
            登录您的 <a href="https://console.leancloud.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LeanCloud 控制台</a>。
          </li>
          <li>
            进入应用 &rarr; 设置 &rarr; 安全中心，找到 <strong>Web 安全域名</strong> 设置。
          </li>
          <li>
            将以下您的当前网址完整复制并添加到列表中：
          </li>
        </ol>
        <div className="mt-3 bg-slate-100 p-3 rounded-md text-center">
          <code className="font-mono text-blue-700 font-semibold break-all">{currentOrigin}</code>
        </div>
         <p className="text-xs text-slate-500 mt-3">
          添加后，请稍等片刻然后<strong>刷新本页面</strong>。
         </p>
      </div>
    );
  } else if (isInitError) {
     const classNameMatch = error.message.match(/Class "([^"]+)"/);
     const missingClass = classNameMatch ? classNameMatch[1] : "必需的";
    title = "后端初始化错误";
    description = `应用无法启动，因为在您的 LeanCloud 数据库中找不到必需的 \`${missingClass}\` 表。这通常发生在第一次使用全新的数据库时。`;
    instructions = (
        <div className="mt-6 p-4 bg-amber-50 rounded-lg text-left">
        <p className="font-semibold text-amber-800">请按以下步骤操作来修复：</p>
        <ol className="list-decimal list-inside mt-2 text-slate-700 space-y-2">
          <li>
            登录您的 <a href="https://console.leancloud.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LeanCloud 控制台</a>。
          </li>
          <li>
            进入应用 &rarr; 存储 &rarr; 数据，点击 <strong>创建 Class</strong> 按钮。
          </li>
          <li>
            在弹出的窗口中，输入 <strong><code>{missingClass}</code></strong> 作为 Class 名称，并创建。 (如果提示创建多个，请将它们全部创建)
          </li>
           <li>请确保您已创建了 `VocabularyLibrary`, `StorySeries`, 和 `Story` 这三个 Class。</li>
          <li>
            创建成功后，<strong>刷新本页面</strong>。
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-sans">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border-2 border-red-200 text-center">
        <h1 className="text-2xl font-bold text-red-700">{title}</h1>
        <p className="mt-4 text-slate-600">{description}</p>
        {instructions}
        <details className="mt-6 text-left text-sm">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">点击查看技术性错误详情</summary>
          <pre className="mt-2 p-3 bg-slate-100 rounded-md text-xs overflow-auto whitespace-pre-wrap">
            {error.stack || error.message}
          </pre>
        </details>
      </div>
    </div>
  );
};

// --- Helper Component for Admin ACL/Permission Errors (unchanged) ---
const AdminPermissionError: React.FC<{ failedClass: string; onRetry: () => void; onClose: () => void }> = ({ failedClass, onRetry, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all animate-fade-in-up" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-red-700">管理员权限错误</h1>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
        </div>
        
        <p className="mt-4 text-slate-600">
          无法加载管理员数据，因为当前 "admin" 用户没有权限读取 <strong>{failedClass}</strong> 表中的所有数据。这是 LeanCloud 的默认安全设置，用于保护用户隐私。
        </p>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg text-left">
          <p className="font-semibold text-amber-800">请按以下步骤在 LeanCloud 控制台修复权限：</p>
          <ol className="list-decimal list-inside mt-2 text-slate-700 space-y-3">
            <li>
              登录您的 <a href="https://console.leancloud.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LeanCloud 控制台</a>。
            </li>
            <li>
              首先，确保存在 "admin" 角色：进入 <strong>存储 &rarr; 数据 &rarr; <code>_Role</code> 表</strong>。如果不存在名为 <code>admin</code> 的行，请手动创建一行，并将 <code>name</code> 字段设为 <code>admin</code>。
            </li>
            <li>
              然后，将您的管理员用户添加到该角色：在 <code>_Role</code> 表找到 <code>admin</code> 行，点击 "用户" 列下的 "添加关联"，选择您的管理员账户。
            </li>
             <li>
              接下来，设置权限：进入 <strong>存储 &rarr; 数据 &rarr; <code>{failedClass}</code> 表</strong>，然后切换到 <strong>权限</strong> 标签页。
            </li>
            <li>
              找到 <strong><code>find</code></strong> 权限设置，将其权限修改为 <strong>指定角色</strong>，然后在角色列表中勾选 <strong><code>admin</code></strong> 并保存。
            </li>
             <li>
              如果 <code>ActivationCode</code>, <code>VocabularyLibrary</code>, 或 <code>WordDictionary</code> 表也遇到权限问题，请对它们重复第 4 和第 5 步。
            </li>
          </ol>
           <p className="text-xs text-slate-500 mt-3">
            完成设置后，点击下方的“重试”按钮。
           </p>
        </div>
        
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onRetry} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            重试
          </button>
        </div>
      </div>
    </div>
  );
};


// ... (QuizCompletionModal remains unchanged)
interface QuizCompletionModalProps {
  wordCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}
const QuizCompletionModal: React.FC<QuizCompletionModalProps> = ({ wordCount, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-fade-in-up text-center" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-title"
      >
        <h3 id="completion-title" className="text-xl font-bold text-slate-800">测验完成！</h3>
        <p className="my-4 text-slate-600">
          您答对了 {wordCount} 个单词。
          <br />
          是否将这些单词从生词本中移出？
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={onCancel} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">
            否，保留它们
          </button>
          <button onClick={onConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            是，移出
          </button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const leanCloudService = useMemo(() => new LeanCloudService(), []);

  const [isInitializing, setIsInitializing] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [leanCloudError, setLeanCloudError] = useState<Error | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminPermissionError, setAdminPermissionError] = useState<string | null>(null);

  const [data, setData] = useState<VocabularyLibrary[]>([]);
  const [dictionary, setDictionary] = useState<Record<string, WordDetails>>({});
  const [favoritedWords, setFavoritedWords] = useState<string[]>(() => JSON.parse(localStorage.getItem('favoritedWords') || '[]'));
  const [learnedWords, setLearnedWords] = useState<string[]>(() => JSON.parse(localStorage.getItem('learnedWords') || '[]'));
  const [soundUrls, setSoundUrls] = useState({ correct: '', wrong: '' });
  
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  
  const [modalState, setModalState] = useState<{ details: WordDetails | null; wordForDisplay: string | null; isLoading: boolean }>({ details: null, wordForDisplay: null, isLoading: false });
  const [isManageStoryModalOpen, setManageStoryModalOpen] = useState(false);
  const [isManageUserModalOpen, setManageUserModalOpen] = useState(false);
  const [isNotebookOpen, setNotebookOpen] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>(null);
  const [reviewState, setReviewState] = useState<ReviewState>(null);
  const [notification, setNotification] = useState<{ message: string; id: string } | null>(null);
  const [quizCompletionState, setQuizCompletionState] = useState<string[] | null>(null);
  const [missedWordsState, setMissedWordsState] = useState<string[] | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCodes, setAllCodes] = useState<ActivationCode[]>([]);
  
  const loadAppData = async () => {
    setIsDataLoading(true);
    try {
      const [libraries, dictionaryData] = await Promise.all([
        leanCloudService.getLibraries(),
        leanCloudService.getDictionary()
      ]);
      setData(libraries);
      setDictionary(dictionaryData);
    } catch (error) {
       const err = error as Error;
       if (err.message.startsWith('ADMIN_PERMISSION_ERROR')) {
         setAdminPermissionError(err.message.split(': ')[1] || '数据');
       } else {
         setLeanCloudError(err);
       }
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await leanCloudService.verifyConnection();
        leanCloudService.getSoundUrls().then(setSoundUrls);
        const user = leanCloudService.getCurrentUser();
        if (user) {
          setCurrentUser(user);

          // Proactively ensure admin role configuration is correct
          if (user.role === 'admin') {
            await leanCloudService.ensureAdminRole();
          }

          setIsSeeding(true);
          const wasSeeded = await leanCloudService.seedInitialData();
          setIsSeeding(false);

          if (wasSeeded) {
            setNotification({ message: '已为您预置了初始学习内容！', id: 'seed-ok' });
          }

          await loadAppData(); 
        }
      } catch (error) {
        setLeanCloudError(error as Error);
      } finally {
        setIsInitializing(false);
      }
    };
    initializeApp();
  }, [leanCloudService]);

  const fetchAdminData = async () => {
    if (currentUser?.role !== 'admin') return;
    try {
      setAdminPermissionError(null);
      const [users, codes] = await Promise.all([leanCloudService.getUsers(), leanCloudService.getActivationCodes()]);
      setAllUsers(users);
      setAllCodes(codes);
    } catch (error) {
      const err = error as Error;
      if (err.message.startsWith('ADMIN_PERMISSION_ERROR')) {
        setAdminPermissionError(err.message.split(': ')[1] || '_User');
      } else {
        setNotification({ message: '加载管理员数据失败。', id: 'admin-load-fail' });
      }
    }
  };

  useEffect(() => {
    if (isManageUserModalOpen) {
      fetchAdminData();
    }
  }, [isManageUserModalOpen, currentUser?.role]);
  
  useEffect(() => { localStorage.setItem('favoritedWords', JSON.stringify(favoritedWords)); }, [favoritedWords]);
  useEffect(() => { localStorage.setItem('learnedWords', JSON.stringify(learnedWords)); }, [learnedWords]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    try {
      if (user.role === 'admin') {
        await leanCloudService.ensureAdminRole();
      }
      await loadAppData();
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("无法自动配置管理员角色")) {
        alert(err.message);
      }
      setLeanCloudError(err);
    }
  };

  const handleLogout = async () => {
    await leanCloudService.logout();
    setCurrentUser(null);
    setData([]);
    setDictionary({});
    handleGoHome();
  };

  const handleSelectLibrary = async (id: string) => {
    setSelectedLibraryId(id);
    const libInState = data.find(l => l.id === id);
    if (!libInState || libInState.series.length > 0) return; // Already loaded

    const series = await leanCloudService.getSeriesForLibrary(id);
    setData(prevData => prevData.map(lib => lib.id === id ? { ...lib, series } : lib));
  };
  
  const handleSelectSeries = async (id: string) => {
    setSelectedSeriesId(id);
    const seriesInState = data.flatMap(l => l.series).find(s => s.id === id);
    if (!seriesInState || seriesInState.stories.length > 0) return; // Already loaded

    const stories = await leanCloudService.getStoriesForSeries(id);
    setData(prevData => prevData.map(lib => ({
        ...lib,
        series: lib.series.map(s => s.id === id ? { ...s, stories } : s),
    })));
  };
  
  const handleSelectStory = (id: string) => {
    setSelectedStoryId(id);
  };

  const handleBack = () => {
    if (selectedStoryId) setSelectedStoryId(null);
    else if (selectedSeriesId) { setSelectedSeriesId(null); }
    else if (selectedLibraryId) setSelectedLibraryId(null);
  };

  const handleGoHome = () => {
    setSelectedLibraryId(null);
    setSelectedSeriesId(null);
    setSelectedStoryId(null);
  };

  const handleWordClick = async (word: string) => {
    const lowerCaseWord = word.toLowerCase();

    if (!learnedWords.includes(lowerCaseWord)) {
        setLearnedWords(prev => [...prev, lowerCaseWord]);
    }

    const existingDetails = dictionary[lowerCaseWord];
    
    if (existingDetails) {
        setModalState({ details: existingDetails, wordForDisplay: lowerCaseWord, isLoading: false });
    } else {
        setModalState({ details: null, wordForDisplay: lowerCaseWord, isLoading: true });
        try {
            const newWordDetails = await fetchMultipleWordDetailsFromApi([lowerCaseWord]);
            const successfullyFetchedDetails = newWordDetails[lowerCaseWord];

            if (successfullyFetchedDetails && successfullyFetchedDetails.definitions.length > 0) {
                 setDictionary(prev => ({ ...prev, [lowerCaseWord]: successfullyFetchedDetails }));
                 await leanCloudService.saveWordDetails({ [lowerCaseWord]: successfullyFetchedDetails });
                 setModalState({ details: successfullyFetchedDetails, wordForDisplay: lowerCaseWord, isLoading: false });
            } else {
                 setModalState({ details: null, wordForDisplay: lowerCaseWord, isLoading: false });
            }
        } catch (error) {
            console.error("Failed to fetch word on demand:", error);
            setModalState({ details: null, wordForDisplay: lowerCaseWord, isLoading: false });
            setNotification({ message: '获取单词释义失败。', id: `fetch-fail-${lowerCaseWord}` });
        }
    }
  };
  
  const handleToggleFavorite = (word: string) => {
    const lowerCaseWord = word.toLowerCase();
    setFavoritedWords(prev => prev.includes(lowerCaseWord) ? prev.filter(w => w !== lowerCaseWord) : [...prev, lowerCaseWord]);
  };
  
  const handleCloseWordModal = () => setModalState({ details: null, wordForDisplay: null, isLoading: false });
  
  // --- Quiz Handlers (unchanged) ---
  const handleStartStoryQuiz = (story: Story) => {
    const wordRegex = /\b([a-zA-Z']+)\s*\([^)]+\)/g;
    const matches = story.content.matchAll(wordRegex);
    const storyWords = [...new Set(Array.from(matches, match => match[1].toLowerCase()))];
    if (storyWords.length > 0) {
        setQuizState({ words: storyWords, title: story.title, source: 'story' });
    } else {
        setNotification({ message: '这个故事没有单词可以测验。', id: 'notify-quiz-empty' });
    }
  };
  const handleStartNotebookQuiz = () => {
    setNotebookOpen(false);
    if (favoritedWords.length === 0) {
        setNotification({ message: '生词本是空的，无法开始测验。', id: `notify-notebook-empty` });
        return;
    }
    const shuffledWords = [...favoritedWords].sort(() => 0.5 - Math.random());
    const wordsToQuiz = shuffledWords.length > 50 ? shuffledWords.slice(0, 50) : shuffledWords;
    setQuizState({ words: wordsToQuiz, title: '单词本测验', source: 'notebook'});
  };
  const handleEndQuiz = (correctlyAnsweredWords: string[], incorrectlyAnsweredWords: string[]) => {
    const source = quizState?.source;
    setQuizState(null);
    if (source === 'notebook' && correctlyAnsweredWords.length > 0) {
        setQuizCompletionState(correctlyAnsweredWords);
    } else if (source === 'story' && incorrectlyAnsweredWords.length > 0) {
        const newMissedWords = incorrectlyAnsweredWords.filter(word => !favoritedWords.includes(word.toLowerCase()));
        if (newMissedWords.length > 0) {
            setMissedWordsState(newMissedWords);
        }
    }
  };
  const handleConfirmRemoveWords = () => {
    if (!quizCompletionState) return;
    setFavoritedWords(prev => prev.filter(word => !quizCompletionState.includes(word.toLowerCase())));
    setNotification({ message: `已从生词本中移出 ${quizCompletionState.length} 个单词。`, id: `notify-notebook-remove` });
    setQuizCompletionState(null);
  };
  const handleCancelRemoveWords = () => setQuizCompletionState(null);
  const handleConfirmAddToNotebook = () => {
    if (!missedWordsState) return;
    setFavoritedWords(prev => [...new Set([...prev, ...missedWordsState.map(w => w.toLowerCase())])]);
    setNotification({ message: `已将 ${missedWordsState.length} 个错词加入生词本。`, id: `notify-add-missed-${Date.now()}` });
    setMissedWordsState(null);
  };
  const handleCancelAddToNotebook = () => setMissedWordsState(null);

  // --- Background Word Caching & Review ---
  const processStoryWordsInBackground = async (story: Story, libraryId: string, seriesId: string) => {
    const wordRegex = /\b([a-zA-Z']+)\s*\([^)]+\)/g;
    const matches = story.content.matchAll(wordRegex);
    const uniqueWords = [...new Set(Array.from(matches, match => match[1].toLowerCase()))];
    const wordsToFetch = uniqueWords.filter(word => !dictionary[word]);
    
    if (wordsToFetch.length === 0) {
      await leanCloudService.updateStory(story.id, { status: 'published' });
      setNotification({ message: `“${story.title}” 已经准备就绪！`, id: `notify-${story.id}` });
      return;
    }
    
    await leanCloudService.updateStory(story.id, { status: 'reviewing' });
    setReviewState({ story, libraryId, seriesId, wordsToProcess: wordsToFetch });
    setManageStoryModalOpen(true);
  };
  
  const handleConfirmReview = async (reviewedData: Record<string, WordDetails>) => {
    if (!reviewState) return;

    setDictionary(prev => ({ ...prev, ...reviewedData }));
    await leanCloudService.updateStory(reviewState.story.id, { status: 'published' });
    await leanCloudService.saveWordDetails(reviewedData);
    
    setNotification({ message: `“${reviewState.story.title}” 已成功发布！`, id: `notify-${reviewState.story.id}` });
    setReviewState(null);
    setManageStoryModalOpen(false);
  };
  
  const handleCancelReview = async () => {
    if (!reviewState) return;
    await leanCloudService.updateStory(reviewState.story.id, { status: 'published' });
    setReviewState(null);
  };

  // --- Story Data Management (Refactored for Relational Model) ---
  const handleAddLibrary = async (title: string, description: string) => { 
    const newLib = await leanCloudService.addLibrary(title, description);
    setData(prev => [...prev, newLib]);
  };
  
  const handleAddSeries = async (libraryId: string, title: string, description: string) => {
     const newSeries = await leanCloudService.addSeries(libraryId, title, description);
     setData(prev => prev.map(lib => lib.id === libraryId ? { ...lib, series: [...lib.series, newSeries] } : lib));
  };
  
  const handleAddStory = async (libraryId: string, seriesId: string, title: string, content: string) => {
    const series = data.flatMap(l => l.series).find(s => s.id === seriesId);
    const order = series ? series.stories.length : 0;
    const newStoryStub = await leanCloudService.addStory(seriesId, title, content, 'caching', order);
    
    // Optimistic UI update
    setData(prev => prev.map(lib => lib.id === libraryId ? {
        ...lib, series: lib.series.map(s => s.id === seriesId ? { ...s, stories: [...s.stories, newStoryStub] } : s)
    } : lib));
    
    await processStoryWordsInBackground(newStoryStub, libraryId, seriesId);
  };
  
  const handleUpdateLibrary = async (id: string, title: string, description: string) => {
      await leanCloudService.updateLibrary(id, title, description);
      setData(prev => prev.map(lib => lib.id === id ? { ...lib, title, description } : lib));
  };
  
  const handleUpdateSeries = async (libraryId: string, seriesId: string, title: string, description: string) => {
      await leanCloudService.updateSeries(seriesId, title, description);
      setData(prev => prev.map(lib => lib.id === libraryId ? {
          ...lib, series: lib.series.map(s => s.id === seriesId ? { ...s, title, description } : s)
      } : lib));
  };
  
  const handleUpdateStory = async (libraryId: string, seriesId: string, storyId: string, title: string, content: string) => {
    const storyForProcessing: Story = { id: storyId, title, content, status: 'caching' };
    await leanCloudService.updateStory(storyId, { title, content, status: 'caching' });
    
    setData(prev => prev.map(lib => lib.id === libraryId ? {
        ...lib, series: lib.series.map(s => s.id === seriesId ? {
            ...s, stories: s.stories.map(st => st.id === storyId ? { ...st, title, content, status: 'caching' } : st)
        } : s)
    } : lib));
    
    await processStoryWordsInBackground(storyForProcessing, libraryId, seriesId);
  };
  
  const handleDeleteStory = async (libraryId: string, seriesId: string, storyId: string) => {
    if (window.confirm('您确定要删除这个故事吗？此操作无法撤销。')) {
        try {
            await leanCloudService.deleteStory(storyId);
            setData(prev => prev.map(lib => {
                if (lib.id !== libraryId) return lib;
                return {
                    ...lib,
                    series: lib.series.map(s => {
                        if (s.id !== seriesId) return s;
                        return { ...s, stories: s.stories.filter(st => st.id !== storyId) };
                    })
                };
            }));
            setNotification({ message: '故事已成功删除。', id: `delete-story-${Date.now()}` });
        } catch (error) {
            console.error("Failed to delete story:", error);
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('权限不足')) {
              alert(errorMessage);
            } else {
              setNotification({ message: `删除故事失败：${errorMessage}`, id: `delete-story-fail-${Date.now()}` });
            }
        }
    }
  };

  const handleReorderStories = async (libraryId: string, seriesId: string, startIndex: number, endIndex: number) => {
      let reorderedStories: Story[] = [];
      const newData = data.map(lib => {
          if (lib.id !== libraryId) return lib;
          return {
              ...lib,
              series: lib.series.map(s => {
                  if (s.id !== seriesId) return s;
                  const stories = [...s.stories];
                  const [removed] = stories.splice(startIndex, 1);
                  stories.splice(endIndex, 0, removed);
                  reorderedStories = stories;
                  return { ...s, stories };
              })
          };
      });
      setData(newData);
      const storiesToUpdate = reorderedStories.map((story, index) => ({ id: story.id, order: index }));
      await leanCloudService.reorderStories(storiesToUpdate);
  };
  
  const handleExportData = () => { /* ... unchanged ... */ };
  const handleAddUser = async (user: Omit<User, 'role' | 'activationCodeUsed' | 'email'> & { email?: string }) => {
    try {
      await leanCloudService.adminAddUser(user.phone, user.password, user.email);
      setNotification({ message: '用户添加成功。', id: Date.now().toString() });
      await fetchAdminData();
    } catch (error) {
      setNotification({ message: (error as Error).message, id: Date.now().toString() });
      throw error;
    }
  };
  const handleDeleteUser = async (phone: string) => { /* ... unchanged ... */ };
  const handleGenerateCodes = async (count: number) => {
    try {
      await leanCloudService.generateCodes(count);
      setNotification({ message: `已生成 ${count} 个新激活码。`, id: Date.now().toString() });
      await fetchAdminData();
    } catch (error) {
      setNotification({ message: (error as Error).message, id: Date.now().toString() });
      throw error;
    }
  };

  if (isInitializing) return <LoadingScreen isInitial />;
  if (isSeeding) return <LoadingScreen message="首次启动，正在为您准备初始内容..." />;
  if (leanCloudError) return <LeanCloudConnectionError error={leanCloudError} />;
  if (!currentUser) return <Auth onLoginSuccess={handleLoginSuccess} leanCloudService={leanCloudService} />;
  if (isDataLoading) return <LoadingScreen />;

  const selectedLibrary = data.find(l => l.id === selectedLibraryId);
  const selectedSeries = selectedLibrary?.series.find(s => s.id === selectedSeriesId);
  const selectedStory = selectedSeries?.stories.find(s => s.id === selectedStoryId);
  
  let currentView;
  let headerTitle = "看故事背单词";

  if (selectedStory && selectedSeries && selectedLibrary) {
     headerTitle = selectedSeries.title;
     currentView = <StoryDetail 
        story={selectedStory} 
        storyIndex={selectedSeries.stories.findIndex(s => s.id === selectedStoryId)} 
        onWordClick={handleWordClick} 
        dictionary={dictionary} 
        onStartQuiz={handleStartStoryQuiz} 
        activeWord={modalState.wordForDisplay}
        learnedWords={learnedWords}
        favoritedWords={favoritedWords}
      />;
  } else if (selectedSeries && selectedLibrary) {
     headerTitle = selectedSeries.title;
     currentView = <SeriesList series={selectedSeries} onSelectStory={handleSelectStory} />;
  } else if (selectedLibrary) {
    headerTitle = selectedLibrary.title;
    currentView = <SeriesList library={selectedLibrary} onSelectSeries={handleSelectSeries} />;
  } else {
    currentView = <LibrarySelection libraries={data} onSelectLibrary={handleSelectLibrary} />;
  }
  
  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-800 flex flex-col">
       {notification && (
        <div key={notification.id} className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] animate-fade-in-down">
          {notification.message}
        </div>
      )}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {(selectedLibraryId || selectedSeriesId || selectedStoryId) && (
                        <>
                        <button onClick={handleBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0" aria-label="返回">
                            <ChevronLeftIcon />
                        </button>
                        <button onClick={handleGoHome} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0" aria-label="主页">
                            <HomeIcon />
                        </button>
                        </>
                    )}
                    <h1 className="text-xl font-semibold text-slate-700 truncate ml-2">{headerTitle}</h1>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => setNotebookOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" aria-label="生词本">
                        <BookmarkIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">生词本</span>
                    </button>
                    {currentUser?.role === 'admin' && (
                    <>
                        <button onClick={() => setManageStoryModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" aria-label="管理故事">
                        <BookOpenIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">管理故事</span>
                        </button>
                        <button onClick={() => setManageUserModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" aria-label="管理用户">
                        <UserGroupIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">管理用户</span>
                        </button>
                    </>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="退出登录">
                        <LogoutIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">退出</span>
                    </button>
                </div>
            </div>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl p-4 sm:p-6 flex-grow">{currentView}</main>
      {modalState.wordForDisplay && <WordModal details={modalState.details} wordForDisplay={modalState.wordForDisplay} isLoading={modalState.isLoading} onClose={handleCloseWordModal} onToggleFavorite={handleToggleFavorite} isFavorited={favoritedWords.includes(modalState.wordForDisplay.toLowerCase())}/>}
      {isNotebookOpen && <NotebookModal words={favoritedWords} dictionary={dictionary} onClose={() => setNotebookOpen(false)} onToggleFavorite={handleToggleFavorite} onWordClick={handleWordClick} onStartQuiz={handleStartNotebookQuiz}/>}
      {quizState && <QuizModal words={quizState.words} title={quizState.title} dictionary={dictionary} onEndQuiz={handleEndQuiz} soundUrls={soundUrls} />}
      {isManageStoryModalOpen && <StoryManagementModal isOpen={isManageStoryModalOpen} onClose={() => setManageStoryModalOpen(false)} libraries={data} dictionary={dictionary} onAddLibrary={handleAddLibrary} onAddSeries={handleAddSeries} onAddStory={handleAddStory} onUpdateLibrary={handleUpdateLibrary} onUpdateSeries={handleUpdateSeries} onUpdateStory={handleUpdateStory} onDeleteStory={handleDeleteStory} onReorderStories={handleReorderStories} onExportData={handleExportData} reviewState={reviewState} onConfirmReview={handleConfirmReview} onCancelReview={handleCancelReview} />}
      {adminPermissionError && <AdminPermissionError failedClass={adminPermissionError} onRetry={() => { isManageUserModalOpen ? fetchAdminData() : loadAppData() }} onClose={() => setAdminPermissionError(null)} />}
      {isManageUserModalOpen && <UserManagementModal isOpen={isManageUserModalOpen} onClose={() => setManageUserModalOpen(false)} users={allUsers} codes={allCodes} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onGenerateCodes={handleGenerateCodes} />}
      {quizCompletionState && <QuizCompletionModal wordCount={quizCompletionState.length} onConfirm={handleConfirmRemoveWords} onCancel={handleCancelRemoveWords} />}
      {missedWordsState && <AddMissedWordsModal wordCount={missedWordsState.length} onConfirm={handleConfirmAddToNotebook} onCancel={handleCancelAddToNotebook} />}
    </div>
  );
};

export default App;