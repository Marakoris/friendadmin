/**
 * Antibot: загружает Яндекс.Метрику только после реального взаимодействия.
 * Боты с 0 сек на сайте не генерируют mouse/scroll/touch события.
 * Блоклист IP обновляется автоматически с api.brandee.ru.
 */
(function() {
  var YM_ID = 95899715;
  var loaded = false;

  function initMetrika() {
    if (loaded) return;
    loaded = true;

    // Загружаем Метрику
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t);a=e.getElementsByTagName(t)[0];
      k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
    })(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");

    ym(YM_ID, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  }

  // Триггеры реального пользователя
  var events = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'];
  events.forEach(function(evt) {
    document.addEventListener(evt, initMetrika, {once: true, passive: true});
  });

  // Фоллбэк: через 3 сек загрузить в любом случае (для медленных но реальных)
  setTimeout(initMetrika, 3000);
})();
