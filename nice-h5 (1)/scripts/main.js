(function () {
  'use strict';

  // ========== State ==========
  var currentPage = 0;
  var totalPages = 13;
  var isTransitioning = false;
  var touchStartY = 0;
  var touchStartX = 0;
  var touchStartTime = 0;
  var touchMoveY = 0; // track current finger position for live feedback

  // ========== Navigation Dots ==========
  var dotsContainer = document.getElementById('navDots');
  for (var i = 0; i < totalPages; i++) {
    var dot = document.createElement('button');
    dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('data-index', i);
    dot.addEventListener('click', function () { goToPage(parseInt(this.getAttribute('data-index'))); });
    dotsContainer.appendChild(dot);
  }

  function updateNavDots() {
    var dots = document.querySelectorAll('.nav-dot');
    dots.forEach(function (d, i) { d.classList.toggle('active', i === currentPage); });
    document.getElementById('pageIndicator').textContent = (currentPage + 1) + ' / ' + totalPages;
  }

  // ========== Page Switching ==========
  window.goToPage = function (index) {
    if (isTransitioning || index === currentPage || index < 0 || index >= totalPages) return;
    isTransitioning = true;
    currentPage = index;
    var wrapper = document.getElementById('pagesWrapper');
    wrapper.style.transition = 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)';
    wrapper.style.transform = 'translateY(-' + (currentPage * 100) + 'vh)';
    updateNavDots();
    triggerPageAnimations(currentPage);
    setTimeout(function () { isTransitioning = false; }, 650);
  };

  // ========== Page Enter Animations ==========
  function triggerPageAnimations(index) {
    var pages = document.querySelectorAll('.page');
    var target = pages[index];
    target.classList.remove('active');
    void target.offsetWidth;
    target.classList.add('active');
  }

  // ========== Touch & Swipe — Optimized for Mobile ==========
  var interactiveSelectors = '.game-area, .compare-slider, .compare-container, .family-scroll, .reviews-carousel, .tooth-area, .btn-primary, .pain-bubble, .tech-node, .ingredient-card, .data-card, .root-press-area, .game-leaf, .game-start-btn';

  document.addEventListener('touchstart', function (e) {
    if (e.target.closest(interactiveSelectors)) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    touchMoveY = touchStartY;
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (e.target.closest(interactiveSelectors)) return;
    touchMoveY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (e.target.closest(interactiveSelectors)) return;
    var endY = e.changedTouches[0].clientY;
    var endX = e.changedTouches[0].clientX;
    var deltaY = touchStartY - endY;
    var deltaX = touchStartX - endX;
    var elapsed = Date.now() - touchStartTime;

    // More lenient swipe detection for mobile:
    // 1. Lower minimum distance (30px instead of 50px)
    // 2. Much longer time window (1200ms instead of 600ms)
    // 3. Also detect slow drags: if finger moved >80px vertically regardless of time
    var isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX) * 0.6;
    var isQuickSwipe = Math.abs(deltaY) > 30 && elapsed < 1200;
    var isSlowDrag = Math.abs(deltaY) > 80;

    if (isVerticalSwipe && (isQuickSwipe || isSlowDrag)) {
      if (deltaY > 0) goToPage(currentPage + 1);
      else goToPage(currentPage - 1);
    }
  }, { passive: true });

  // Mouse wheel
  var wheelTimer = null;
  document.addEventListener('wheel', function (e) {
    if (wheelTimer) return;
    wheelTimer = setTimeout(function () { wheelTimer = null; }, 900);
    if (e.deltaY > 25) goToPage(currentPage + 1);
    else if (e.deltaY < -25) goToPage(currentPage - 1);
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goToPage(currentPage + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); goToPage(currentPage - 1); }
  });

  // ========== Screen 2: Pain Bubbles ==========
  window.togglePain = function (el) {
    el.classList.toggle('revealed');
    addRipple(el);
  };

  // ========== Screen 3: Root Cause Press ==========
  var rootPressTimer = null;
  window.startRootPress = function () {
    var area = document.getElementById('rootPressArea');
    area.classList.add('pressing');
    rootPressTimer = setTimeout(function () {
      document.getElementById('rootReveal').classList.add('show');
    }, 1500);
  };
  window.endRootPress = function () {
    var area = document.getElementById('rootPressArea');
    area.classList.remove('pressing');
    if (rootPressTimer) { clearTimeout(rootPressTimer); rootPressTimer = null; }
  };

  // ========== Screen 5: Tech Nodes ==========
  window.toggleTechNode = function (el) {
    document.querySelectorAll('.tech-node').forEach(function (n) {
      if (n !== el) n.classList.remove('active');
    });
    el.classList.toggle('active');
    addRipple(el);
  };

  // ========== Screen 6: Ingredients ==========
  window.toggleIngredient = function (el) {
    document.querySelectorAll('.ingredient-card').forEach(function (c) {
      if (c !== el) c.classList.remove('active');
    });
    el.classList.toggle('active');
  };

  // ========== Screen 7: Data Flip ==========
  window.flipDataCard = function (el) {
    el.classList.toggle('flipped');
  };

  // Fix data card heights: calculate from content
  function fixDataCardHeights() {
    var cards = document.querySelectorAll('.data-card');
    cards.forEach(function(card) {
      var front = card.querySelector('.data-card-front');
      var back = card.querySelector('.data-card-back');
      var inner = card.querySelector('.data-card-inner');
      if (front && back && inner) {
        // Measure front
        front.style.position = 'relative';
        var fh = front.offsetHeight;
        front.style.position = '';
        // Measure back
        back.style.position = 'relative';
        back.style.transform = 'none';
        var bh = back.offsetHeight;
        back.style.position = '';
        back.style.transform = '';
        // Use the taller one
        var h = Math.max(fh, bh);
        inner.style.height = h + 'px';
      }
    });
  }

  // ========== Screen 8: Brushing Interaction ==========
  var brushProgress = 0;
  var cleanedTeeth = 0;
  var totalTeeth = 0;

  function initBrushing() {
    var row1 = document.getElementById('toothRow1');
    var row2 = document.getElementById('toothRow2');
    var teethPerRow = 7;
    totalTeeth = teethPerRow * 2;
    for (var i = 0; i < teethPerRow; i++) {
      var t1 = document.createElement('div');
      t1.className = 'tooth dirty';
      t1.setAttribute('data-cleaned', '0');
      row1.appendChild(t1);
      var t2 = document.createElement('div');
      t2.className = 'tooth dirty';
      t2.setAttribute('data-cleaned', '0');
      row2.appendChild(t2);
    }

    var toothArea = document.getElementById('toothArea');

    function handleBrushMove(x, y) {
      if (brushProgress >= 100) return;
      var teeth = toothArea.querySelectorAll('.tooth');
      teeth.forEach(function (tooth) {
        var rect = tooth.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          if (tooth.getAttribute('data-cleaned') === '0') {
            tooth.setAttribute('data-cleaned', '1');
            tooth.classList.remove('dirty');
            tooth.classList.add('clean');
            cleanedTeeth++;
            brushProgress = Math.min(100, Math.round((cleanedTeeth / totalTeeth) * 100));
            document.getElementById('brushProgress').style.width = brushProgress + '%';
          }
          // Spawn foam
          var foam = document.createElement('div');
          foam.className = 'foam-particle';
          var foamSize = 4 + Math.random() * 10;
          foam.style.width = foamSize + 'px';
          foam.style.height = foamSize + 'px';
          foam.style.left = (x - rect.left - foamSize / 2 + Math.random() * 10 - 5) + 'px';
          foam.style.top = (y - rect.top - foamSize / 2 + Math.random() * 10 - 5) + 'px';
          toothArea.appendChild(foam);
          setTimeout(function () { foam.remove(); }, 800);
        }
      });

      if (brushProgress >= 100) {
        document.getElementById('brushText').textContent = '✨ 牙齿焕然一新！';
        document.getElementById('brushText').style.color = '#2DB87B';
        document.getElementById('brushText').style.fontWeight = '700';
        document.getElementById('gumTop').classList.remove('inflamed');
        document.getElementById('gumTop').classList.add('healthy');
        document.getElementById('gumMid').classList.remove('inflamed');
        document.getElementById('gumMid').classList.add('healthy');
        document.getElementById('gumBot').classList.remove('inflamed');
        document.getElementById('gumBot').classList.add('healthy');
      } else if (brushProgress > 0) {
        document.getElementById('brushText').textContent = '清洁进度 ' + brushProgress + '%';
      }
    }

    toothArea.addEventListener('touchmove', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var touch = e.touches[0];
      handleBrushMove(touch.clientX, touch.clientY);
    }, { passive: false });
    toothArea.addEventListener('mousemove', function (e) {
      if (e.buttons === 1) handleBrushMove(e.clientX, e.clientY);
    });
  }

  // ========== Screen 9: Before/After Compare ==========
  function initCompareSlider() {
    var container = document.getElementById('compareContainer');
    var slider = document.getElementById('compareSlider');
    var afterEl = document.getElementById('compareAfter');
    var isDragging = false;

    function updateSlider(x) {
      var rect = container.getBoundingClientRect();
      var pos = Math.max(0, Math.min(x - rect.left, rect.width));
      var pct = (pos / rect.width) * 100;
      slider.style.left = pct + '%';
      afterEl.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
    }

    slider.addEventListener('touchstart', function (e) {
      isDragging = true;
      e.stopPropagation();
    }, { passive: true });
    slider.addEventListener('mousedown', function () { isDragging = true; });
    document.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });
    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });
    document.addEventListener('touchend', function () { isDragging = false; });
    document.addEventListener('mouseup', function () { isDragging = false; });

    // Click/tap on container to move slider
    container.addEventListener('click', function (e) {
      if (e.target === slider || slider.contains(e.target)) return;
      updateSlider(e.clientX);
    });
    container.addEventListener('touchstart', function (e) {
      if (e.target === slider || slider.contains(e.target)) return;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });
  }

  // ========== Screen 11: Mint Challenge Game ==========
  var gameScore = 0;
  var gameTimer = null;
  var gameLeafInterval = null;
  var gameRunning = false;

  window.resetGame = function () {
    gameScore = 0;
    document.getElementById('gameScore').textContent = '0';
    document.getElementById('gameTimer').textContent = '15';
    document.getElementById('gameResult').classList.remove('show');
    document.getElementById('gameStartBtn').style.display = '';
    document.getElementById('gameArea').innerHTML = '';
    gameRunning = false;
    if (gameTimer) clearInterval(gameTimer);
    if (gameLeafInterval) clearInterval(gameLeafInterval);
  };

  document.getElementById('gameStartBtn').addEventListener('click', function () {
    if (gameRunning) return;
    gameRunning = true;
    gameScore = 0;
    var timeLeft = 15;
    this.style.display = 'none';
    document.getElementById('gameResult').classList.remove('show');
    document.getElementById('gameScore').textContent = '0';

    gameTimer = setInterval(function () {
      timeLeft--;
      document.getElementById('gameTimer').textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(gameTimer);
        clearInterval(gameLeafInterval);
        gameRunning = false;
        showGameResult();
      }
    }, 1000);

    var area = document.getElementById('gameArea');
    gameLeafInterval = setInterval(function () {
      if (!gameRunning) return;
      var leaf = document.createElement('div');
      leaf.className = 'game-leaf';
      var leafEmojis = ['🍃', '🌿', '☘️', '🍀'];
      leaf.textContent = leafEmojis[Math.floor(Math.random() * leafEmojis.length)];
      leaf.style.left = (8 + Math.random() * 84) + '%';
      var duration = 2.5 + Math.random() * 2;
      leaf.style.animationDuration = duration + 's';

      function collectLeaf() {
        if (!gameRunning) return;
        gameScore++;
        document.getElementById('gameScore').textContent = gameScore;
        this.style.transform = 'scale(1.8)';
        this.style.opacity = '0';
        setTimeout(function () { if (leaf.parentNode) leaf.remove(); }, 200);
      }

      leaf.addEventListener('click', collectLeaf);
      leaf.addEventListener('touchstart', function (e) {
        e.stopPropagation();
        e.preventDefault();
        collectLeaf.call(this);
      }, { passive: false });

      area.appendChild(leaf);
      setTimeout(function () { if (leaf.parentNode) leaf.remove(); }, duration * 1000);
    }, 600);
  });

  function showGameResult() {
    var result = document.getElementById('gameResult');
    document.getElementById('gameResultScore').textContent = gameScore;
    result.classList.add('show');
    document.getElementById('gameArea').innerHTML = '';
  }

  // ========== Screen 12: Reviews Carousel ==========
  function initReviewsCarousel() {
    var track = document.getElementById('reviewsTrack');
    var dots = document.querySelectorAll('#reviewsDots .reviews-dot');
    var currentReview = 0;
    var totalReviews = 3;

    function goToReview(index) {
      currentReview = index;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }

    setInterval(function () {
      if (currentPage !== 11) return;
      goToReview((currentReview + 1) % totalReviews);
    }, 4000);

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goToReview(i); });
    });

    var reviewStartX = 0;
    var carousel = document.querySelector('.reviews-carousel');
    carousel.addEventListener('touchstart', function (e) {
      reviewStartX = e.touches[0].clientX;
      e.stopPropagation();
    }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      e.stopPropagation();
      var delta = reviewStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 40) {
        if (delta > 0) goToReview(Math.min(currentReview + 1, totalReviews - 1));
        else goToReview(Math.max(currentReview - 1, 0));
      }
    }, { passive: true });
  }

  // ========== Ripple Effect ==========
  function addRipple(el) {
    var ripple = document.createElement('div');
    ripple.className = 'ripple';
    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.marginLeft = -(size / 2) + 'px';
    ripple.style.marginTop = -(size / 2) + 'px';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 600);
  }

  // ========== Particle Canvas (Bubbles) ==========
  function initParticleCanvas() {
    var canvas = document.getElementById('particle-canvas');
    var ctx = canvas.getContext('2d');
    var bubbles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function Bubble() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + 20;
      this.r = 2 + Math.random() * 4;
      this.speed = 0.3 + Math.random() * 0.8;
      this.opacity = 0.06 + Math.random() * 0.1;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.01 + Math.random() * 0.02;
    }

    for (var i = 0; i < 20; i++) {
      var b = new Bubble();
      b.y = Math.random() * canvas.height;
      bubbles.push(b);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bubbles.forEach(function (b) {
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        b.x += Math.sin(b.wobble) * 0.5;
        if (b.y < -20) {
          b.y = canvas.height + 20;
          b.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45,184,123,' + b.opacity + ')';
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ========== Init ==========
  function init() {
    initBrushing();
    initCompareSlider();
    initReviewsCarousel();
    initParticleCanvas();
    fixDataCardHeights();
    triggerPageAnimations(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
