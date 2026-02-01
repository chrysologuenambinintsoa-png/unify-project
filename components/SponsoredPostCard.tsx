'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap } from 'lucide-react';

interface SponsoredPostProps {
  id: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  link?: string;
  advertiser: string;
  impressions: number;
  clicks: number;
}

export default function SponsoredPostCard({
  id,
  title,
  description,
  content,
  image,
  link,
  advertiser,
  impressions,
  clicks,
}: SponsoredPostProps) {
  // Track impression when component mounts
  useEffect(() => {
    const trackImpression = async () => {
      try {
        await fetch(`/api/sponsored/${id}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'impression' }),
        });
      } catch (err) {
        console.error('Error tracking impression:', err);
      }
    };

    trackImpression();
  }, [id]);

  const handleClick = async () => {
    try {
      await fetch(`/api/sponsored/${id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' }),
      });

      if (link) {
        window.open(link, '_blank');
      }
    } catch (err) {
      console.error('Error tracking click:', err);
      if (link) {
        window.open(link, '_blank');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md border border-blue-200 overflow-hidden hover:shadow-lg transition cursor-pointer"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-100 border-b border-blue-200">
        <div className="flex items-center space-x-2">
          <Zap size={18} className="text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase">Sponsorisé</span>
        </div>
        <p className="text-xs text-gray-600">Par {advertiser}</p>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Image if provided */}
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{description}</p>

        {/* Content preview */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{content}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{impressions.toLocaleString()} vues</span>
          <span>{clicks.toLocaleString()} clics</span>
        </div>

        {/* CTA Button */}
        {link && (
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span>En savoir plus</span>
              <ExternalLink size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
