"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["inteligente", "rápida", "lucrativa", "eficiente", "fácil"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col relative z-10">
          <div>
            <Button variant="secondary" size="sm" className="gap-2 rounded-full" asChild>
              <a href="#como-funciona">
                Descubra o Leadi <MoveRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-semibold text-ink">
              <span className="block mb-2">Organize seus leads</span>
              <span className="block">de forma</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 text-cobalt dark:text-signal">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-ink/70 max-w-2xl text-center mx-auto mt-4">
              Veja como o Leadi pode ajudar sua equipe a criar campanhas, captar e
              conduzir oportunidades de plano de saúde com total controle.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Button size="lg" className="gap-3 w-full sm:w-auto shadow-glass" asChild>
              <a href="https://wa.me/5511920595133?text=Ola!%20Gostaria%20de%20agendar%20uma%20apresenta%C3%A7%C3%A3o%20do%20Leadi!" target="_blank" rel="noopener noreferrer">
                <PhoneCall className="w-5 h-5" /> Agendar demonstração
              </a>
            </Button>
            <Button size="lg" className="gap-3 w-full sm:w-auto" variant="outline" asChild>
              <a href="#como-funciona">
                Ver como funciona <MoveRight className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
