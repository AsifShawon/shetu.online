// NavBar---------------------------------
window.onscroll = function() {
  myFunction();
  scrollFunction();
};

var navbar = document.getElementById("fixtNavbar");
var sticky = navbar.offsetTop;

function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky")
  } else {
    navbar.classList.remove("sticky");
  }
}

// Requst Form-------------------------
function showRequestForm() {
    var requestForm = document.getElementById("request-form");
    requestForm.style.display = "block";
  }

function closerRequestForm() {
    var requestForm = document.getElementById("request-form");
    requestForm.style.display = "none";

  }

//  Video Modal-----------------------
function showVideoModal() {
    var testimonial = document.getElementById("video-modal");
    testimonial.style.display = "block";
  }

function closeVideoModal() {
    var closeTestimonial = document.getElementById("video-modal");
    closeTestimonial.style.display = "none";

  }



// Mobile Menu-------------------------------------
// var showMenu = document.getElementById("showMenu");

// function showFunction() {
//     showMenu.style.display = "block";
//     showMenu.style.right = "0";
//     showMenu.style. transition = "all .5s";
// }

function showMoileMenuOne(){
    document.getElementById('mobileDropdownOne').classList.toggle("mobile-dropdown-show");
    document.getElementById('mobileMenuIconOne').classList.toggle("roted180geg");
}

function showMoileMenuTwo(){
    document.getElementById('mobileDropdownTwo').classList.toggle("mobile-dropdown-show");
    document.getElementById('mobileMenuIcoTwo').classList.toggle("roted180geg");
}

function showFunction() {
    var showMenu = document.getElementById("showMenu");
    if (showMenu.style.display === "block") {
        showMenu.style.display = "none";
        showMenu.style.right = "-320px";
    } else {
        showMenu.style.display = "block";
        showMenu.style.right = "0";

    }
  }


  // Slider

  $(document).ready(function() {
    let currentIndex = 0;
    const slides = $('.slide');
    const slideCount = slides.length;
    let autoSlideInterval;

    // Create dots
    const dotsContainer = $('.dots');
    for (let i = 0; i < slideCount; i++) {
        dotsContainer.append('<span class="dot"></span>');
    }
    const dots = $('.dot');

    function showSlide(index) {
        slides.removeClass('active');
        slides.eq(index).addClass('active');
        $('.slider').css('transform', 'translateX(' + (-index * 100) + '%)');
        dots.removeClass('active');
        dots.eq(index).addClass('active');
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slideCount;
        showSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slideCount) % slideCount;
        showSlide(currentIndex);
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 3000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    $('.next').on('click', function() {
        nextSlide();
    });

    $('.prev').on('click', function() {
        prevSlide();
    });

    $('.slider-container').on('mouseenter', function() {
        stopAutoSlide();
    }).on('mouseleave', function() {
        startAutoSlide();
    });

    // Handle dot clicks
    dots.on('click', function() {
        currentIndex = $(this).index();
        showSlide(currentIndex);
    });

    showSlide(currentIndex);
    startAutoSlide();
  });

// Scroll Button Element
const scrollTopBtn = document.getElementById("scrollTopBtn");

// Show/Hide Button and Change Border Color on Scroll
// window.onscroll = function() {
//   scrollFunction();
// };

function scrollFunction() {
  // Show "Scroll to Top" Button when scrolled 100px down
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollTopBtn.style.display = "block";
  } else {
    scrollTopBtn.style.display = "none";
  }

  // Update Button Border Progress
  const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  
  // Calculate progress from 0 to 100, converting it to degrees for the border.
  let progress = Math.min(scrolled, 100);

  // Update the button border to show progress
  // scrollTopBtn.style.border = `4px solid transparent`; // Reset border to avoid lingering color
  // scrollTopBtn.style.bordeRadius = `100%`;
  // scrollTopBtn.style.borderImage = `conic-gradient(#e80a89 ${progress}%, transparent ${progress}%)`;
  // scrollTopBtn.style.borderImageSlice = 1;
}

// Scroll to Top Function
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}


