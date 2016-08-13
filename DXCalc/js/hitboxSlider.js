function startHitboxSlider () {
    var hss = document.querySelectorAll('.hitbox-slider');
    for (var i=0; i<hss.length; ++i) {
      var hs = hss[i];
      var player = '<div class="hitbox-slider-container">{{video}}' +
                   '<!--<div class="left-arrow"></div><div class="right-arrow"></div>-->' +
                   '<div class="bar"><span class="progress">1</span> / <span class="duration">0</span> frames ' +
                   '<button class="left">←</button><button class="right">→</button> ｜ ' +
                   'Speed: <span class="speed">1.0</span> ' +
                   '<button class="speedup">↑</button><button class="speeddown">↓</button></div></div>';
           
      player = player.replace('{{video}}', hs.outerHTML);
      hs.outerHTML = player;
    }
    var containers = document.querySelectorAll('.hitbox-slider-container');
    for (var i=0; i<containers.length; ++i) {
      var container = containers[i];
      var video = container.querySelector('video');
      var left = container.querySelector('.left');
      var right = container.querySelector('.right');
      var bar = container.querySelector('.bar');
      var seek = bar.querySelector('.seek');
      var progress = bar.querySelector('.progress');
      var duration = bar.querySelector('.duration');
      var speed = bar.querySelector('.speed');
      var speedup = bar.querySelector('.speedup');
      var speeddown = bar.querySelector('.speeddown');

      // ポーズ切り替えのイベント登録
      container.addEventListener('click', function(event) {
        if (event.target === video) {
          video.paused ? video.play() : video.pause();
        }
      }, false);

      // フレーム操作用のイベント登録
      left.addEventListener('click', function(event) {
        video.pause();
        video.currentTime -= 1/60;
      }, false);
      right.addEventListener('click', function(event) {
        video.pause();
        video.currentTime += 1/60;
      }, false);
      // キーボードによる操作
      document.addEventListener('keydown', function(event) {
        if (event.keyCode === 39) {
            video.pause();
            video.currentTime += 1/60;
        } else if (event.keyCode === 37) {
            video.pause();
            video.currentTime -= 1/60;
        } else if (event.keyCode === 32) {
            video.paused ? video.play() : video.pause();
        }
      }, false);


      // 全体フレーム数の設定
      video.addEventListener('loadedmetadata', function() {
        duration.innerText = Math.floor(video.duration * 60);
      });

      // 現在フレーム表示用のイベント登録
      var refreshProgress = function() {
        progress.innerText = 1 + Math.floor(video.currentTime * 60);
      }
      video.addEventListener('pause', refreshProgress);
      video.addEventListener('timeupdate', refreshProgress);

      // 再生速度操作用のイベント登録
      speedup.addEventListener('click', function() {
        video.playbackRate += 0.1;
      }, false);
      speeddown.addEventListener('click', function() {
        video.playbackRate -= 0.1;
        video.playbackRate = Math.max(0.1, video.playbackRate);
      }, false);
      // キーボードによる操作
      document.addEventListener('keydown', function(event) {
        if (event.keyCode === 38) {
            video.playbackRate += 0.1;
        } else if (event.keyCode === 40) {
            video.playbackRate -= 0.1;
            video.playbackRate = Math.max(0.1, video.playbackRate);
        }
      }, false);


      // 再生速度表示用のイベント登録
      video.addEventListener('ratechange', function() {
        var v = Math.round(video.playbackRate * 10) / 10;
        speed.innerText = v;
      });

    }
}
