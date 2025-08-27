import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { workoutData } from '../data/workoutData';

const WorkoutTimer = () => {
  // Main state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  
  // Timers
  const [workoutTime, setWorkoutTime] = useState(0); // Total workout elapsed time
  const [restTimer, setRestTimer] = useState(0); // Rest countdown
  const [isResting, setIsResting] = useState(false);
  
  // Phase tracking
  const [phase, setPhase] = useState('idle'); // idle, preparing, exercising, resting, complete
  const [exerciseStarted, setExerciseStarted] = useState(false); // Track if exercise has actually started after voice callout
  
  const repIntervalRef = useRef(null);
  const restIntervalRef = useRef(null);
  const workoutIntervalRef = useRef(null);
  const repTimerRef = useRef(0);

  const currentExercise = workoutData.exercises[currentExerciseIndex];
  const totalExercises = workoutData.exercises.length;

  // Helper functions for timing
  const getRepDuration = useCallback(() => {
    return currentExercise?.rep_duration || workoutData.global_rep_duration;
  }, [currentExercise]);

  const getRestBetweenReps = useCallback(() => {
    return currentExercise?.rest_between_reps || workoutData.global_rest_between_reps;
  }, [currentExercise]);

  const getRestBetweenExercises = useCallback(() => {
    return currentExercise?.rest_between_exercises || workoutData.global_rest_between_exercises;
  }, [currentExercise]);

  const getTotalReps = useCallback(() => {
    return currentExercise?.repetitions || 1;
  }, [currentExercise]);

  const getTotalSets = useCallback(() => {
    return currentExercise?.sets || 1;
  }, [currentExercise]);

  // Text-to-Speech function
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      
      // Try to find a Hebrew voice
      const voices = speechSynthesis.getVoices();
      const hebrewVoice = voices.find(voice => 
        voice.lang.includes('he') || voice.name.includes('Hebrew')
      );
      if (hebrewVoice) {
        utterance.voice = hebrewVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  // Main workout timer (only runs when workout is actively running, not just started)
  useEffect(() => {
    if (workoutStarted && isRunning && !isPaused && !workoutCompleted) {
      workoutIntervalRef.current = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(workoutIntervalRef.current);
    }

    return () => clearInterval(workoutIntervalRef.current);
  }, [workoutStarted, isRunning, isPaused, workoutCompleted]);

  // Rep timer (tracks current rep progress - can be paused)
  useEffect(() => {
    // FIXED: Only start rep timer when actively exercising AND running AND not paused AND exercise has started
    if (phase === 'exercising' && isRunning && !isPaused && !isResting && exerciseStarted) {
      repIntervalRef.current = setInterval(() => {
        repTimerRef.current += 1;
        if (repTimerRef.current >= getRepDuration()) {
          // Announce rep count when rep completes
          speak(currentRep.toString());
          
          const totalReps = getTotalReps();
          const totalSets = getTotalSets();
          
          if (currentRep < totalReps) {
            // More reps in current set - just advance rep, no rest
            setCurrentRep(currentRep + 1);
            repTimerRef.current = 0; // Reset rep timer for next rep
          } else {
            // Set completed - announce set completion
            speak(`סט ${currentSet} הושלם`);
            
            if (currentSet < totalSets) {
              // More sets remaining - rest between sets
              setCurrentSet(currentSet + 1);
              setCurrentRep(1);
              setIsResting(true);
              setRestTimer(getRestBetweenReps());
              setPhase('resting');
            } else {
              // Exercise completed
              if (currentExerciseIndex < totalExercises - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                setCurrentSet(1);
                setCurrentRep(1);
                
                // Rest between exercises
                setIsResting(true);
                setRestTimer(getRestBetweenExercises());
                setPhase('resting');
                
                // After rest, announce new exercise
                setTimeout(() => {
                  const nextEx = workoutData.exercises[currentExerciseIndex + 1];
                  speak(nextEx.name);
                  setTimeout(() => {
                    speak('התחלה');
                  }, 1000);
                }, getRestBetweenExercises() * 1000);
              } else {
                // Workout complete
                setWorkoutCompleted(true);
                setIsRunning(false);
                setPhase('complete');
                speak('כל הכבוד! סיימת את האימון');
              }
            }
            repTimerRef.current = 0;
          }
        }
      }, 1000);
    } else {
      clearInterval(repIntervalRef.current);
    }

    return () => clearInterval(repIntervalRef.current);
  }, [phase, isRunning, isPaused, isResting, exerciseStarted, currentRep, currentSet, currentExerciseIndex, getRepDuration, getRestBetweenReps, getRestBetweenExercises, getTotalReps, getTotalSets, totalExercises]);

  // Rest timer (countdown during rest - can be paused)
  useEffect(() => {
    if (isResting && restTimer > 0 && isRunning && !isPaused) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            endRest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }

    return () => clearInterval(restIntervalRef.current);
  }, [isResting, restTimer, isRunning, isPaused]);

  const endRest = () => {
    setIsResting(false);
    setRestTimer(0);
    setPhase('exercising');
    setIsRunning(true);
    setIsPaused(false);
    // Reset rep timer when starting exercise after rest
    repTimerRef.current = 0;
    setExerciseStarted(true); // Exercise starts immediately after rest
  };

  const enterWorkoutScreen = () => {
    // Just enter the workout screen without starting anything
    setWorkoutStarted(true);
    setPhase('ready'); // New phase: ready to start
  };

  const startWorkout = () => {
    setPhase('preparing');
    
    // Reset rep timer and exercise started flag
    repTimerRef.current = 0;
    setExerciseStarted(false);
    setIsRunning(false); // Don't start running until after voice cues
    
    // Announce exercise name
    speak(currentExercise.name);
    
    // After 1 second, say "GO" and set phase to exercising
    setTimeout(() => {
      speak('התחלה');
      
      
      // Start the actual exercise after the "התחלה" voice cue completes
      setTimeout(() => {
	  setPhase('exercising');      
	  setIsRunning(true);
        setIsPaused(false);
        setExerciseStarted(true); // Now the exercise has actually started
      }, 1000); // 1 second delay after "התחלה" to let it finish speaking
    }, 1000);
  };

  const togglePauseResume = () => {
    if (phase === 'ready') {
      // First time starting - begin the workout
      startWorkout();
    } else if (phase === 'exercising') {
      // Only toggle pause/resume during exercising phase
      if (isPaused || !isRunning) {
        setIsRunning(true);
        setIsPaused(false);
      } else {
        setIsPaused(true);
      }
    }
  };

  const stopWorkout = () => {
    setWorkoutStarted(false);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setCurrentRep(1);
    setWorkoutTime(0);
    setRestTimer(0);
    setIsResting(false);
    setPhase('idle');
    setWorkoutCompleted(false);
    setExerciseStarted(false);
  };

  const skipToNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setIsResting(false);
      setRestTimer(0);
      
      // Reset rep timer for new exercise
      repTimerRef.current = 0;
      setExerciseStarted(false);
      
      const nextEx = workoutData.exercises[currentExerciseIndex + 1];
      speak(nextEx.name);
      setTimeout(() => {
        speak('התחלה');
        setPhase('exercising');
        setIsRunning(true);
        setIsPaused(false);
        
        // After the voice cue, wait a moment before starting the rep timer
        setTimeout(() => {
          setExerciseStarted(true); // Now the exercise has actually started
        }, 500); // 0.5 second delay after "התחלה"
      }, 1000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = () => {
    if (phase === 'ready') return 'התחל';
    if (phase === 'preparing') return 'מכין...';
    if (isPaused) return 'המשך';
    if (isRunning) return 'השהה';
    return 'התחל';
  };

  // Main Screen (Before workout starts)
  if (!workoutStarted) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        direction: 'rtl'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* App Logo */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '3.75rem', marginBottom: '1rem', textAlign: 'center' }}>💪</div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#1f2937', textAlign: 'center' }}>אימון XXZ</h1>
          </div>

          {/* Main Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <button
              onClick={enterWorkoutScreen}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              אימון גב
            </button>
            
            <button
              disabled
              style={{
                width: '100%',
                backgroundColor: '#d1d5db',
                color: '#6b7280',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'not-allowed'
              }}
            >
              אימונים עתידיים
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workout Complete Screen
  if (workoutCompleted) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f0fdf4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        direction: 'rtl'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3.75rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#166534', marginBottom: '1rem' }}>כל הכבוד!</h1>
          <p style={{ fontSize: '1.25rem', color: '#15803d', marginBottom: '0.5rem' }}>סיימת את האימון בהצלחה</p>
          <p style={{ fontSize: '1.125rem', color: '#16a34a', marginBottom: '2rem' }}>זמן כוללל: {formatTime(workoutTime)}</p>
          
          <button
            onClick={stopWorkout}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            חזור לתפריט הראשי
          </button>
        </div>
      </div>
    );
  }

  // Exercise Screen (During workout)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column', direction: 'rtl' }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {/* Header with Workout Timer */}
        <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>אימון גב</h2>
            <div style={{
              fontSize: '1.25rem',
              fontFamily: 'monospace',
              backgroundColor: '#1d4ed8',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem'
            }}>
              {formatTime(workoutTime)}
            </div>
          </div>
          
          {/* Exercise Progress */}
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
            תרגיל {currentExerciseIndex + 1} מתוך {totalExercises}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {/* Exercise Name */}
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {currentExercise.name}
          </h1>

          {/* Exercise Instructions */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#374151', lineHeight: '1.6', textAlign: 'right' }}>
              {currentExercise.instructions}
            </p>
          </div>

          {/* Status Display */}
          {phase === 'ready' && (
            <div style={{
              backgroundColor: '#dbeafe',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#1e40af', fontWeight: '600' }}>מוכן להתחיל? לחץ על כפתור ההפעלה</p>
            </div>
          )}

          {phase === 'preparing' && (
            <div style={{
              backgroundColor: '#fef3c7',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#92400e', fontWeight: '600' }}>מכין לתרגיל...</p>
            </div>
          )}

          {/* Counters */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2563eb' }}>
                {currentRep} / {getTotalReps()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>חזרות</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#059669' }}>
                {currentSet} / {getTotalSets()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>סטים</div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {/* Start/Pause Button */}
            <button
              onClick={togglePauseResume}
              disabled={phase === 'preparing'}
              style={{
                backgroundColor: phase === 'preparing' ? '#d1d5db' : '#2563eb',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: phase === 'preparing' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                transition: 'all 0.2s ease-in-out',
                opacity: phase === 'preparing' ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (phase !== 'preparing') {
                  e.target.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseOut={(e) => {
                if (phase !== 'preparing') {
                  e.target.style.backgroundColor = '#2563eb';
                }
              }}
            >
              {phase === 'ready' ? <Play size={24} /> : 
               (isPaused || !isRunning) && phase === 'exercising' ? <Play size={24} /> : <Pause size={24} />}
              {getButtonText()}
            </button>
            
            {/* Stop Button */}
            <button
              onClick={stopWorkout}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              <Square size={20} />
              עצור
            </button>
            
            {/* Next Button */}
            <button
              onClick={skipToNextExercise}
              disabled={currentExerciseIndex >= totalExercises - 1}
              style={{
                backgroundColor: currentExerciseIndex >= totalExercises - 1 ? '#d1d5db' : '#ea580c',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: currentExerciseIndex >= totalExercises - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease-in-out',
                opacity: currentExerciseIndex >= totalExercises - 1 ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (currentExerciseIndex < totalExercises - 1) {
                  e.target.style.backgroundColor = '#c2410c';
                }
              }}
              onMouseOut={(e) => {
                if (currentExerciseIndex < totalExercises - 1) {
                  e.target.style.backgroundColor = '#ea580c';
                }
              }}
            >
              <SkipForward size={20} />
              הבא
            </button>
          </div>
        </div>
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '300px',
            width: '90%'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>מנוחה</h3>
            <div style={{ fontSize: '3.75rem', fontWeight: 'bold', color: '#ea580c', marginBottom: '1rem' }}>
              {restTimer}
            </div>
            <div style={{ color: '#6b7280' }}>שניות</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTimer;