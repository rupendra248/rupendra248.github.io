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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    let header = select('#header')
    if (header) {
      header.classList.toggle('navbar-mobile')
    }
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
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
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      })
    }
  });

})()
