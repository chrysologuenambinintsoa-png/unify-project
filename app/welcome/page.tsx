'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Users, MessageCircle, Shield, Globe, Zap } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { language, translation, setLanguage } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Rediriger vers la page d'accueil si connecté
  useEffect(() => {
    const onboard = typeof window !== 'undefined' && localStorage.getItem('unify:showOnboard') === 'true';

    if (onboard) {
      setIsOnboarding(true);
      try {
        localStorage.removeItem('unify:showOnboard');
        // Keep a longer-lived marker that onboarding was shown (prevents re-showing accidentally)
        localStorage.setItem('unify:onboardShown', 'true');
      } catch (e) {
        // ignore storage errors
      }
    }

    if (status === 'authenticated' && !onboard) {
      router.push('/');
    }
  }, [status, router]);

  const slides = [
    {
      icon: Globe,
      title: 'Connectez-vous au monde',
      description: 'Rejoignez une communauté mondiale et partagez vos moments',
      color: 'from-blue-500 to-purple-600',
    },
    {
      icon: Users,
      title: 'Trouvez vos amis',
      description: 'Retrouvez vos amis et faites de nouvelles rencontres',
      color: 'from-green-500 to-teal-600',
    },
    {
      icon: MessageCircle,
      title: 'Discutez en temps réel',
      description: 'Échangez instantanément avec vos contacts',
      color: 'from-pink-500 to-rose-600',
    },
    {
      icon: Sparkles,
      title: 'Partagez vos stories',
      description: 'Créez des stories éphémères et captivantes',
      color: 'from-yellow-500 to-orange-600',
    },
    {
      icon: Shield,
      title: 'Vos données protégées',
      description: 'Votre vie privée est notre priorité absolue',
      color: 'from-indigo-500 to-blue-600',
    },
    {
      icon: Zap,
      title: 'Expérience rapide',
      description: 'Une interface moderne et performante',
      color: 'from-red-500 to-pink-600',
    },
  ];

  useEffect(() => {
    if (isOnboarding) return; // pause auto-advance during onboarding so users can read slides

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-amber-900 to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div
          className="text-center mb-8"
        >
          <img src="/logo.svg" alt="Unify Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Unify</h1>
        </div>
        <>
          {slides.map((slide, index) => (
            index === currentSlide && (
              <div
                key={index}
                className="text-center text-white"
              >
                <div
                  className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br rounded-3xl flex items-center justify-center shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${slide.color.replace('from-', '').replace('to-', ', ')})` }}
                >
                  <slide.icon className="w-16 h-16" />
                </div>

                <h1
                  className="text-4xl md:text-5xl font-bold mb-6"
                >
                  {slide.title}
                </h1>

                <p
                  className="text-xl text-blue-100 mb-12"
                >
                  {slide.description}
                </p>

                {/* Slide Indicators */}
                <div className="flex justify-center space-x-3 mb-12">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-3 h-3 rounded-full ${
                        i === currentSlide
                          ? 'bg-white scale-125'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </>

        {/* Language Selector */}
        <div
          className="flex justify-center mb-8"
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="fr" className="text-gray-900">🇫🇷 Français</option>
            <option value="mg" className="text-gray-900">🇲🇬 Malagasy</option>
            <option value="en" className="text-gray-900">🇬🇧 English</option>
            <option value="es" className="text-gray-900">🇪🇸 Español</option>
            <option value="de" className="text-gray-900">🇩🇪 Deutsch</option>
            <option value="ch" className="text-gray-900">🇨🇳 中文</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isOnboarding && (
            <>
              <Link href="/auth/register">
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100">
                  {translation.auth.createAccount}
                </button>
              </Link>

              <Link href="/auth/login">
                <button className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20">
                  {translation.auth.signIn}
                </button>
              </Link>
            </>
          )}

          <Link href="/help">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent-dark to-primary-dark text-white rounded-xl font-bold text-lg hover:shadow-lg">
              Suivant →
            </button>
          </Link>
        </div>

        {/* Logo */}
        <div
          className="mt-16 text-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-dark font-bold text-3xl">U</span>
          </div>
          <p className="text-white/60 text-sm">Unify - Connectez-vous au monde</p>
        </div>
      </div>
    </div>
  );
}