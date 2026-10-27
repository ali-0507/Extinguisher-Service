
const hamburger = document.getElementById("hamburger");
const navlinks = document.getElementById("navlinks");

hamburger.addEventListener("click", function () {

    // Toggle the mobile menu
    navlinks.classList.toggle("show");

    // Toggle hamburger animation
    hamburger.classList.toggle("active");

    // Update accessibility state
    const isOpen = navlinks.classList.contains("show");

    hamburger.setAttribute("aria-expanded", isOpen);

    hamburger.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
    );
});

// Close menu after clicking a navigation link
navlinks.querySelectorAll("a").forEach(function (link) {

    link.addEventListener("click", function () {

        navlinks.classList.remove("show");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open navigation menu");
    });

});

// Close menu when clicking Book a service
navlinks.querySelector(".mobile-book").addEventListener(
    "click",
    function () {

        navlinks.classList.remove("show");
        hamburger.classList.remove("active");

        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open navigation menu");
    }
);

function openModal() {
  const modal = document.getElementById("modal");
  const formBox = document.getElementById("formBox");
  const success = document.getElementById("success");

  if (!modal) {
    console.error("Modal container not found!");
    return;
  }

  // Show form again whenever modal opens
  if (formBox) formBox.style.display = "block";
  if (success) success.style.display = "none";

  modal.classList.add("show");
}

function closeModal() {
  const modal = document.getElementById("modal");

  if (modal) {
    modal.classList.remove("show");
  }
}

// Close modal when clicking outside the form box
const modal = document.getElementById("modal");

if (modal) {
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });
}
/* =========================================
   FORM SUBMISSION
========================================= */

// LOCAL BACKEND
const API_URL =
   "https://the-fire-wala.onrender.com/api/service-requests";


// Common function: send form data to backend
async function sendServiceRequest(form) {
  const formData = new FormData(form);

  const quantityValue = formData.get("quantity");

  const requestData = {
    client_name: formData.get("clientName")?.trim(),
    phone: formData.get("phone")?.trim(),
    email: formData.get("email")?.trim(),
    company_name: formData.get("company")?.trim() || null,
    service_type: formData.get("serviceType"),
    additional_details:
      formData.get("additional_details")?.trim() || null,
    extinguisher_quantity:
      quantityValue === "" || quantityValue === null
        ? null
        : Number(quantityValue)
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  });

  const responseText = await response.text();

  console.log("HTTP status:", response.status);
  console.log("Backend response:", responseText);

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Backend returned a non-JSON response. HTTP ${response.status}`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Request failed: HTTP ${response.status}`
    );
  }

  return result;
}


// =========================================
// 1. HERO FORM
// =========================================

const heroForm = document.getElementById("quoteForm");

if (heroForm) {
  heroForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitButton = heroForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      await sendServiceRequest(heroForm);
      heroForm.reset();
    window.open("thankyou.html", "_blank");

    } catch (error) {
      console.error("Hero form error:", error);

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Quote Request";
      }
    }
  });
}


// =========================================
// 2. MODAL FORM
// =========================================

const modalForm = document.getElementById("modalQuoteForm");

if (modalForm) {
  modalForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitButton = modalForm.querySelector(
      'button[type="submit"]'
    );

    const formBox = document.getElementById("formBox");
    const success = document.getElementById("success");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      await sendServiceRequest(modalForm);

      if (formBox) formBox.style.display = "none";
      if (success) success.style.display = "block";

      modalForm.reset();
      window.open("thankyou.html", "_blank");


    } catch (error) {
      console.error("Modal form error:", error);

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Request";
      }
    }
  });
}

/*RISK SELECTOR*/

function risk(el) {

    if (!el) {
        return;
    }

    const risks = document.querySelectorAll('.risk');

    risks.forEach(function (item) {
        item.classList.remove('active');
    });

    el.classList.add('active');
}


/*FAQ ACCORDION*/

const faqQuestions = document.querySelectorAll('.faq-q');

faqQuestions.forEach(function (question) {

    question.addEventListener('click', function () {

        const parent = question.parentElement;

        if (parent) {
            parent.classList.toggle('open');
        }

    });

});


/*PROCESS SECTION*/

const steps = document.querySelectorAll('.step');
const processImg = document.getElementById('processImg');


steps.forEach(function (step) {

    step.addEventListener('click', function () {

        /* Remove active class from all steps */

        steps.forEach(function (item) {
            item.classList.remove('active');
        });
        /* Add active class to clicked step */

        step.classList.add('active');
        /* Make sure process image exists */
        if (!processImg) {
            return;
        }


        /* Get image path from data-img */

        let imagePath = step.dataset.img;
        if (!imagePath) {
            return;
        }
        imagePath = imagePath.replace(/\\/g, '/');
        /* Fade image out */

        processImg.style.opacity = '0';


        /* Change image after short delay */

        setTimeout(function () {
            processImg.src = imagePath;
            processImg.onload = function () {
                processImg.style.opacity = '1';
            };
            processImg.onerror = function () {
                processImg.style.opacity = '1';
                console.warn('Process image could not be loaded:', imagePath);
            };
        }, 180);
    });
});


/*INITIAL PROCESS IMAGE*/

if (processImg) {
    processImg.style.transition = 'opacity 180ms ease';
}
document.addEventListener("DOMContentLoaded", function () {

    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".slider-dot");

    if (!slides.length || !dots.length) return;

    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });

        currentIndex = index;
    }

    // Automatic slider: changes every 3 seconds
    setInterval(function () {
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }, 6000);

    // Allow users to click dots
    dots.forEach((dot, index) => {
        dot.addEventListener("click", function () {
            showSlide(index);
        });
    });

});


const quantityInput = document.getElementById("quantity");

quantityInput.addEventListener("input", function () {
    const quantity = Number(this.value);

    if (this.value === "") {
        this.setCustomValidity("");
    } else if (!Number.isInteger(quantity)) {
        this.setCustomValidity(
            "Please enter a whole number."
        );
    } else if (quantity < 1) {
        this.setCustomValidity(
            "Minimum quantity should be 1."
        );
    } else if (quantity > 100) {
        this.setCustomValidity(
            "Maximum quantity allowed is 100."
        );
    } else {
        this.setCustomValidity("");
    }
});

// visual step number and progress bar

document.addEventListener("DOMContentLoaded", function () {

    const steps = document.querySelectorAll(".step");
    const processImg = document.getElementById("processImg");
    const processTitle = document.getElementById("processTitle");
    const processDescription =
        document.getElementById("processDescription");
    const visualStepNumber =
        document.getElementById("visualStepNumber");
    const processProgress =
        document.getElementById("processProgress");
    const progressText =
        document.getElementById("progressText");

    if (!steps.length || !processImg) return;

    function activateStep(step, index) {

        // Update active step
        steps.forEach(item => item.classList.remove("active"));
        step.classList.add("active");

        // Read selected step details
        const image = step.dataset.img;
        const title = step.dataset.title;
        const description = step.dataset.description;

        // Update image immediately
        if (image) {
            processImg.src = image;
        }

        processImg.alt = title || "Fire extinguisher servicing process";

        // Update title and description
        if (processTitle) {
            processTitle.textContent = title || "";
        }

        if (processDescription) {
            processDescription.textContent = description || "";
        }

        // Update step number
        const number = String(index + 1).padStart(2, "0");

        if (visualStepNumber) {
            visualStepNumber.textContent = `STEP ${number} / 08`;
        }

        // Update progress bar
        if (processProgress) {
            processProgress.style.width =
                `${((index + 1) / steps.length) * 100}%`;
        }

        if (progressText) {
            progressText.textContent =
                `${index + 1} of ${steps.length} steps`;
        }
    }

    // Click handler
    steps.forEach((step, index) => {
        step.addEventListener("click", function () {
            activateStep(step, index);
        });
    });
    // IMPORTANT: Initialize the active step on page refresh
    const initialStep =
        document.querySelector(".step.active") || steps[0];
    const initialIndex = Array.from(steps).indexOf(initialStep);
    activateStep(initialStep, initialIndex);
});

/*OUR CLIENTS CAROUSEL*/

document.addEventListener("DOMContentLoaded", function () {

    const track = document.querySelector(".clients-track");
    const cards = document.querySelectorAll(".client-card");
    const prevButton = document.querySelector(".client-prev");
    const nextButton = document.querySelector(".client-next");
    const dotsContainer = document.querySelector(".client-dots");

    if (
        !track ||
        !cards.length ||
        !prevButton ||
        !nextButton ||
        !dotsContainer
    ) {
        return;
    }
    let currentPage = 0;
    let autoSlide;


    /*CARDS PER VIEW*/

    function getCardsPerView() {
        if (window.innerWidth <= 700) {
            return 1;
        }
        if (window.innerWidth <= 1100) {
            return 3;
        }
        return 5;
    }


    /*TOTAL PAGES*/
    function getTotalPages() {
        const cardsPerView = getCardsPerView();
        return Math.ceil(
            cards.length / cardsPerView
        );
    }


    /*CREATE DOTS*/

    function createDots() {
        dotsContainer.innerHTML = "";
        const totalPages = getTotalPages();
        for (let i = 0; i < totalPages; i++) {
            const dot =
                document.createElement("button");
            dot.className = "client-dot";
            dot.type = "button";
            dot.setAttribute(
                "aria-label",
                `Show client group ${i + 1}`
            );
            dot.addEventListener(
                "click",
                function () {
                    currentPage = i;
                    updateCarousel();
                    restartAutoSlide();
                }
            );
            dotsContainer.appendChild(dot);
        }
    }


    /*UPDATE CAROUSEL*/

    function updateCarousel() {
        const cardsPerView = getCardsPerView();
        const totalPages = getTotalPages();
        if (currentPage >= totalPages) {
            currentPage = 0;
        }
        if (currentPage < 0) {
            currentPage = totalPages - 1;
        }
        const cardWidth =
            cards[0].offsetWidth;
        const gap =
            parseFloat(
                getComputedStyle(track).gap
            ) || 0;
        const moveAmount =
            currentPage *
            cardsPerView *
            (cardWidth + gap);
        track.style.transform =
            `translateX(-${moveAmount}px)`;
        /* Update dots */
        const dots =
            dotsContainer.querySelectorAll(
                ".client-dot"
            );
        dots.forEach(function (dot, index) {
            dot.classList.toggle(
                "active",
                index === currentPage
            );
        });
    }


    /*NEXT*/

    nextButton.addEventListener(
        "click",
        function () {
            currentPage++;
            if (
                currentPage >=
                getTotalPages()
            ) {
                currentPage = 0;
            }
            updateCarousel();
            restartAutoSlide();
        });

   /*PREVIOUS*/

    prevButton.addEventListener(
        "click",
        function () {
            currentPage--;
            if (currentPage < 0) {
                currentPage =
                    getTotalPages() - 1;
            }
            updateCarousel();
            restartAutoSlide();
        });


    /* =========================================
       AUTO SLIDE
    ========================================= */

    function startAutoSlide() {

        autoSlide = setInterval(
            function () {

                currentPage++;

                if (
                    currentPage >=
                    getTotalPages()
                ) {
                    currentPage = 0;
                }

                updateCarousel();

            },
            6000
        );

    }


    function restartAutoSlide() {

        clearInterval(autoSlide);

        startAutoSlide();

    }


    /*PAUSE ON HOVER*/

    const carousel =
        document.querySelector(
            ".clients-carousel"
        );

    if (carousel) {

        carousel.addEventListener(
            "mouseenter",
            function () {

                clearInterval(autoSlide);

            }
        );


        carousel.addEventListener(
            "mouseleave",
            function () {

                startAutoSlide();

            }
        );

    }


    /*RESPONSIVE*/

    window.addEventListener(
        "resize",
        function () {

            currentPage = 0;

            createDots();

            updateCarousel();

            restartAutoSlide();

        }
    );


    /*INITIALIZE*/

    createDots();

    updateCarousel();

    startAutoSlide();

});


/*NEW CYLINDER DELIVERY CAROUSEL*/
document.addEventListener("DOMContentLoaded",function(){
const slides=document.querySelectorAll(".cylinder-slide");
const dots=document.querySelectorAll(".cylinder-dot");
const prev=document.querySelector(".cylinder-prev");
const next=document.querySelector(".cylinder-next");

if(!slides.length)return;

let current=0;
let autoSlide;

function showSlide(index){
current=(index+slides.length)%slides.length;

slides.forEach((slide,i)=>{
slide.classList.toggle("active",i===current);
});

dots.forEach((dot,i)=>{
dot.classList.toggle("active",i===current);
});
}

function nextSlide(){
showSlide(current+1);
}

function startAutoSlide(){
clearInterval(autoSlide);
autoSlide=setInterval(nextSlide,4000);
}

function resetAutoSlide(){
startAutoSlide();
}

next.addEventListener("click",function(){
nextSlide();
resetAutoSlide();
});

prev.addEventListener("click",function(){
showSlide(current-1);
resetAutoSlide();
});

dots.forEach((dot,index)=>{
dot.addEventListener("click",function(){
showSlide(index);
resetAutoSlide();
});
});

showSlide(0);
startAutoSlide();
});

/* =========================================
FORM INPUT RESTRICTIONS
========================================= */

const clientNameInput = document.getElementById("clientName");
const phoneInput = document.getElementById("phone");
const companyInput = document.getElementById("company");

if (clientNameInput) {
  clientNameInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^A-Za-z ]/g, "").slice(0, 50);
  });
}

if (phoneInput) {
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });
}

if (companyInput) {
  companyInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^A-Za-z ]/g, "").slice(0, 100);
  });
}