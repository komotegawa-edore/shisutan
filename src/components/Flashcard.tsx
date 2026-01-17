'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Word, words, getWordSets, getWordsInRange, shuffleWords } from '@/data/words';

type SetSize = 50 | 100;
type GameState = 'setup' | 'playing' | 'finished';

export default function Flashcard() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [setSize, setSetSize] = useState<SetSize>(100);
  const [selectedSet, setSelectedSet] = useState<{ start: number; end: number } | null>(null);
  const [currentWords, setCurrentWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format timer
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start game
  const startGame = () => {
    if (!selectedSet) return;
    const wordsInRange = getWordsInRange(selectedSet.start, selectedSet.end);
    const shuffled = shuffleWords(wordsInRange);
    // setSize分だけ取得（範囲内の単語数より多い場合は全部）
    const wordsToStudy = shuffled.slice(0, Math.min(setSize, shuffled.length));
    setCurrentWords(wordsToStudy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setTimer(0);
    setIsTimerRunning(true);
    setGameState('playing');
  };

  // Next card
  const nextCard = useCallback(() => {
    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsTimerRunning(false);
      setGameState('finished');
    }
  }, [currentIndex, currentWords.length]);

  // Previous card
  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  // Flip card
  const flipCard = () => {
    setIsFlipped(prev => !prev);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next
        nextCard();
      } else {
        // Swipe right - previous
        prevCard();
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          flipCard();
          break;
        case 'ArrowRight':
          nextCard();
          break;
        case 'ArrowLeft':
          prevCard();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, nextCard, prevCard]);

  // Reset to setup
  const resetGame = () => {
    setGameState('setup');
    setTimer(0);
    setIsTimerRunning(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // 300語ずつの範囲を生成
  const rangeSets = getWordSets(300);

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
          英単語フラッシュカード
        </h1>

        {/* Set size selection */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">1回の学習語数</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSetSize(50)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                setSize === 50
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              50語
            </button>
            <button
              onClick={() => setSetSize(100)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                setSize === 100
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              100語
            </button>
          </div>
        </div>

        {/* Range selection */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mb-6 max-h-[40vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">範囲を選択</h2>
          <div className="grid gap-2">
            {/* Full range option */}
            <button
              onClick={() => setSelectedSet({ start: 1, end: words.length, label: `全範囲 (No.1 - No.${words.length})` })}
              className={`w-full py-3 px-4 rounded-xl font-medium text-left transition-all ${
                selectedSet?.start === 1 && selectedSet?.end === words.length
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全範囲 ({words.length}語)
            </button>
            {/* 300-word range options */}
            {rangeSets.map((set, index) => (
              <button
                key={index}
                onClick={() => setSelectedSet(set)}
                className={`w-full py-3 px-4 rounded-xl font-medium text-left transition-all ${
                  selectedSet?.start === set.start && selectedSet?.end !== words.length
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {set.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startGame}
          disabled={!selectedSet}
          className={`w-full max-w-md py-4 rounded-xl font-bold text-lg transition-all ${
            selectedSet
              ? 'bg-white text-purple-600 hover:bg-gray-100 shadow-xl'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          スタート
        </button>
      </div>
    );
  }

  // Finished screen
  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">完了!</h2>
          <p className="text-gray-600 mb-2">
            {currentWords.length}語を学習しました
          </p>
          <p className="text-3xl font-bold text-purple-600 mb-6">
            {formatTime(timer)}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setTimer(0);
                setIsTimerRunning(true);
                setCurrentWords(shuffleWords(currentWords));
                setGameState('playing');
              }}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
            >
              もう一度
            </button>
            <button
              onClick={resetGame}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              セット選択に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing screen
  const currentWord = currentWords[currentIndex];

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={resetGame}
          className="text-white/80 hover:text-white text-sm"
        >
          ← 戻る
        </button>
        <div className="text-white font-mono text-xl">
          {formatTime(timer)}
        </div>
        <div className="text-white/80 text-sm">
          {currentIndex + 1} / {currentWords.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/20 rounded-full mb-6">
        <div
          className="h-full bg-white rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / currentWords.length) * 100}%` }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={cardRef}
          className="w-full max-w-sm aspect-[3/4] perspective-1000"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={flipCard}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front - English */}
            <div
              className="absolute w-full h-full bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-sm text-gray-400 mb-2">No. {currentWord.number}</span>
              <span className="text-4xl md:text-5xl font-bold text-gray-800 text-center">
                {currentWord.english}
              </span>
              <span className="text-sm text-gray-400 mt-8">タップで意味を表示</span>
            </div>

            {/* Back - Japanese */}
            <div
              className="absolute w-full h-full bg-purple-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <span className="text-sm text-white/70 mb-2">No. {currentWord.number}</span>
              <span className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
                {currentWord.english}
              </span>
              <div className="w-16 h-0.5 bg-white/30 mb-4"></div>
              <span className="text-xl md:text-2xl text-white/90 text-center">
                {currentWord.japanese}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation hint */}
      <div className="text-center text-white/60 text-sm mt-4 mb-2">
        ← スワイプで移動 →
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-4 mt-2">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
            currentIndex === 0
              ? 'bg-white/20 text-white/40'
              : 'bg-white/30 text-white hover:bg-white/40'
          }`}
        >
          前へ
        </button>
        <button
          onClick={nextCard}
          className="flex-1 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-all"
        >
          {currentIndex === currentWords.length - 1 ? '完了' : '次へ'}
        </button>
      </div>
    </div>
  );
}
