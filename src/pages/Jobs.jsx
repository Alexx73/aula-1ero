import React, { useState } from "react";
import useSpeech from "../hooks/useSpeech.js";

export default function Jobs() {
  const { playSound } = useSpeech();
  const [activeJob, setActiveJob] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Duración total (texto + animación)
  const duracion = 1500;

  const traducciones = {
    farmer: "granjero",
    secretary: "secretaria",
    baker: "panadero",
    engineer: "ingeniero",
    painter: "pintor",
    vet: "veterinario",
    dentist: "dentista",
    butcher: "carnicero",
    pilot: "piloto",
    nurse: "enfermero",
    tailor: "sastre",
    teacher: "maestro",
    cook: "cocinero",
    hairdresser: "peluquero",
    singer: "cantante",
    doctor: "doctor",
  };

  // Cargar imágenes automáticamente
  const images = import.meta.glob("../assets/jobs/*.png", { eager: true });
  const jobs = Object.keys(images).map((path) => {
    const fileName = path.split("/").pop().replace(".png", "");
    const name = fileName.replace(/^\d+\s*-\s*/, "").trim().toLowerCase();
    return { name, img: images[path].default };
  });
  const itemsPerPage = 8;
  const pageCount = Math.ceil(jobs.length / itemsPerPage);
  const visibleJobs = jobs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const colors = [
    "bg-red-500",
    "bg-blue-600",
    "bg-yellow-400",
    "bg-cyan-400",
    "bg-green-400",
    "bg-purple-600",
  ];

  const handleClick = (jobName) => {
    playSound(jobName);
    setActiveJob(jobName);
    setTimeout(() => setActiveJob(null), duracion);
  };

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col items-center overflow-hidden bg-gray-50 px-4 py-5 dark:bg-gray-800">
      <div className="grid w-full min-h-0 grid-cols-2 content-start gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4">
        {visibleJobs.map((job, index) => {
          const color = colors[index % colors.length];
          const isActive = activeJob === job.name;

          return (
            <div
              key={job.name}
              className={`relative flex w-full flex-col items-center justify-center rounded-xl p-2 cursor-pointer transition-transform duration-300 ${color} ${
                isActive ? "animate-pop" : "hover:scale-105"
              }`}
              onClick={() => handleClick(job.name)}
              style={{ animationDuration: `${duracion}ms` }}
            >
              {/* Traducción arriba de la imagen */}
              {isActive && (
                <div
                  className="absolute top-0 left-0 right-0 rounded-t-lg bg-black/70 px-2 py-2 text-center text-lg font-black leading-tight text-white sm:text-xl animate-fadeInOut"
                  style={{ animationDuration: `${duracion}ms` }}
                >
                  {traducciones[job.name]}
                </div>
              )}

              {/* Imagen */}
              <img
                src={job.img}
                alt={job.name}
                className="h-[140px] w-full object-contain mx-auto"
              />

              {/* Nombre */}
              <p className="mt-2 text-white font-bold capitalize text-xl sm:text-base">
                {job.name}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between" aria-label="Páginas de profesiones">
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
          disabled={currentPage === 0}
          className="pointer-events-auto rounded-full bg-blue-600 px-4 py-3 text-3xl font-black leading-none text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Página anterior"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))}
          disabled={currentPage === pageCount - 1}
          className="pointer-events-auto rounded-full bg-blue-600 px-4 py-3 text-3xl font-black leading-none text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Página siguiente"
        >
          &gt;
        </button>
      </div>

      <span className="mt-auto pt-4 text-sm font-bold text-gray-700 dark:text-gray-200">
        {currentPage + 1} / {pageCount}
      </span>

      {/* Animaciones CSS */}
      <style>
        {`
          /* Texto traducido (fade arriba) */
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
          .animate-fadeInOut {
            animation: fadeInOut ease-in-out forwards;
          }

          /* Animación de rebote (pop) */
          @keyframes pop {
            0% { transform: scale(1); }
            20% { transform: scale(1.15); }
            50% { transform: scale(1.05); }
            80% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          .animate-pop {
            animation: pop ease-in-out forwards;
          }
        `}
      </style>
    </div>
  );
}
