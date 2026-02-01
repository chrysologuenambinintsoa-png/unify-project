'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, BookOpen, Briefcase, User, Phone, Share2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface EducationInfo {
  name?: string;
  startDate?: string;
  endDate?: string;
  diploma?: string;
}

interface AboutSection {
  dateOfBirth?: string;
  originCity?: string;
  currentCity?: string;
  college?: EducationInfo;
  highSchool?: EducationInfo;
  university?: EducationInfo;
  following?: number;
  familyRelations?: string;
  pseudonym?: string;
  mobileContact?: string;
  skills?: string[];
}

interface AboutProps {
  about: AboutSection;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

export const About: React.FC<AboutProps> = ({ about, isOwnProfile, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatEducationPeriod = (startDate?: string, endDate?: string): string => {
    if (!startDate && !endDate) return '';
    let period = '';
    if (startDate) {
      period += formatDate(startDate);
    }
    if (startDate && endDate) {
      period += ' - ';
    }
    if (endDate) {
      period += formatDate(endDate);
    }
    return period;
  };

  const hasInfo = Object.values(about).some(value => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null && v !== '');
    }
    return true;
  });

  if (!hasInfo && !isOwnProfile) {
    return null;
  }

  const sections = [
    {
      icon: User,
      label: 'Pseudo',
      value: about.pseudonym,
      key: 'pseudonym',
    },
    {
      icon: Calendar,
      label: 'Date de naissance',
      value: about.dateOfBirth ? formatDate(about.dateOfBirth) : undefined,
      key: 'dateOfBirth',
    },
    {
      icon: MapPin,
      label: 'Ville d\'origine',
      value: about.originCity,
      key: 'originCity',
    },
    {
      icon: MapPin,
      label: 'Ville actuelle',
      value: about.currentCity,
      key: 'currentCity',
    },
    {
      icon: Phone,
      label: 'Contact mobile',
      value: about.mobileContact,
      key: 'mobileContact',
    },
    {
      icon: Share2,
      label: 'En suivi',
      value: about.following ? `${about.following}` : undefined,
      key: 'following',
    },
    {
      icon: LinkIcon,
      label: 'Liens de parenté',
      value: about.familyRelations,
      key: 'familyRelations',
    },
  ];

  const filledSections = sections.filter(s => s.value);

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">À propos</h2>
        {isOwnProfile && (
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
          >
            Modifier
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Info Grid */}
        {filledSections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filledSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3"
                >
                  <Icon className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{section.label}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{section.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Education Sections */}
        {(about.college?.name || about.highSchool?.name || about.university?.name) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            {/* College */}
            {about.college?.name && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3"
              >
                <BookOpen className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Collège</p>
                  <p className="text-gray-900 dark:text-white font-medium">{about.college.name}</p>
                  {(about.college.startDate || about.college.endDate) && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {formatEducationPeriod(about.college.startDate, about.college.endDate)}
                    </p>
                  )}
                  {about.college.diploma && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Diplôme: {about.college.diploma}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* High School */}
            {about.highSchool?.name && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3"
              >
                <BookOpen className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lycée</p>
                  <p className="text-gray-900 dark:text-white font-medium">{about.highSchool.name}</p>
                  {(about.highSchool.startDate || about.highSchool.endDate) && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {formatEducationPeriod(about.highSchool.startDate, about.highSchool.endDate)}
                    </p>
                  )}
                  {about.highSchool.diploma && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Diplôme: {about.highSchool.diploma}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* University */}
            {about.university?.name && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3"
              >
                <BookOpen className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Université</p>
                  <p className="text-gray-900 dark:text-white font-medium">{about.university.name}</p>
                  {(about.university.startDate || about.university.endDate) && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {formatEducationPeriod(about.university.startDate, about.university.endDate)}
                    </p>
                  )}
                  {about.university.diploma && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Diplôme: {about.university.diploma}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Skills Section */}
        {about.skills && about.skills.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Briefcase className="w-5 h-5 text-blue-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Compétences</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {about.skills.map((skill, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {!hasInfo && isOwnProfile && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-6">
            Complétez votre profil pour que d'autres utilisateurs apprennent à vous connaître
          </p>
        )}
      </div>
    </Card>
  );
};
