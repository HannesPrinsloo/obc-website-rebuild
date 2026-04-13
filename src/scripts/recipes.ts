import gsap from "gsap";
import { Flip } from "gsap/Flip";

interface RecipeData {
  id: string;
  slug: string;
  title: string;
  byLine: string;
  serves: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  method: string[];
  imageSrc: string;
}

interface StoreData {
  dinner: RecipeData[];
  sweet: RecipeData[];
  icons: {
    serves: string;
    prepTime: string;
    cookTime: string;
    difficulty: string;
  };
}

document.addEventListener("astro:page-load", () => {
  gsap.registerPlugin(Flip);

  const dataEl = document.getElementById("recipe-data-store");
  if (!dataEl) return;

  const store: StoreData = JSON.parse(dataEl.textContent || "{}");
  const allRecipes: RecipeData[] = [
    ...(store.dinner || []),
    ...(store.sweet || []),
  ];

  const cards = document.querySelectorAll<HTMLElement>(".recipe-card");
  const dinnerSection = document.getElementById("dinner-section");
  const sweetSection = document.getElementById("sweet-section");
  const detailPanel = document.getElementById("recipe-detail") as HTMLElement | null;
  const escapeHatch = document.getElementById("recipe-escape-hatch");

  if (!cards.length || !detailPanel) return;

  let openedFromGrid = false;
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      if ((card as any)._prefetchDone) return;
      const id = card.dataset.id;
      const recipe = allRecipes.find((r) => r.id === id);
      if (recipe) {
        const img = new Image();
        img.src = recipe.imageSrc;
        (card as any)._prefetchDone = true;
      }
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();

      const id = card.dataset.id;
      if (!id) return;

      const recipe = allRecipes.find((r) => r.id === id);
      if (!recipe) return;

      openedFromGrid = true;

      const siblings = Array.from(cards).filter((c) => c !== card);
      gsap.to(siblings, { opacity: 0, duration: 0.28, ease: "power2.in" });

      gsap.to(card, {
        scale: 1.03,
        duration: 0.18,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(card, {
            scale: 1,
            duration: 0.14,
            onComplete: () => showDetail(recipe),
          });
        },
      });

      history.pushState({ recipe: id }, "", `?recipe=${id}`);
    });
  });

  escapeHatch?.addEventListener("click", () => {
    if (openedFromGrid) {
      history.back();
    } else {
      history.replaceState({}, "", window.location.pathname);
      closeRecipe(false);
    }
  });

  const handlePopState = () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("recipe")) {
      openedFromGrid = false;
      closeRecipe(true);
    }
  };

  window.addEventListener("popstate", handlePopState);

  const initialSlug = new URLSearchParams(window.location.search).get("recipe");
  if (initialSlug) {
    const recipe = allRecipes.find(
      (r) => r.slug === initialSlug || r.id === initialSlug
    );
    if (recipe) {
      openedFromGrid = false;
      const heroEl = document.getElementById("recipe-hero-carousel");
      if (heroEl) heroEl.style.display = "none";
      if (dinnerSection) dinnerSection.style.display = "none";
      if (sweetSection) sweetSection.style.display = "none";
      document.getElementById("recipes-root")?.classList.add("detail-active");
      detailPanel.classList.add("detail-active");
      populateDetail(recipe);
      detailPanel.style.display = "block";
      detailPanel.style.opacity = "1";
      escapeHatch?.classList.remove("hidden");
    }
  }

  function showDetail(recipe: RecipeData) {
    const heroEl = document.getElementById("recipe-hero-carousel");
    if (heroEl) heroEl.style.display = "none";

    if (dinnerSection) dinnerSection.style.display = "none";
    if (sweetSection) sweetSection.style.display = "none";

    document.getElementById("recipes-root")?.classList.add("detail-active");
    detailPanel.classList.add("detail-active");

    populateDetail(recipe);

    detailPanel.style.display = "block";
    escapeHatch?.classList.remove("hidden");

    window.scrollTo(0, 0);

    gsap.fromTo(
      detailPanel,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }

  function closeRecipe(fromPopState: boolean) {
    escapeHatch?.classList.add("hidden");

    gsap.to(detailPanel!, {
      opacity: 0,
      y: 12,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        detailPanel!.style.display = "none";
        detailPanel!.style.opacity = "0";
        detailPanel!.classList.remove("detail-active");
        document.getElementById("recipes-root")?.classList.remove("detail-active");

        const heroEl = document.getElementById("recipe-hero-carousel");
        if (heroEl) heroEl.style.display = "";

        if (dinnerSection) dinnerSection.style.display = "";
        if (sweetSection) sweetSection.style.display = "";

        cards.forEach((c) => {
          (c as HTMLElement).style.opacity = "0";
        });

        gsap.fromTo(
          Array.from(cards),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.38, stagger: 0.045, ease: "power2.out" }
        );

        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
  }

  function isIngredientHeader(text: string): boolean {
    return /^[A-Z\s]{3,}$/.test(text.trim());
  }

  function populateDetail(recipe: RecipeData) {
    const { icons } = store;

    const ingredientsHtml = recipe.ingredients
      .map((ing) => {
        if (isIngredientHeader(ing)) {
          return `<li class="font-bold text-[0.78rem] text-[#1a1a1a] mt-[0.85rem] tracking-[0.04em]">${ing}</li>`;
        }
        return `<li class="text-[0.9rem] text-[#444] py-[0.15rem] leading-[1.55]">${ing}</li>`;
      })
      .join("");

    const methodHtml = recipe.method
      .map((step) => `<p class="text-[0.9rem] text-[#444] leading-[1.65] mb-2">${step}</p>`)
      .join("");

    detailPanel!.innerHTML = `
      <div class="mb-7">
        <span class="text-[2.2rem] font-normal text-[#181818] tracking-[0.12em] uppercase block mb-1.5">${recipe.title}</span>
        <h2 class="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold text-[#181818] leading-[1.15] m-0">${recipe.byLine}</h2>
      </div>

      <div class="relative pb-9 mb-10 max-sm:pb-0">
        <div class="flex items-stretch bg-[#f58120]/80 rounded min-h-[210px] max-sm:flex-col">
          <div class="flex-[0_0_42%] relative max-sm:flex-none max-sm:h-[220px]">
            <img src="${recipe.imageSrc}" alt="${recipe.title}" class="absolute top-0 -bottom-9 left-0 w-full h-[calc(100%+2.25rem)] object-cover rounded max-sm:relative max-sm:top-0 max-sm:h-full max-sm:w-full" />
          </div>
          <div class="flex-1 flex flex-col justify-center gap-[1.15rem] py-6 px-8 max-sm:p-5 max-sm:gap-4">
            <div class="flex items-center gap-[0.85rem]">
              <img src="${icons.serves}" alt="" class="w-[2.1rem] h-[2.1rem] shrink-0 object-contain" />
              <div class="flex flex-col leading-tight">
                <span class="text-[0.6rem] font-bold uppercase tracking-[0.09em] text-[#2c2320]">SERVES</span>
                <span class="text-[0.85rem] text-[#2c2320] mt-0.5">${recipe.serves}</span>
              </div>
            </div>
            <div class="flex items-center gap-[0.85rem]">
              <img src="${icons.prepTime}" alt="" class="w-[2.1rem] h-[2.1rem] shrink-0 object-contain" />
              <div class="flex flex-col leading-tight">
                <span class="text-[0.6rem] font-bold uppercase tracking-[0.09em] text-[#2c2320]">PREP TIME</span>
                <span class="text-[0.85rem] text-[#2c2320] mt-0.5">${recipe.prepTime}</span>
              </div>
            </div>
            <div class="flex items-center gap-[0.85rem]">
              <img src="${icons.cookTime}" alt="" class="w-[2.1rem] h-[2.1rem] shrink-0 object-contain" />
              <div class="flex flex-col leading-tight">
                <span class="text-[0.6rem] font-bold uppercase tracking-[0.09em] text-[#2c2320]">TOTAL COOK TIME</span>
                <span class="text-[0.85rem] text-[#2c2320] mt-0.5">${recipe.cookTime}</span>
              </div>
            </div>
            <div class="flex items-center gap-[0.85rem]">
              <img src="${icons.difficulty}" alt="" class="w-[2.1rem] h-[2.1rem] shrink-0 object-contain" />
              <div class="flex flex-col leading-tight">
                <span class="text-[0.6rem] font-bold uppercase tracking-[0.09em] text-[#2c2320]">DIFFICULTY LEVEL</span>
                <span class="text-[0.85rem] text-[#2c2320] mt-0.5">${recipe.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-2 pb-4">
        <h3 class="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#1a1a1a] mt-6 mb-2.5">INGREDIENTS</h3>
        <ul class="list-none p-0 m-0">${ingredientsHtml}</ul>
        <h3 class="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#1a1a1a] mt-6 mb-2.5">METHOD</h3>
        ${methodHtml}
      </div>
    `;
  }

  document.addEventListener(
    "astro:before-preparation",
    () => {
      window.removeEventListener("popstate", handlePopState);
    },
    { once: true }
  );
});
