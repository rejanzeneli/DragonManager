"use strict";
/**
 * Created by sandberg on 09/10/2017.
 */
dm.dragons = dm.dragons || (function () {
  let backendAPI = null;

  let currentDragonId;
  let dragonLevels = $('#dragonLevels');
  let costXp = $('#dragonXpRequired');
  let costRss = $('#dragonRssRequired');
  let slider;

  function init(api) {
    backendAPI = api;

    $('#dragon-stats').floatThead({
      top: navbarHeight,
      position: 'fixed'
    });

    let dragonId = $('#dragonId');
    currentDragonId = dragonId.data('dragon');
    let maxLevel = Number(dragonId.data('maxlevel'));
    setupCalculator(maxLevel);
  }

  function setupCalculator(maxLevel) {
    slider = document.getElementById('xpCalculator');
    noUiSlider.create(slider, {
      start: [1, maxLevel],
      connect: true,
      tooltips: [wNumb({decimals: 0}), wNumb({decimals: 0})],
      step: 1,
      orientation: 'horizontal',
      range: {
        'min': 1,
        'max': maxLevel
      },
      format: wNumb({
        decimals: 0,
        preFix: 'Level ',
        encoder: function( a ){
          return Math.round(a*100)/100;
        }
      })
    });

    slider.noUiSlider.on('update', function (values, handle) {
      setCalculatorLevels(Number(values[0]), Number(values[1]));
    });
  }

  function setCalculatorLevels(minLevel, maxLevel) {
    dragonLevels.html(`FROM LEVEL ${minLevel} TO ${maxLevel}`);

    return $.ajax({
      url: `${backendAPI}/dragons/cost/${currentDragonId}/${minLevel}/${maxLevel}`,
      type: "GET",
    }).done(function (data) {
      if (data.hasOwnProperty('xp')) {
        costXp.text(data.xp);
      }
      if (data.hasOwnProperty('rss')) {
        costRss.text(data.rss);
      }
    });
  }

  // The public interface which is exposed
  return {
    init: init
  };

})();
