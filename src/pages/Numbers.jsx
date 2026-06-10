import React, { useEffect, useState } from 'react';
import Bart from '../assets/bart2.png';
import useSpeech from '../hooks/useSpeech';

/* =========================================
   📚 LISTA DE PALABRAS
========================================= */
const numberWords = [
  "ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE",
  "TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN",
  "SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN","TWENTY"
];

const Numbers = () => {

  /* =========================================
     🎛 ESTADOS
  ========================================= */
  const [showBart, setShowBart] = useState(true);
  const [gameMode, setGameMode] = useState(false);
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);

  /* =========================================
   🎮 CONFIGURACIÓN DEL JUEGO
   Podés cambiar el valor inicial (10)
========================================= */
const [totalRounds, setTotalRounds] = useState(5);

  // Ajusta este valor para cambiar el tono de la voz.
  // Más alto = voz más aguda. Más bajo = voz más grave.
  const speechPitch = 1.55;

  // Ajusta este valor para cambiar la velocidad de la voz.
  // Más alto = habla más rápido. Más bajo = habla más lento.
  const speechRate = 0.7;

  const { playSound } = useSpeech({
    pitch: speechPitch,
    rate: speechRate,
    letterRate: 0.95
  });

  const numbers = Array.from({ length: 21 }, (_, i) => i);

  const colors = [
    'bg-red-500',
    'bg-blue-600',
    'bg-yellow-400',
    'bg-cyan-400',
    'bg-green-400',
    'bg-purple-600'
  ];

  // Ajusta este valor para subir o bajar el espacio entre las filas.
  // Más grande = más separación vertical. Más chico = más filas pegadas.
  // En móvil, probá valores entre 0.25rem y 1rem.
  const rowGap = '1rem';

  // Ajusta este valor para cambiar el tamaño de los números.
  // Más grande = números más grandes. Más chico = números más chicos.
  const numberFontSize = '2rem';

  // Ajusta este valor para cambiar el tamaño de las palabras debajo del número.
  // Más grande = palabras más grandes. Más chico = palabras más chicas.
  const numberWordFontSize = '0.9rem';

  // Ajusta este valor para separar la zona de botones de la grilla de números.
  // Más grande = más aire entre ambas secciones.
  const topSectionGap = '0.8rem';

  /* =========================================
     👋 INTRO BART
  ========================================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBart(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  /* =========================================
     🔊 PRONUNCIAR NÚMERO
  ========================================= */
  const speakNumber = (number) => {
    playSound(numberWords[number], true);
  };

  /* =========================================
     🎮 INICIAR RONDA
  ========================================= */
  const startRound = () => {
    const random = Math.floor(Math.random() * 21);
    const targetWord = numberWords[random].toLowerCase();
    setTarget(random);
    setMessage("Find: " + numberWords[random]);
    setTimeLeft(10);
    setSelectedNumber(null);
    playSound(`Find ${targetWord}`, false, true);
  };

  /* =========================================
     ⏱ TEMPORIZADOR
  ========================================= */
  useEffect(() => {
    if (!gameMode || gameOver) return;

    if (timeLeft === 0) {
      setRound(prev => prev + 1);
      startRound();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameMode, gameOver]);

  /* =========================================
     🎯 CLICK EN NÚMERO
  ========================================= */
  const handleClick = (number) => {

    if (!gameMode) {
      speakNumber(number);
      return;
    }

    setSelectedNumber(number); // 👈 ahora muestra palabra solo del tocado

    if (number === target) {
      setScore(prev => prev + 10);
      setMessage("🎉 Correct!");
      playSound("Correct", true);

      setTimeout(() => {
        setRound(prev => prev + 1);

       if (round >= totalRounds - 1) {
          setGameOver(true);
        } else {
          startRound();
        }
      }, 1000);

    } else {
      setMessage("❌ Try Again!");
      playSound("Try again", true);
    }
  };

  /* =========================================
     🚀 INICIAR JUEGO
  ========================================= */
  const startGame = () => {
    setGameMode(true);
    setScore(0);
    setRound(0);
    setGameOver(false);
    startRound();
  };

  /* =========================================
     🛑 TERMINAR JUEGO
  ========================================= */
  const endGame = () => {
    setGameOver(true);
    setMessage("Game Finished!");
  };

  /* =========================================
     🔄 REINICIAR TODO
  ========================================= */
  const resetGame = () => {
    setGameMode(false);
    setGameOver(false);
    setScore(0);
    setRound(0);
    setMessage("");
  };

  const cancelGame = () => {
    setGameOver(false);
    setGameMode(false);
    setMessage("");
    setSelectedNumber(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col px-2 pt-1 pb-2 sm:p-5 bg-gray-100 font-sans dark:bg-gray-800">

      {showBart && (
        <div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-95 z-50">
          <img src={Bart} alt="Bart Simpson" className="w-60" />
        </div>
      )}

      {/* BOTONES + INFO */}
      <div className="flex items-center justify-between gap-2 mb-1 sm:mb-4 overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            onClick={() => setGameMode(false)}
            className={`px-2 py-2 sm:px-4 rounded-lg font-bold text-[10px] sm:text-base whitespace-nowrap ${!gameMode ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          >
            📚 Learn Mode
          </button>

          <button
            onClick={gameMode ? endGame : startGame}
            className={`px-2 py-2 sm:px-4 rounded-lg font-bold text-[10px] sm:text-base whitespace-nowrap ${gameMode ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}
          >
            {gameMode ? "🛑 End Game" : "🎮 Start Game"}
          </button>
        </div>

        <div className="flex-1 text-center text-base sm:text-xl font-black leading-none whitespace-nowrap find-rainbow">
          {gameMode && !gameOver ? message : ""}
        </div>

        <div className="shrink-0 text-right text-[10px] sm:text-sm font-bold leading-none text-white/90 whitespace-nowrap">
          {gameMode && !gameOver ? (
            <span>⭐ Score: {score} · 🔢 Round: {round + 1}/{totalRounds}</span>
          ) : (
            <span className="opacity-0 select-none">⭐ Score: 0 Round: 0/0</span>
          )}
        </div>
      </div>

      {/* PANTALLA FINAL */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              🏆 Final Score: {score}
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={resetGame}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
              >
                🔄 Play Again
              </button>
              <button
                onClick={cancelGame}
                className="inline-flex items-center justify-center rounded-xl bg-gray-500 px-5 py-3 font-bold text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID */}
      <div
        className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 gap-x-1 sm:gap-2 flex-grow content-start"
        style={{ rowGap, marginTop: topSectionGap }}
      >
        {numbers.map((number, index) => (
          <div
            key={number}
            onClick={() => handleClick(number)}
            className={`flex flex-col justify-center items-center text-white rounded-xl cursor-pointer transition-transform duration-200 select-none h-20 sm:h-28 hover:scale-105 active:scale-95 ${colors[index % colors.length]}`}
          >
            <span
              className="font-bold leading-none"
              style={{ fontSize: numberFontSize }}
            >
              {number}
            </span>

            {/* 👇 Solo mostrar palabra si:
                - NO es modo juego
                - O si es el número seleccionado */}
            {(!gameMode || selectedNumber === number) && (
              <span
                className="font-semibold leading-none mt-1"
                style={{ fontSize: numberWordFontSize }}
              >
                {numberWords[number]}
              </span>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Numbers;
