import React, { useState, useEffect, useRef } from 'react';
import type { VocabularyLibrary, StorySeries, Story, WordDetails, Definition, ExampleSentence } from '../types';
import { CloseIcon, EditIcon, GripVerticalIcon, ChevronRightIcon, DownloadIcon, TrashIcon, RefreshIcon } from './Icons';
import { fetchMultipleWordDetailsFromApi } from '../services/translationService';

type ModalMode = 
  | 'list' 
  | 'add-library' | 'edit-library' 
  | 'add-series' | 'edit-series' 
  | 'add-story' | 'edit-story';
  
type ReviewState = {
  story: Story;
  libraryId: string;
  seriesId: string;
  wordsToProcess: string[];
} | null;

interface StoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraries: VocabularyLibrary[];
  dictionary: Record<string, WordDetails>;
  onAddLibrary: (title: string, description: string) => Promise<void>;
  onAddSeries: (libraryId: string, title: string, description: string) => Promise<void>;
  onAddStory: (libraryId: string, seriesId: string, title: string, content: string) => Promise<void>;
  onUpdateLibrary: (id: string, title: string, description: string) => Promise<void>;
  onUpdateSeries: (libraryId: string, seriesId: string, title: string, description: string) => Promise<void>;
  onUpdateStory: (libraryId: string, seriesId: string, storyId: string, title: string, content: string) => Promise<void>;
  onDeleteStory: (libraryId: string, seriesId: string, storyId: string) => Promise<void>;
  onReorderStories: (libraryId: string, seriesId: string, startIndex: number, endIndex: number) => Promise<void>;
  onExportData: () => void;
  reviewState: ReviewState;
  onConfirmReview: (reviewedData: Record<string, WordDetails>) => Promise<void>;
  onCancelReview: () => Promise<void>;
}

const StoryManagementModal: React.FC<StoryManagementModalProps> = (props) => {
  const { isOpen, onClose, libraries, onReorderStories, reviewState, onConfirmReview, onCancelReview } = props;
  
  const [mode, setMode] = useState<ModalMode>('list');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const dragItem = useRef<any>(null);
  const dragOverItem = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setEditingItem(null);
    }
  }, [isOpen]);

  const handleEditClick = (type: 'library' | 'series' | 'story', item: any) => {
    setEditingItem(item);
    setMode(`edit-${type}` as ModalMode);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const { libId, seriesId, index: startIndex } = dragItem.current;
      const { index: endIndex } = dragOverItem.current;
      if (startIndex !== endIndex) {
          onReorderStories(libId, seriesId, startIndex, endIndex);
      }
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (reviewState) {
        return <ReviewForm 
          story={reviewState.story} 
          wordsToProcess={reviewState.wordsToProcess}
          onConfirm={onConfirmReview} 
          onCancel={onCancelReview} 
        />;
    }
    switch(mode) {
      case 'list': return <ListContent onEdit={handleEditClick} {...props} expanded={expanded} setExpanded={setExpanded} setMode={setMode} handleDragEnd={handleDragEnd} dragItem={dragItem} dragOverItem={dragOverItem} />;
      case 'add-library': return <LibraryForm onSave={props.onAddLibrary} onCancel={() => setMode('list')} />;
      case 'edit-library': return <LibraryForm item={editingItem} onSave={(title, desc) => props.onUpdateLibrary(editingItem.id, title, desc)} onCancel={() => setMode('list')} />;
      case 'add-series': return <SeriesForm libraries={libraries} onSave={props.onAddSeries} onCancel={() => setMode('list')} />;
      case 'edit-series': return <SeriesForm item={editingItem} libraries={libraries} onSave={(libId, title, desc) => props.onUpdateSeries(libId, editingItem.id, title, desc)} onCancel={() => setMode('list')} />;
      case 'add-story': return <StoryForm libraries={libraries} onSave={props.onAddStory} onCancel={() => setMode('list')} />;
      case 'edit-story': return <StoryForm item={editingItem} libraries={libraries} onSave={(libId, seriesId, title, content) => props.onUpdateStory(libId, seriesId, editingItem.id, title, content)} onCancel={() => setMode('list')} />;
      default: return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700">{reviewState ? `审核: ${reviewState.story.title}` : '管理故事和词库'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Close"><CloseIcon /></button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};


// --- Sub-components for different modes ---

const ListContent = ({ libraries, onEdit, expanded, setExpanded, setMode, handleDragEnd, dragItem, dragOverItem, onExportData }) => (
  <div>
    <div className="flex flex-wrap gap-2 mb-6">
      <button onClick={() => setMode('add-library')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">添加词库</button>
      <button onClick={() => setMode('add-series')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">添加系列</button>
      <button onClick={() => setMode('add-story')} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">添加故事</button>
      <button onClick={onExportData} className="flex items-center gap-2 ml-auto px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700">
        <DownloadIcon className="w-5 h-5"/> 导出数据
      </button>
    </div>
    <div className="space-y-2 pr-2 -mr-2 overflow-y-auto border rounded-lg p-2 bg-white">
      {libraries.map((lib: VocabularyLibrary) => (
        <div key={lib.id}>
          <div className="flex justify-between items-center bg-slate-100 p-2 rounded-t-md">
            <button onClick={() => setExpanded(prev => ({...prev, [lib.id]: !prev[lib.id]}))} className="flex items-center gap-2 font-semibold flex-1 text-left">
              <ChevronRightIcon className={`w-5 h-5 transition-transform ${expanded[lib.id] ? 'rotate-90' : ''}`} />
              {lib.title}
            </button>
            <button onClick={() => onEdit('library', lib)} className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-full"><EditIcon /></button>
          </div>
          {expanded[lib.id] && (
            <div className="pl-4 py-2 border-l-2 ml-4">
              {lib.series.map((series: StorySeries) => (
                <div key={series.id}>
                  <div className="flex justify-between items-center mt-2">
                     <button onClick={() => setExpanded(prev => ({...prev, [series.id]: !prev[series.id]}))} className="flex items-center gap-2 text-slate-700 flex-1 text-left">
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${expanded[series.id] ? 'rotate-90' : ''}`} />
                       {series.title}
                    </button>
                    <button onClick={() => onEdit('series', {...series, libraryId: lib.id})} className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-full"><EditIcon /></button>
                  </div>
                  {expanded[series.id] && (
                    <div className="pl-6 mt-2 space-y-1">
                      {series.stories.map((story: Story, index) => (
                        <div key={story.id} draggable onDragStart={() => dragItem.current = { libId: lib.id, seriesId: series.id, index }} onDragEnter={() => dragOverItem.current = { index }} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="flex justify-between items-center text-sm p-1.5 rounded-md hover:bg-slate-100 cursor-grab group">
                          <div className="flex items-center gap-2">
                             <GripVerticalIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            <span className="text-slate-500">{index + 1}. {story.title}</span>
                            {story.status === 'reviewing' && <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">待审核</span>}
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit('story', {...story, libraryId: lib.id, seriesId: series.id })} className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-full"><EditIcon className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

type LibraryFormProps = {
  item?: VocabularyLibrary;
  onSave: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
};
const LibraryForm = ({ item, onSave, onCancel }: LibraryFormProps) => {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(title, description);
      onCancel();
    } catch(err) {
      alert("保存失败，请稍后重试。");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold text-lg text-slate-800">{item ? '编辑词库' : '添加新词库'}</h3>
      <div>
        <label htmlFor="libTitle" className="block text-sm font-medium text-slate-700">标题</label>
        <input id="libTitle" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div>
        <label htmlFor="libDesc" className="block text-sm font-medium text-slate-700">描述</label>
        <textarea id="libDesc" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">取消</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
};

type SeriesFormProps = {
  item?: StorySeries & { libraryId: string };
  libraries: VocabularyLibrary[];
  onSave: (libraryId: string, title: string, description: string) => Promise<void>;
  onCancel: () => void;
};
const SeriesForm = ({ item, libraries, onSave, onCancel }: SeriesFormProps) => {
  const [libraryId, setLibraryId] = useState(item?.libraryId || libraries[0]?.id || '');
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(libraryId, title, description);
      onCancel();
    } catch(err) {
      alert("保存失败，请稍后重试。");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold text-lg text-slate-800">{item ? '编辑系列' : '添加新系列'}</h3>
      <div>
        <label htmlFor="libSelect" className="block text-sm font-medium text-slate-700">所属词库</label>
        <select id="libSelect" value={libraryId} onChange={e => setLibraryId(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
          {libraries.map(lib => <option key={lib.id} value={lib.id}>{lib.title}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="seriesTitle" className="block text-sm font-medium text-slate-700">标题</label>
        <input id="seriesTitle" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div>
        <label htmlFor="seriesDesc" className="block text-sm font-medium text-slate-700">描述</label>
        <textarea id="seriesDesc" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">取消</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
};

type StoryFormProps = {
  item?: Story & { libraryId: string, seriesId: string };
  libraries: VocabularyLibrary[];
  onSave: (libraryId: string, seriesId: string, title: string, content: string) => Promise<void>;
  onCancel: () => void;
};
const StoryForm = ({ item, libraries, onSave, onCancel }: StoryFormProps) => {
  const [libraryId, setLibraryId] = useState(item?.libraryId || libraries[0]?.id || '');
  const [seriesId, setSeriesId] = useState(item?.seriesId || libraries.find(l => l.id === (item?.libraryId || libraries[0]?.id))?.series[0]?.id || '');
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!item) {
       const currentLibrary = libraries.find(l => l.id === libraryId);
       setSeriesId(currentLibrary?.series[0]?.id || '');
    }
  }, [libraryId, libraries, item]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(libraryId, seriesId, title, content);
      // onCancel(); // Do not call onCancel here, App.tsx will handle the modal state change
    } catch(err) {
      alert("保存失败，词典服务可能暂时不可用。");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentLibrary = libraries.find(l => l.id === libraryId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
      <h3 className="font-bold text-lg text-slate-800">{item ? '编辑故事' : '添加新故事'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="storyLib" className="block text-sm font-medium text-slate-700">所属词库</label>
          <select id="storyLib" value={libraryId} onChange={e => setLibraryId(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            {libraries.map(lib => <option key={lib.id} value={lib.id}>{lib.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="storySeries" className="block text-sm font-medium text-slate-700">所属系列</label>
          <select id="storySeries" value={seriesId} onChange={e => setSeriesId(e.target.value)} required disabled={!currentLibrary?.series.length} className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100">
            {currentLibrary?.series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="storyTitle" className="block text-sm font-medium text-slate-700">标题</label>
        <input id="storyTitle" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div className="flex-grow flex flex-col">
        <label htmlFor="storyContent" className="block text-sm font-medium text-slate-700">故事内容</label>
        <textarea id="storyContent" value={content} onChange={e => setContent(e.target.value)} required className="mt-1 block w-full flex-grow p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 'This is an example (例子).'"></textarea>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">取消</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300" disabled={isSaving || !libraryId || !seriesId || !title.trim() || !content.trim()}>
          {isSaving ? '处理中...' : '保存并处理单词'}
        </button>
      </div>
    </form>
  );
};


type ReviewFormProps = {
  story: Story;
  wordsToProcess: string[];
  onConfirm: (reviewedData: Record<string, WordDetails>) => Promise<void>;
  onCancel: () => Promise<void>;
};

const ReviewForm: React.FC<ReviewFormProps> = ({ story, wordsToProcess, onConfirm, onCancel }) => {
  const [editedData, setEditedData] = useState<Record<string, WordDetails | 'loading'>>({});
  const [regeneratingWord, setRegeneratingWord] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    const fetchInBatches = async () => {
      const BATCH_SIZE = 10;
      const batches: string[][] = [];
      for (let i = 0; i < wordsToProcess.length; i += BATCH_SIZE) {
        batches.push(wordsToProcess.slice(i, i + BATCH_SIZE));
      }

      const fetchPromises = batches.map(batch =>
        fetchMultipleWordDetailsFromApi(batch)
          .then(results => {
            setEditedData(prev => ({ ...prev, ...results }));
          })
          .catch(err => {
            console.error("Batch fetch failed:", err);
            // On failure, provide empty stubs so the admin can fill them manually.
            const failedResults = batch.reduce((acc, word) => {
              acc[word] = { word, phonetic: '', definitions: [], examples: [] };
              return acc;
            }, {} as Record<string, WordDetails>);
            setEditedData(prev => ({ ...prev, ...failedResults }));
          })
      );
      
      await Promise.all(fetchPromises);
      setAllLoaded(true);
    };

    // Initialize all words with a 'loading' state
    const initialData = wordsToProcess.reduce((acc, word) => {
      acc[word] = 'loading';
      return acc;
    }, {} as Record<string, 'loading'>);
    setEditedData(initialData);
    
    fetchInBatches();

  }, [wordsToProcess]);

  const handleWordChange = (word: string, field: keyof WordDetails, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [word]: { ...(prev[word] as WordDetails), [field]: value },
    }));
  };

  const handleDefinitionChange = (word: string, defIndex: number, field: keyof Definition, value: string) => {
    const currentDetails = editedData[word] as WordDetails;
    const newDefinitions = [...currentDetails.definitions];
    newDefinitions[defIndex] = { ...newDefinitions[defIndex], [field]: value };
    handleWordChange(word, 'definitions', newDefinitions);
  };
  
  const handleExampleChange = (word: string, exIndex: number, field: keyof ExampleSentence, value: string) => {
    const currentDetails = editedData[word] as WordDetails;
    const newExamples = [...currentDetails.examples];
    newExamples[exIndex] = { ...newExamples[exIndex], [field]: value };
    handleWordChange(word, 'examples', newExamples);
  };

  const addDefinition = (word: string) => {
    const currentDetails = editedData[word] as WordDetails;
    const newDefinitions = [...currentDetails.definitions, { partOfSpeech: '', meaning: '' }];
    handleWordChange(word, 'definitions', newDefinitions);
  };

  const removeDefinition = (word: string, defIndex: number) => {
    const currentDetails = editedData[word] as WordDetails;
    const newDefinitions = currentDetails.definitions.filter((_, i) => i !== defIndex);
    handleWordChange(word, 'definitions', newDefinitions);
  };
  
  const addExample = (word: string) => {
    const currentDetails = editedData[word] as WordDetails;
    const newExamples = [...currentDetails.examples, { english: '', chinese: '' }];
    handleWordChange(word, 'examples', newExamples);
  };
  
  const removeExample = (word: string, exIndex: number) => {
    const currentDetails = editedData[word] as WordDetails;
    const newExamples = currentDetails.examples.filter((_, i) => i !== exIndex);
    handleWordChange(word, 'examples', newExamples);
  };

  const handleRegenerate = async (word: string) => {
    setRegeneratingWord(word);
    try {
        const result = await fetchMultipleWordDetailsFromApi([word]);
        if (result[word]) {
            setEditedData(prev => ({ ...prev, [word]: result[word]}));
        }
    } catch (e) {
        console.error("Failed to regenerate word", e);
    } finally {
        setRegeneratingWord(null);
    }
  };
  
  const handleConfirmClick = async () => {
    setIsSaving(true);
    try {
      const finalData = Object.entries(editedData)
        .filter(([, details]) => details !== 'loading')
        .reduce((acc, [word, details]) => {
          acc[word] = details as WordDetails;
          return acc;
        }, {} as Record<string, WordDetails>);
      await onConfirm(finalData);
    } catch(e) {
      alert('保存失败，请稍后再试。');
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
        <p className="text-sm text-slate-500 mb-4">以下是为故事 “<strong>{story.title}</strong>” 新增的单词。请审核AI生成的内容，进行必要的修改，然后保存到词典中。</p>
        <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-4">
            {[...wordsToProcess].sort().map(word => {
              const details = editedData[word];
              
              const renderLoadingState = () => (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-slate-400"></div>
                  正在获取释义...
                </div>
              );

              return (
                <div key={word} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-bold capitalize text-slate-800">{word}</h4>
                        {details && details !== 'loading' && (
                          <button onClick={() => handleRegenerate(word)} disabled={!!regeneratingWord} className="p-1 text-slate-500 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed">
                            <RefreshIcon spinning={regeneratingWord === word} />
                          </button>
                        )}
                    </div>
                    
                    {!details || details === 'loading' ? (
                      renderLoadingState()
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">音标</label>
                                <input type="text" value={details.phonetic} onChange={e => handleWordChange(word, 'phonetic', e.target.value)} className="w-full text-sm p-1 border-b" />
                            </div>
                        </div>

                        <div className="mt-3">
                            <h5 className="text-xs font-semibold text-slate-500 mb-1">释义</h5>
                            {details.definitions.map((def, i) => (
                                <div key={i} className="flex items-center gap-2 mb-1">
                                    <input type="text" placeholder="词性" value={def.partOfSpeech} onChange={e => handleDefinitionChange(word, i, 'partOfSpeech', e.target.value)} className="w-16 text-sm p-1 border-b"/>
                                    <input type="text" placeholder="中文意思" value={def.meaning} onChange={e => handleDefinitionChange(word, i, 'meaning', e.target.value)} className="flex-grow text-sm p-1 border-b"/>
                                    <button onClick={() => removeDefinition(word, i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={() => addDefinition(word)} className="text-sm text-blue-600 hover:underline">+ 添加释义</button>
                        </div>

                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-slate-500 mb-1">例句</h5>
                          {details.examples.map((ex, i) => (
                            <div key={i} className="relative mb-2 pl-2 border-l-2">
                              <div className="flex items-center gap-2">
                                <input type="text" placeholder="English Example" value={ex.english} onChange={e => handleExampleChange(word, i, 'english', e.target.value)} className="flex-grow text-sm p-1 border-b"/>
                                <button onClick={() => removeExample(word, i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                              </div>
                              <input type="text" placeholder="Chinese Translation" value={ex.chinese} onChange={e => handleExampleChange(word, i, 'chinese', e.target.value)} className="w-full text-sm p-1 border-b mt-1"/>
                            </div>
                          ))}
                          <button onClick={() => addExample(word)} className="text-sm text-blue-600 hover:underline">+ 添加例句</button>
                        </div>
                      </>
                    )}
                </div>
            )})}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">取消</button>
            <button type="button" onClick={handleConfirmClick} disabled={isSaving || !allLoaded} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
              {isSaving ? '保存中...' : !allLoaded ? '加载中...' : '保存到词典'}
            </button>
        </div>
    </div>
  );
};


export default StoryManagementModal;