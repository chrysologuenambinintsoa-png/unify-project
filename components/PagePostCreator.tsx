'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Send, X, Smile, MapPin, Video, UserPlus, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface PagePostCreatorProps {
  pageId: string;
  onPostCreated?: () => void;
}

export function PagePostCreator({ pageId, onPostCreated }: PagePostCreatorProps) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [audience, setAudience] = useState<'Public' | 'Friends' | 'Only me' | 'Page'>('Public');
  const [tags, setTags] = useState<string[]>([]);
  const [emotion, setEmotion] = useState('');
  const [location, setLocation] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showEmotionDropdown, setShowEmotionDropdown] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [filteredFriends, setFilteredFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  
  const sampleFriends = ['Alice Dupont', 'Bob Martin', 'Charlie Brown', 'Diana Prince', 'Eve Johnson', 'Frank Wilson', 'Grace Lee', 'Henry Davis', 'Iris Chen', 'Jack Smith'];
  
  const emotionsList = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '🤩', label: 'Excited' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🙏', label: 'Grateful' },
    { emoji: '🤔', label: 'Confused' },
    { emoji: '❤️', label: 'Loved' },
    { emoji: '💪', label: 'Motivated' },
    { emoji: '😎', label: 'Confident' },
  ];

  // Initialize friends on mount
  useEffect(() => {
    setFriends(sampleFriends);
  }, []);

  // Handle friend search
  const handleTagSearchChange = (value: string) => {
    setTagSearchInput(value);
    if (value.trim()) {
      const filtered = friends.filter(friend =>
        friend.toLowerCase().includes(value.toLowerCase()) && !tags.includes(friend)
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends([]);
    }
  };

  // Add friend tag
  const addTag = (friend: string) => {
    if (!tags.includes(friend)) {
      setTags([...tags, friend]);
      setTagSearchInput('');
      setFilteredFriends([]);
    }
  };

  // Remove friend tag
  const removeTag = (friend: string) => {
    setTags(tags.filter(t => t !== friend));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length + selectedImages.length > 4) {
      setError('Maximum 4 images authorisées');
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setError('');
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      setError('Veuillez écrire quelque chose ou ajouter une image');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('content', content);
      formData.append('pageId', pageId);
      formData.append('type', 'page');
      formData.append('audience', audience);
      formData.append('tags', JSON.stringify(tags));
      formData.append('emotion', emotion);
      formData.append('location', location);
      formData.append('isLive', JSON.stringify(isLive));

      selectedImages.forEach((img, idx) => {
        formData.append(`images`, img);
      });

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create post (${res.status})`);
      }

      setContent('');
      setSelectedImages([]);
      setImagePreviews([]);
      setTags([]);
      setEmotion('');
      setLocation('');
      setIsLive(false);
      onPostCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-6">
      {/* Collapsed composer (Facebook-like) */}
      {!expanded ? (
        <div className="flex items-center gap-3">
          {session?.user && (
            <Avatar src={session.user.image || null} alt={session.user.name || 'User'} name={session.user.name || session.user.username} userId={session.user.id} size="md" />
          )}
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 text-left p-3 border border-gray-200 rounded-full bg-gray-50 hover:bg-gray-100 transition"
          >
            {`Quoi de neuf, ${session?.user?.name || session?.user?.username || 'ami'}?`}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
          >
            <ImageIcon size={20} />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-3">
            {session?.user && (
              <Avatar src={session.user.image || null} alt={session.user.name || 'User'} name={session.user.name || session.user.username} userId={session.user.id} size="md" />
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Quoi de neuf, ${session?.user?.name || session?.user?.username || 'ami'}?`}
                disabled={isLoading}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                rows={4}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2 text-sm text-gray-600 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || selectedImages.length >= 4}
                    className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ImageIcon size={16} /> Photo/vidéo
                  </button>
                  
                  {/* Live Toggle */}
                  <button 
                    onClick={() => setIsLive(!isLive)}
                    className={`flex items-center gap-1 p-2 rounded-lg transition ${
                      isLive ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className={isLive ? 'w-2 h-2 bg-red-700 rounded-full animate-pulse' : 'w-2 h-2 bg-gray-400 rounded-full'}></span>
                    <span className="text-sm font-medium">Live</span>
                  </button>
                  
                  {/* Identify Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                      className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <UserPlus size={16} /> Identifier {tags.length > 0 && <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{tags.length}</span>}
                    </button>
                    {showTagDropdown && (
                      <div className="absolute top-12 left-0 bg-white shadow-lg rounded-lg p-3 z-20 min-w-56 border border-gray-200">
                        <input
                          type="text"
                          placeholder="Search friends..."
                          value={tagSearchInput}
                          onChange={(e) => handleTagSearchChange(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg mb-2 text-sm focus:outline-none focus:border-indigo-500"
                          autoComplete="off"
                        />
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {filteredFriends.length > 0 ? (
                            filteredFriends.map(friend => (
                              <button
                                key={friend}
                                onClick={() => addTag(friend)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm transition"
                              >
                                {friend}
                              </button>
                            ))
                          ) : tagSearchInput ? (
                            <p className="text-xs text-gray-500 p-2 text-center">No friends found</p>
                          ) : (
                            <p className="text-xs text-gray-500 p-2 text-center">Start typing to search</p>
                          )}
                        </div>
                        {tags.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-semibold mb-2 text-gray-600">Tagged ({tags.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {tags.map(tag => (
                                <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => removeTag(tag)} className="ml-1 font-bold hover:text-blue-900">×</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Emotion Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmotionDropdown(!showEmotionDropdown)}
                      className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Smile size={16} /> Émotion {emotion && <span className="text-xs bg-purple-500 text-white rounded px-1.5">✓</span>}
                    </button>
                    {showEmotionDropdown && (
                      <div className="absolute top-12 left-0 bg-white shadow-lg rounded-lg p-3 z-20 min-w-56 border border-gray-200">
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          {emotionsList.map(emot => (
                            <button
                              key={emot.label}
                              onClick={() => {
                                setEmotion(emot.label);
                                setShowEmotionDropdown(false);
                              }}
                              className={`p-2 rounded-lg transition text-lg hover:scale-110 ${
                                emotion === emot.label
                                  ? 'bg-purple-200 ring-2 ring-purple-500'
                                  : 'hover:bg-gray-100'
                              }`}
                              title={emot.label}
                            >
                              {emot.emoji}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Or type custom..."
                          value={emotion}
                          onChange={(e) => setEmotion(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Location Button */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      autoComplete="off"
                      className="p-2 hover:bg-gray-100 rounded-lg transition border border-transparent focus:border-gray-300 focus:outline-none text-sm w-32"
                    />
                    <MapPin size={14} className="absolute right-3 top-3.5 text-gray-600 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-full bg-gray-50 hover:bg-gray-100">
                      <Globe size={14} /> <span className="text-xs">{audience}</span>
                    </button>
                    {/* Simple inline selector */}
                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-10 hidden group-hover:block" />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || (!content.trim() && selectedImages.length === 0)}
                    className="flex items-center gap-2"
                  >
                    <Send size={16} />
                    {isLoading ? 'Publication...' : 'Publier'}
                  </Button>
                  <button onClick={() => { setExpanded(false); setContent(''); setSelectedImages([]); setImagePreviews([]); setTags([]); setEmotion(''); setLocation(''); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Post Details Display */}
          {(isLive || emotion || location || tags.length > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
              <div className="space-y-1">
                {isLive && (
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                    Going Live
                  </div>
                )}
                {emotion && (
                  <div className="flex items-center gap-2">
                    <span>😊</span>
                    <span className="text-gray-700">Feeling <strong>{emotion}</strong></span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="text-gray-700">at <strong>{location}</strong></span>
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>👥</span>
                    <span className="text-gray-700">with</span>
                    {tags.map((tag, idx) => (
                      <span key={idx} className="bg-blue-200 px-2 py-1 rounded text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <Image
                    src={preview}
                    alt={`Preview ${idx}`}
                    width={150}
                    height={150}
                    className="w-full h-36 md:h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleImageSelect}
            disabled={isLoading}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
