import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

document.addEventListener("astro:page-load", () => {
    gsap.registerPlugin(Flip, ScrollTrigger);

    const cards = document.querySelectorAll(".animal-card");
    const accordion = document.querySelector(".accordion-container");
    const swipe = document.getElementById("global-swipe");
    const swipeKnives = document.getElementById("swipe-knives");
    const carouselSection = document.getElementById("carousel-section");
    const escapeHatch = document.getElementById("escape-hatch-btn");
    const dataStore = document.getElementById("master-data-store");

    if (!cards.length || !dataStore) return;

    const masterData = JSON.parse(dataStore.textContent || "{}");
    let activeAnimal = "";

    cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
            if (card.classList.contains("active")) return;
            
            const state = Flip.getState(".animal-card, .details img, .byLine", { props: "opacity" });
            document.querySelector(".animal-card.active")?.classList.remove("active");
            card.classList.add("active");
            Flip.from(state, {
                duration: 1,
                ease: "power2.out",
                absolute: true,
                nested: true,
            });

            const name = card.id;
            if (masterData[name] && masterData[name].cuts && masterData[name].cuts[0]) {
                const img = new Image();
                img.src = masterData[name].cuts[0].ImageObj;
                (card as any)._prefetchImg = img;
            }
        });
    });

    accordion?.addEventListener("mouseleave", () => {
        const activeCard = document.querySelector(".animal-card.active");
        if (activeCard?.classList.contains("clicked")) return;
        if (!activeCard) return;

        const state = Flip.getState(".animal-card, .details img, .byLine", { props: "opacity" });
        activeCard.classList.remove("active");

        Flip.from(state, {
            duration: 0.6,
            ease: "power3.inOut",
            absolute: true,
            nested: true,
        });
    });

    let ctx: gsap.Context | null = null;
    let prefetchImgObj: HTMLImageElement | null = null;

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            if (card.classList.contains("clicked")) return;

            const name = card.id;
            activeAnimal = name;

            const state = Flip.getState(cards, { props: "opacity" });
            cards.forEach((c) => c.classList.remove("clicked", "active", "hidden-card"));
            card.classList.add("clicked", "active");

            cards.forEach((c) => {
                if (c !== card) c.classList.add("hidden-card");
            });

            document.getElementById("scroll-indicator")?.classList.remove("hidden");

            Flip.from(state, {
                duration: 0.6,
                ease: "power2.out",
                absolute: true,
                nested: true,
                simple: true,
                onComplete: () => {
                    handleTransition(name, (card as any)._prefetchImg);
                }
            });
        });
    });

    function populateCarousel(animalName: string) {
        const cuts = masterData[animalName].cuts;
        const track = document.getElementById("carousel-track");
        if (!track) return;

        track.innerHTML = "";
        cuts.forEach((item: any) => {
            const div = document.createElement("div");
            div.className = "gallery-item w-[70vw] lg:w-[35vw] shrink-0 flex justify-center items-center will-change-transform";
            div.innerHTML = `<img class="max-h-[30vh] lg:max-h-[45vh] max-w-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)]" src="${item.ImageObj}" alt="${item.Title}" />`;
            track.appendChild(div);
        });

        updateCarouselPanel(animalName, 0);
    }

    function updateCarouselPanel(animalName: string, index: number) {
        const data = masterData[animalName]?.cuts[index];
        if (!data) return;

        const titleEl = document.getElementById("panel-title");
        const descEl = document.getElementById("panel-desc");
        const cowEl = document.getElementById("panel-cow-img") as HTMLImageElement;
        const guideEl = document.getElementById("panel-guide-img") as HTMLImageElement;
        const modalImg = document.getElementById("modal-guide-img") as HTMLImageElement;

        if (titleEl) titleEl.innerText = data.Title.toUpperCase();
        if (descEl) descEl.innerText = data.Description;
        if (cowEl) cowEl.src = data.highlightImageObj;
        if (guideEl) guideEl.src = data.cookingGuideObj;
        if (modalImg) modalImg.src = data.cookingGuideObj;
    }

    function initCarouselGSAP(animalName: string) {
        if (ctx) ctx.revert();

        const hatchBtn = document.getElementById("escape-hatch-btn");
        if (hatchBtn) {
            hatchBtn.classList.remove("bg-brand-primary", "text-[#181818]", "animate-pulse", "border-brand-primary");
            hatchBtn.classList.add("bg-white/60", "border-black");
        }

        ctx = gsap.context(() => {
            let track = document.getElementById("carousel-track");
            let items = gsap.utils.toArray(".gallery-item");
            const isMobile = window.innerWidth < 1024;
            const getMoveDistance = () => isMobile ? window.innerWidth * 0.75 : window.innerWidth * 0.4;
            let activeIndex = 0;

            if (items.length === 0) return;

            if (items.length === 1 && hatchBtn) {
                hatchBtn.classList.remove("bg-white/60", "border-black");
                hatchBtn.classList.add("bg-brand-primary", "text-[#181818]", "animate-pulse", "border-brand-primary");
            }

            gsap.set(items, { scale: 0.5, filter: "blur(5px)" });
            gsap.set(items[0], { scale: 1, filter: "blur(0px)" });

            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".explorer-container",
                    pin: true,
                    scrub: 1,
                    end: () => "+=" + items.length * 1200,
                    invalidateOnRefresh: true,
                    onUpdate: () => {
                        let currentX = gsap.getProperty(track, "x") as number;
                        let calculatedIndex = Math.round(Math.abs(currentX) / getMoveDistance());
                        if (calculatedIndex !== activeIndex && calculatedIndex < items.length) {
                            activeIndex = calculatedIndex;
                            updateCarouselPanel(animalName, activeIndex);

                            if (hatchBtn) {
                                if (activeIndex === items.length - 1) {
                                    hatchBtn.classList.remove("bg-white/60", "border-black");
                                    hatchBtn.classList.add("bg-brand-primary", "text-[#181818]", "animate-pulse", "border-brand-primary");
                                } else {
                                    hatchBtn.classList.remove("bg-brand-primary", "text-[#181818]", "animate-pulse", "border-brand-primary");
                                    hatchBtn.classList.add("bg-white/60", "border-black");
                                }
                            }
                        }
                    },
                },
            });

            items.forEach((item, i) => {
                if (i !== 0) {
                    tl.to(track, { x: () => -(i * getMoveDistance()), ease: "power4.inOut", duration: 1 });
                    tl.to(items[i - 1], { scale: 0.5, filter: "blur(20px)", ease: "power4.inOut", duration: 1 }, "<");
                    tl.to(item, { scale: 1, filter: "blur(0px)", ease: "power4.inOut", duration: 1 }, "<");
                }
                tl.to(track, { x: () => -(i * getMoveDistance()), duration: 1.5 });
            });
        });

        ScrollTrigger.refresh();
    }

    function handleTransition(name: string, prefetchImg: HTMLImageElement | undefined) {
        populateCarousel(name);

        if (prefetchImg && prefetchImg.complete) {
            showCarousel(name);
        } else {
            const fallbackImg = new Image();
            fallbackImg.src = masterData[name].cuts[0].ImageObj;

            fallbackImg.onload = () => {
                showCarousel(name);
            };
        }
    }

    function showCarousel(name: string) {
        if (carouselSection) carouselSection.classList.remove("hidden");
        initCarouselGSAP(name);
    }

    escapeHatch?.addEventListener("click", () => {
        if (carouselSection) carouselSection.classList.add("hidden");
        document.getElementById("scroll-indicator")?.classList.add("hidden");

        escapeHatch?.classList.remove("bg-brand-primary", "text-[#181818]", "animate-pulse", "border-brand-primary");
        escapeHatch?.classList.add("bg-white/60", "border-black");

        if (ctx) {
            ctx.revert();
            ctx = null;
        }

        const state = Flip.getState(cards, { props: "opacity" });
        cards.forEach((c) => c.classList.remove("clicked", "active", "hidden-card"));

        Flip.from(state, {
            duration: 0.8,
            ease: "power3.inOut",
            absolute: true,
            nested: true
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const modal = document.getElementById("cooking-guide-modal");
    const openBtn = document.getElementById("guide-modal-btn");
    const closeBtn = document.getElementById("close-modal-btn");
    const backdrop = document.getElementById("modal-backdrop");

    const openModal = () => {
        modal?.classList.remove("hidden");
        modal?.classList.add("flex");
        requestAnimationFrame(() => modal?.classList.remove("opacity-0"));
    };
    const closeModal = () => {
        modal?.classList.add("opacity-0");
        setTimeout(() => {
            modal?.classList.add("hidden");
            modal?.classList.remove("flex");
        }, 300);
    };
    openBtn?.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);
});
