'use client';

import React, { useState } from 'react';
import { BarChart3, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

interface Poll {
  id: string;
  question: string;
  description?: string;
  status: string;
  options: PollOption[];
}

interface PollFormProps {
  pageId?: string;
  groupId?: string;
  onPollCreated?: () => void;
}

export function PollForm({ pageId, groupId, onPollCreated }: PollFormProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    if (options.filter(o => o.trim()).length < 2) {
      setError('At least 2 options are required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          groupId,
          question,
          description,
          options: options.filter(o => o.trim()),
          allowMultiple,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create poll');
      }

      // Reset form
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
      setAllowMultiple(false);
      onPollCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-amber-500/20">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold">Create Poll</h3>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

      <input
        type="text"
        placeholder="Poll question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full bg-gray-700/50 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-700/50 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500 resize-none h-16"
      />

      <div className="space-y-2">
        <label className="text-sm text-gray-300">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-1 bg-gray-700/50 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                className="text-red-400"
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addOption} className="w-full">
        Add Option
      </Button>

      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={allowMultiple}
          onChange={(e) => setAllowMultiple(e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-sm text-gray-300">Allow multiple answers</span>
      </label>

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Creating...' : 'Create Poll'}</span>
      </Button>
    </form>
  );
}
