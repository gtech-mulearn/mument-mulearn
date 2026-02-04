'use client';

import ComingSoon from '@/components/ComingSoon';
import { Flame, Star, Trophy, Zap, Crown, Lightbulb, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface StreakSocietyProps {
  streak: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  inactive: React.ReactNode;
  active: React.ReactNode;
  milestone: number;
  color: string;
  unlocked: boolean;
}


export default function StreakSociety({ streak }: StreakSocietyProps) {
  const [activeTab, setActiveTab] = useState<'badges' | 'milestones' | 'checkpoints'>('badges');

  const badges: Badge[] = [
    {
      id: 'spark',
      name: 'Spark',
      description: 'Start your journey',
      inactive: <Zap size={24} className='fill-white' />,
      active: <Image src='/thunder.gif' alt="Spark" width={24} height={24} className=''/>,
      milestone: 1,
      color: 'bg-yellow-500',
      unlocked: streak >= 1,
    },
    {
      id: 'rising-star',
      name: 'Rising Star',
      description: 'Build momentum',
      inactive: <Star size={24} className='fill-white' />,
      active: <Image src='/star.gif' alt="Rising Star" width={24} height={24} className=''/>,
      milestone: 3,
      color: 'bg-blue-500',
      unlocked: streak >= 3,
    },
    {
      id: 'flame',
      name: 'On Fire',
      description: 'Keep the heat on',
      inactive: <Flame size={24} className='fill-white' />,
      active: <Image src='/fire.gif' alt="On Fire" width={24} height={24} className=''/>,
      milestone: 7,
      color: 'bg-orange-500',
      unlocked: streak >= 7,
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Legendary streak',
      inactive: <Trophy size={24} className='fill-white' />,
      active: <Image src='/trophy.gif' alt="Champion" width={24} height={24} className=''/>,
      milestone: 14,
      color: 'bg-purple-500',
      unlocked: streak >= 14,
    },
    {
      id: 'crown',
      name: 'Crown Holder',
      description: 'Mument Legend',
      inactive: <Crown size={24} className='fill-white' />,
      active: <Image src='/crown.gif' alt="Crown Holder" width={24} height={24} className=''/>,
      milestone: 30,
      color: 'bg-red-500',
      unlocked: streak >= 30,
    },
  ];

  const milestones = [
    { day: 3, reward: 'Rising Star Badge', description: 'Build momentum', emoji: <Star size={24} className='fill-blue-500 text-blue-500 inline-block' /> },
    { day: 7, reward: 'On Fire Badge', description: 'Keep the heat on', emoji: <Flame size={24} className='fill-orange-500 text-orange-500 inline-block' /> },
    { day: 14, reward: 'Magic Badge', description: 'Unlock magic powers', emoji: <Wand2 size={24} className='fill-purple-500 text-purple-500 inline-block' /> },
    { day: 21, reward: 'Champion Badge', description: 'Become a champion', emoji: <Trophy size={24} className='fill-yellow-500 text-yellow-500 inline-block' /> },
    { day: 30, reward: 'Crown Holder Badge + Recognition', description: 'Prepare for Demo day', emoji: <Crown size={24} className='fill-red-500 text-red-500 inline-block' /> },
  ];

  const getProgressPercentage = (milestone: number) => {
    return Math.min((streak / milestone) * 100, 100);
  };

  const getNextMilestone = () => {
    return milestones.find(m => m.day > streak);
  };

  return (
    <div className="w-full space-y-6">
      {/* Streak Counter Header */}
      <div className="bg-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Current Streak</p>
            <h2 className="text-5xl font-bold mt-2">{streak} / 30 Days</h2>
          </div>
          <div className="text-7xl">
            {streak != 0 ? (
              <Image src='/fire.gif' alt="Flame" width={80} height={80} className="opacity-100" />
            ) : (
              <Flame size={80} className="fill-white opacity-30" />
            )}
          </div>
        </div>

        {/* Next Milestone Preview */}
        {getNextMilestone() && (
          <div className="mt-6 p-4 bg-black/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm opacity-90">Next milestone in {getNextMilestone()!.day - streak} days</p>
            <p className="font-semibold text-lg mt-1">{getNextMilestone()?.reward}</p>
          </div>
        )}

        {streak === 30 && (
          <div className="mt-6 p-4 bg-green-400/20 rounded-lg backdrop-blur-sm border border-green-300">
            <p className="font-bold text-lg">🎉 You completed the Mument 30-Day Challenge!</p>
            <p className="text-sm mt-1">Congratulations on achieving the Crown Holder badge!</p>
          </div>
        )}
      </div>

      {/* Tab Navigation - Folder Style */}
      <div className="flex items-end -space-x-2 overflow-x-auto pb-1 px-1 custom-scrollbar">
        {([
          { id: 'badges', label: 'Badges', icon: Trophy },
          { id: 'milestones', label: 'Milestones', icon: Star },
          { id: 'checkpoints', label: 'Checkpoints', icon: Crown } // Using Crown temporarily or MapPin if imported
        ] as const).map(tab => {
          const isActive = activeTab === tab.id
          // const Icon = tab.id === 'checkpoints' ? Zap : tab.icon // Overriding for variety, or reuse imports

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                  relative flex items-center gap-2 px-6 py-3 rounded-t-xl border-t border-x transition-all duration-300 ease-in-out
                  ${isActive
                  ? 'z-10 bg-white border-slate-200 text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-4 -mb-1 min-w-[140px]'
                  : 'z-0 bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-50 min-w-[60px] max-w-[60px] md:max-w-none md:min-w-[120px]'
                }
                `}
              title={tab.label}
            >
              <tab.icon size={18} className="shrink-0" />
              <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${isActive ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 md:opacity-100 md:max-w-[200px]'
                }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map(badge => (
              <div
                key={badge.id}
                className={`relative p-6 rounded-xl transition-all duration-300 ${badge.unlocked
                    ? `${badge.color} text-white shadow-lg scale-100`
                    : 'bg-slate-100 text-slate-600 grayscale'
                  }`}
              >
                <div className="transition-opacity">
                  <div className='flex flex-row justify-between'>
                  {badge.unlocked ? badge.active : badge.inactive}
                  <div className="flex items-start justify-between mb-2">
                    {badge.unlocked && (
                      <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                        Day {badge.milestone}+
                      </div>
                    )}
                  </div>
                  </div>
                  <h3 className="font-bold text-lg mt-2">{badge.name}</h3>
                  <p className={`text-sm mt-2 ${badge.unlocked ? 'opacity-90' : 'opacity-60'}`}>
                    {badge.description}
                  </p>
                  {!badge.unlocked && (
                    <p className="text-xs mt-3 font-medium opacity-70">
                      Unlock in {badge.milestone - streak} days
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {milestones.map((milestone, idx) => {
            const isComplete = streak >= milestone.day;
            const isNext = !isComplete && (!milestones[idx + 1] || streak < milestones[idx + 1].day);
            const progress = getProgressPercentage(milestone.day);

            return (
              <div
                key={milestone.day}
                className={`p-4 rounded-lg border-2 transition-all ${isComplete
                    ? 'bg-green-50 border-green-200'
                    : isNext
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{milestone.emoji}</span>
                    <div>
                      <h4 className="font-bold text-slate-900">Day {milestone.day}</h4>
                      <p className="text-sm text-slate-600">{milestone.reward}<span className="text-xs text-slate-500"> - {milestone.description}</span></p>

                    </div>
                  </div>
                  {isComplete && <span className="text-green-600 font-bold text-sm">✓ UNLOCKED</span>}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : isNext ? 'bg-blue-500' : 'bg-slate-400'
                      }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {isComplete
                    ? 'Completed'
                    : `${streak}/${milestone.day} days (${Math.round(progress)}%)`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkpoints Tab */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-4">
          <div className="relative">
            {/* Timeline line */}
            <ComingSoon />
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-slate-900 mb-3"><Lightbulb className="inline-block size-4" /> Tips to Maintain Your Streak</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Post a daily update every single day
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Aim to update before midnight in your timezone
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Share meaningful updates to inspire your community
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Check in on other members and support their streaks
          </li>
        </ul>
      </div>
    </div>
  );
}
