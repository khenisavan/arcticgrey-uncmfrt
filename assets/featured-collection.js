 var productSlider = new Swiper(".section_featured-collection-slider", {
      slidesPerView: 1,
      spaceBetween: 20,
       navigation: {
          nextEl: ".block-colleton .next",
          prevEl: ".block-colleton .prev",
      },
       breakpoints: {
            1300: {
                slidesPerView: 4,
                spaceBetween: 20
            },
            1025: {
                slidesPerView: 3,
                spaceBetween: 15
            },
            750: {
                slidesPerView: 2,
                spaceBetween: 10
            }
        }
    });