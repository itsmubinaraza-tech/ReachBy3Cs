'use client';

import { useState, useEffect } from 'react';
import { Wizard, CategorySelector, type CategoryOption } from '@/components/onboarding';
import { useOrg } from '@/contexts/org-context';
import { saveProblemCategories } from '@/lib/onboarding/actions';
import { createClient } from '@/lib/supabase/client';

export default function CategoriesOnboardingPage() {
  const { organization } = useOrg();
  const supabase = createClient();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<CategoryOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing categories
  useEffect(() => {
    async function loadCategories() {
      if (!organization?.id) return;

      const { data } = await supabase
        .from('problem_categories')
        .select('id, name, is_ai_generated')
        .eq('organization_id', organization.id);

      if (data && data.length > 0) {
        setSelectedCategories(data.map((c) => c.id));
        setCustomCategories(
          data
            .filter((c) => !c.is_ai_generated)
            .map((c) => ({
              id: c.id,
              name: c.name,
              isCustom: true,
            }))
        );
      }

      setIsLoading(false);
    }

    loadCategories();
  }, [organization?.id, supabase]);

  const handleAddCustomCategory = (name: string) => {
    const id = `custom-${Date.now()}`;
    setCustomCategories([
      ...customCategories,
      { id, name, isCustom: true },
    ]);
    setSelectedCategories([...selectedCategories, id]);
  };

  const handleNext = async (): Promise<boolean> => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one problem category');
      return false;
    }

    if (!organization?.id) {
      setError('Organization not loaded');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    // Convert selected IDs to category data
    const defaultCategoryNames: Record<string, string> = {
      'relationship-communication': 'Relationship Communication',
      'emotional-awareness': 'Emotional Awareness',
      'conflict-resolution': 'Conflict Resolution',
      'stress-management': 'Stress Management',
      'work-life-balance': 'Work-Life Balance',
      'productivity': 'Productivity',
      'health-wellness': 'Health & Wellness',
      'career-growth': 'Career Growth',
      'financial-management': 'Financial Management',
      'learning-education': 'Learning & Education',
      'parenting': 'Parenting',
      'fitness-exercise': 'Fitness & Exercise',
    };

    const categories = selectedCategories.map((id) => {
      const customCat = customCategories.find((c) => c.id === id);
      if (customCat) {
        return { name: customCat.name, isCustom: true };
      }
      return {
        name: defaultCategoryNames[id] || id,
        isCustom: false,
      };
    });

    const result = await saveProblemCategories(organization.id, categories);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return false;
    }

    return true;
  };

  if (isLoading) {
    return (
      <Wizard currentStep={2} title="Loading categories..." description="">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </Wizard>
    );
  }

  return (
    <Wizard
      currentStep={2}
      title="What problems does your product solve?"
      description="Select the categories that best describe the problems your product addresses."
      onNext={handleNext}
      isSubmitting={isSubmitting}
      nextDisabled={selectedCategories.length === 0}
    >
      <CategorySelector
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        customCategories={customCategories}
        onAddCustomCategory={handleAddCustomCategory}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </Wizard>
  );
}
