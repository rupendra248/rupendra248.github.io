/**
* Site scripts - Dr. Rupendra Pratap Singh Hada
* Originally based on: MyResume v4.3.0 (BootstrapMade.com)
*/
(function() {
  "use strict";

  const select = (el, all = false) => {
    el = el.trim()
    return all ? [...document.querySelectorAll(el)] : document.querySelector(el)
  }

  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      backtotop.classList.toggle('active', window.scrollY > 100)
    }
    window.addEventListener('load', toggleBacktotop)
    document.addEventListener('scroll', toggleBacktotop)

    backtotop.addEventListener('click', (e) => {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    })
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    let header = select('#header')
    let open = header ? header.classList.toggle('navbar-mobile') : false
    let icon = this.querySelector('i')
    if (icon) {
      icon.classList.toggle('bi-list', !open)
      icon.classList.toggle('bi-x', open)
    }
    this.setAttribute('aria-expanded', String(open))
    this.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu')
  })

  /**
   * Preloader
   * Hidden as soon as the document is parsed rather than on `load`, so a slow
   * image or third-party script can never leave the page blank behind it.
   */
  let preloader = select('#preloader');
  if (preloader) {
    const hidePreloader = () => {
      preloader.classList.add('done')
      setTimeout(() => preloader.remove(), 600)
    }
    if (document.readyState !== 'loading') {
      hidePreloader()
    } else {
      document.addEventListener('DOMContentLoaded', hidePreloader)
    }
  }

  /**
   * Hero type effect (index page only)
   */
  const typed = select('.typed')
  if (typed && typeof Typed !== 'undefined') {
    let typed_strings = typed.getAttribute('data-typed-items').split(',')
    if (reducedMotion) {
      // no animation: just state the specialisms
      typed.textContent = typed_strings.map(s => s.trim()).join(', ')
    } else {
      new Typed('.typed', {
        strings: typed_strings,
        loop: true,
        typeSpeed: 100,
        backSpeed: 50,
        backDelay: 2000
      });
    }
  }

  /**
   * Stop auto-cycling carousels when reduced motion is requested
   */
  if (reducedMotion && typeof bootstrap !== 'undefined') {
    select('.carousel', true).forEach(el => {
      const c = bootstrap.Carousel.getOrCreateInstance(el, { ride: false, interval: false })
      c.pause()
    })
  }

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: reducedMotion ? 0 : 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      })
    }
  });

})()
