import { useState, useEffect, useRef } from "react";

export interface CarouselImage {
  src: string;
  lqip: string;
  mobileSrc?: string;
  mobileLqip?: string;
  alt: string;
}

interface CarouselProps {
  images: CarouselImage[];
}

export default function Carousel({ images }: CarouselProps) {

  const [currentSlide, setCurrentSlide] = useState(0);

  const [firstImageLoaded, setFirstImageLoaded] = useState(false);

  const [unlockedSrcs, setUnlockedSrcs] = useState<(string | null)[]>(
    images.map((img, i) => (i === 0 ? img.src : null))
  );

  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleManualNav = (direction: "prev" | "next") => {
    //TODO: check with design team if this is too long to pause, or necessary at all
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 10000);

    setCurrentSlide((prev) => {
      const nextSlide = direction === "next"
        ? (prev + 1) % images.length
        : (prev - 1 + images.length) % images.length;

      // Unlock the new slide immediately, and the one after it for preload
      setUnlockedSrcs((srcs) => {
        const updated = [...srcs];
        if (!updated[nextSlide]) updated[nextSlide] = images[nextSlide].src;
        const preloadIndex = (nextSlide + 1) % images.length;
        if (!updated[preloadIndex]) updated[preloadIndex] = images[preloadIndex].src;
        return updated;
      });

      return nextSlide;
    });
  };

  //This took some figuring out because I was new to Astro.
  //React sometimes missed the onLoad event, probably because of caching and the dev server being very quick anyway
  //So I added this check to see if the image was already loaded on mount
  const slide0ImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (slide0ImgRef.current?.complete) {
      setFirstImageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!firstImageLoaded || images.length <= 1) return;
    setUnlockedSrcs((prev) => {
      const next = [...prev];
      next[1] = images[1].src;
      return next;
    });
  }, [firstImageLoaded]);


  useEffect(() => {
    if (!firstImageLoaded || images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % images.length;

        // Unlock the image two positions ahead for preloading.
        setUnlockedSrcs((srcs) => {
          const updated = [...srcs];
          const preloadIndex = (next + 1) % images.length;
          if (!updated[preloadIndex]) {
            updated[preloadIndex] = images[preloadIndex].src;
          }
          return updated;
        });

        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [firstImageLoaded, images.length, isPaused]);

  return (
    <section className="relative w-full overflow-hidden bg-brand-dark">

      <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
        {/* LQIP */}
        <picture
          style={{ gridArea: "1 / 1" }}
          className={`transition-opacity duration-1000 ease-in-out pointer-events-none select-none ${firstImageLoaded ? "opacity-0" : "opacity-100"
            }`}
        >
          {images[0].mobileLqip && (
            <source media="(max-width: 640px)" srcSet={images[0].mobileLqip} />
          )}
          <img
            src={images[0].lqip}
            alt=""
            aria-hidden="true"
            className="w-full block"
            style={{ filter: "blur(12px)", transform: "scale(1.05)" }}
          />
        </picture>
        {/* Full Res Imgs */}
        {images.map((image, index) => (
          <picture
            key={image.src}
            style={{ gridArea: "1 / 1" }}
            className={`transition-opacity duration-1000 ease-in-out ${index === currentSlide && firstImageLoaded
              ? "opacity-100"
              : "opacity-0"
              }`}
          >
            {unlockedSrcs[index] && image.mobileSrc && (
              <source media="(max-width: 640px)" srcSet={image.mobileSrc} />
            )}

            {unlockedSrcs[index] && (
              <img
                ref={index === 0 ? slide0ImgRef : undefined}
                src={unlockedSrcs[index]!}
                alt={image.alt}
                // Slide 0 LCP
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="w-full block"
                onLoad={index === 0 ? () => setFirstImageLoaded(true) : undefined}
              />
            )}
          </picture>
        ))}

      </div>

      {images.length > 1 && (
        <div
          className={`absolute inset-0 z-30 flex items-center justify-between px-2 md:px-6 pointer-events-none transition-opacity duration-1000 ease-in-out ${firstImageLoaded ? "opacity-100" : "opacity-0"
            }`}
        >
          <button
            onClick={() => handleManualNav("prev")}
            className="pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/10 text-white/60 hover:bg-black/30 hover:text-white transition-all backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-7 md:h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={() => handleManualNav("next")}
            className="pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/10 text-white/60 hover:bg-black/30 hover:text-white transition-all backdrop-blur-sm"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-7 md:h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
