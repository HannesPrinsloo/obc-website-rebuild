// designer told me to replicate https://maleablecatering.com/#image-overlap-section/
// 
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScatterImage {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
}

interface ScatterGalleryProps {
  anchorImage: ScatterImage;
  images: ScatterImage[];
}

export default function ScatterGallery({ anchorImage, images }: ScatterGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const zIndexCounter = useRef(1);
  const currentIndex = useRef(0);

  useEffect(() => {
    if (!trackRef.current || !containerRef.current || images.length === 0) return;

    let tickFn: ((time: number, deltaTime: number, frame: number) => void) | null = null;

    const trigger = ScrollTrigger.create({
      trigger: trackRef.current,
      // Fire the warmup sentinel when the top of the track hits 1000px below the viewport bottom
      start: "top bottom+=1000px",
      onEnter: () => {
        if (!tickFn) {
          let lastTick = 0;

          tickFn = (time: number) => {
            if (time - lastTick >= 0.3) {
              lastTick = time;
              showNextImage();
            }
          };

          gsap.ticker.add(tickFn);
        }
      }
    });

    const showNextImage = () => {
      const currentRef = imageRefs.current[currentIndex.current];
      if (!currentRef) return;

      const widthPercent = Math.floor(Math.random() * 16 + 20) + "%";

      const randomTop = Math.floor(Math.random() * 80 - 10);
      const randomLeft = Math.floor(Math.random() * 90 - 10);
      const insetStr = `${randomTop}% auto auto ${randomLeft}%`;

      zIndexCounter.current++;

      gsap.set(currentRef, {
        inset: insetStr,
        width: widthPercent,
        zIndex: zIndexCounter.current,
        opacity: 1
      });

      currentIndex.current = (currentIndex.current + 1) % images.length;
    };

    const pinTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: () => `+=${document.querySelector('footer')?.offsetHeight || 500}`,
      pin: true,
      pinSpacing: false,
    });

    return () => {
      trigger.kill();
      pinTrigger.kill();
      if (tickFn) {
        gsap.ticker.remove(tickFn);
      }
    };
  }, [images]);

  return (
    <section
      id="scatter-gallery-track"
      ref={trackRef}
      className="relative w-full"
    >
      <div
        ref={containerRef}
        className="w-full h-[600px] lg:h-[930px] overflow-hidden bg-brand-bg"
      >
        {/*Underlying img - static*/}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <img
            srcSet={anchorImage.srcSet}
            sizes={anchorImage.sizes}
            src={anchorImage.src}
            alt={anchorImage.alt || 'Gallery Anchor Background'}
            className="w-full h-full object-cover"
          />
        </div>

        {images.map((imgData, index) => (
          <div
            key={`scatter-${index}`}
            ref={el => { imageRefs.current[index] = el; }}
            className="absolute gallery-image opacity-0"
            style={{ zIndex: 1 }}
          >
            <img
              srcSet={imgData.srcSet}
              sizes={imgData.sizes}
              src={imgData.src}
              alt={imgData.alt || `Scatter image ${index}`}
              className="w-screen max-w-[300px] sm:max-w-[400px] lg:max-w-[700px] h-full object-cover shadow-xl hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
