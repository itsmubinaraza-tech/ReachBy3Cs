'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface CategoryOption {
  id: string;
  name: string;
  description?: string;
  isCustom?: boolean;
}

// Default categories that can be selected
const defaultCategories: CategoryOption[] = [
  { id: 'relationship-communication', name: 'Relationship Communication', description: 'Issues with communication in relationships' },
  { id: 'emotional-awareness', name: 'Emotional Awareness', description: 'Understanding and managing emotions' },
  { id: 'conflict-resolution', name: 'Conflict Resolution', description: 'Resolving disputes and disagreements' },
  { id: 'stress-management', name: 'Stress Management', description: 'Dealing with stress and anxiety' },
  { id: 'work-life-balance', name: 'Work-Life Balance', description: 'Balancing professional and personal life' },
  { id: 'productivity', name: 'Productivity', description: 'Getting more done efficiently' },
  { id: 'health-wellness', name: 'Health & Wellness', description: 'Physical and mental health concerns' },
  { id: 'career-growth', name: 'Career Growth', description: 'Professional development and advancement' },
  { id: 'financial-management', name: 'Financial Management', description: 'Money management and budgeting' },
  { id: 'learning-education', name: 'Learning & Education', description: 'Educational challenges and growth' },
  { id: 'parenting', name: 'Parenting', description: 'Challenges in raising children' },
  { id: 'fitness-exercise', name: 'Fitness & Exercise', description: 'Physical fitness and exercise routines' },
];

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  customCategories?: CategoryOption[];
  onAddCustomCategory?: (name: string) => void;
}

export function CategorySelector({
  selectedCategories,
  onCategoriesChange,
  customCategories = [],
  onAddCustomCategory,
}: CategorySelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const allCategories = [...defaultCategories, ...customCategories];

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategoryName.trim() && onAddCustomCategory) {
      onAddCustomCategory(customCategoryName.trim());
      setCustomCategoryName('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select the problem categories that your product addresses. This helps us find relevant conversations.
      </p>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border text-left transition-colors',
              selectedCategories.includes(category.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5',
                selectedCategories.includes(category.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              )}
            >
              {selectedCategories.includes(category.id) && (
                <CheckIcon className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium',
                  selectedCategories.includes(category.id)
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                {category.name}
                {category.isCustom && (
                  <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </p>
              {category.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {category.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add Custom Category */}
      {onAddCustomCategory && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {showCustomInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomCategory();
                  } else if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomCategoryName('');
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomCategory}
                disabled={!customCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomCategoryName('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Custom Category</span>
            </button>
          )}
        </div>
      )}

      {/* Selection Summary */}
      <div className="pt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedCategories.length === 0 ? (
            'No categories selected'
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedCategories.length}
              </span>{' '}
              {selectedCategories.length === 1 ? 'category' : 'categories'} selected
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
