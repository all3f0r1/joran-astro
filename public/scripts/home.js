document.addEventListener('DOMContentLoaded', () => {

    // GSAP Typography Animation
    gsap.from(".letter", {
        y: 100,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.out",
        duration: 1,
        delay: 0.5
    });

    // Interactive Hero Background
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const x = clientX / window.innerWidth - 0.5;
            const y = clientY / window.innerHeight - 0.5;

            gsap.to('.floating-element', {
                x: x * 50,
                y: y * 50,
                ease: 'power2.out',
            });

            gsap.to('.hero-bg-layer', {
                x: x * 20,
                y: y * 20,
                ease: 'power2.out',
            });
        });
    }


    // Generate floating bubbles
    const bubblesContainer = document.getElementById('bubbles-container');
    if (bubblesContainer) {
        for (let i = 0; i < 20; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 100 + 50;
            bubble.style.width = size + 'px';
            bubble.style.height = size + 'px';
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.animationDelay = Math.random() * 15 + 's';
            bubble.style.animationDuration = (Math.random() * 10 + 10) + 's';
            bubblesContainer.appendChild(bubble);
        }
    }

    // Sticky Navigation
    let lastScroll = 0;
    const navbar = document.getElementById('navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                navbar.classList.add('visible');
            } else {
                navbar.classList.remove('visible');
            }
            
            lastScroll = currentScroll;
        });
    }

    // Animate on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // GSAP ScrollTrigger for Parallax
    gsap.registerPlugin(ScrollTrigger);

    // Parallax effect for floating elements
    gsap.utils.toArray('.floating-element').forEach((element, i) => {
        gsap.to(element, {
            y: -100,
            ease: "none",
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // Parallax for sections (sans affecter l'opacité)
    gsap.utils.toArray('.section-content').forEach((section, i) => {
        gsap.from(section, {
            y: 30,
            ease: "power2.out",
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                end: "top 40%",
                scrub: 1
            }
        });
    });

    // GSAP ScrollTrigger for Parallax Images
    gsap.utils.toArray('.parallax-image').forEach(section => {
        const image = section.style;
        gsap.to(image, {
            backgroundPosition: `50% 100%`,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
