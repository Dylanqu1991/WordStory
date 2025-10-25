import React from 'react';
import type { VocabularyLibrary, StorySeries } from '../types';
import { FolderIcon } from './Icons';

interface SeriesListProps {
  library?: VocabularyLibrary;
  series?: StorySeries;
  onSelectSeries?: (id: string) => void;
  onSelectStory?: (id: string) => void;
}

const SeriesList: React.FC<SeriesListProps> = ({ library, series, onSelectSeries, onSelectStory }) => {
  
  // Display list of series in a library
  if (library && onSelectSeries) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{library.title}</h1>
        <p className="text-slate-500 mb-8">{library.description}</p>
        <div className="space-y-4">
          {library.series.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSeries(s.id)}
              className="w-full text-left flex items-center gap-4 bg-white p-5 rounded-lg shadow border border-slate-200 hover:bg-slate-50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">
                <FolderIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-700">{s.title}</h2>
                <p className="text-slate-500 text-sm">{s.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Display list of stories in a series
  if (series && onSelectStory) {
     return (
      <div className="animate-fade-in">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-200">
           {series.stories.length > 0 ? series.stories.map((story, index) => {
             if (story.status === 'caching' || story.status === 'reviewing') {
               const isReviewing = story.status === 'reviewing';
               return (
                  <div key={story.id} className="w-full text-left p-5 bg-slate-50 cursor-not-allowed">
                      <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 pt-0.5 text-right font-bold text-lg text-slate-400">{index + 1}.</span>
                          <div className="flex-1">
                              <h3 className="text-xl font-semibold text-slate-500">{story.title}</h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                                  {isReviewing ? (
                                    <span className="text-amber-600 font-semibold">待审核</span>
                                  ) : (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-slate-400"></div>
                                      <span>单词缓存中...</span>
                                    </>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
               );
             }
             return (
                <button
                key={story.id}
                onClick={() => onSelectStory(story.id)}
                className="w-full text-left p-5 hover:bg-slate-50 transition-colors block focus:outline-none focus:bg-slate-100"
                >
                    <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 pt-0.5 text-right font-bold text-lg text-slate-400">{index + 1}.</span>
                    <div>
                        <h3 className="text-xl font-semibold text-blue-600">{story.title}</h3>
                        <p className="text-slate-500 text-sm mt-1">
                        {story.content.substring(0, 120)}...
                        </p>
                    </div>
                </div>
                </button>
             );
           }) : (
            <div className="p-8 text-center text-slate-500">
                <p>No stories in this series yet.</p>
                <p className="text-sm">You can add one via the "Manage Stories" button.</p>
            </div>
           )}
        </div>
      </div>
    );
  }

  return null;
};

export default SeriesList;