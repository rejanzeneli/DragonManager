"use strict";
/**
 * Created by sandberg on 09/10/2017.
 */
dm.buildings = dm.buildings || (function () {
  let backendAPI = null;
  let attackfields = null;
  let research_input = $('#research_buf');
  let rider_input = $('#rider_buf');
  let reduction_input = $('#buildReduction');
  let reduction_current = 0;
  let currentTowerId;
  let towerLevels = $('#towerLevels');
  let costTime = $('#levelTimersRequired');
  let costRss = $('#levelRssRequired');
  let slider;

  function init(api) {
    backendAPI = api;

    $('#building-stats').floatThead({
      top: navbarHeight,
      position: 'fixed'
    });

    let towerId = $('#towerId');
    currentTowerId = towerId.data('tower');

    attackfields = $('.attackpower');
    let maxLevel = Number($('#buildingMaxLevel').text());
    setupCalculator(maxLevel);
    setStoredValues();
    research_input.on('change', updateNumbers);
    rider_input.on('change', updateNumbers);
    reduction_input.on('change', updateReduction);
  }

  function setupCalculator(maxLevel) {
    slider = document.getElementById('levelCalculator');
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
    towerLevels.html(`FROM LEVEL ${minLevel} TO ${maxLevel}`);

    return $.ajax({
      url: `${backendAPI}/buildings/cost/${currentTowerId}/${minLevel}/${maxLevel}/${reduction_current}`,
      type: "GET",
    }).done(function (data) {
      if (data.hasOwnProperty('time')) {
        costTime.text(data.time);
      }
      if (data.hasOwnProperty('rss')) {
        costRss.empty();
        data.rss.forEach((rss) => {
          costRss.append(rss).append('<br>');
        });
      }
    });
  }

  function updateReduction() {
    reduction_current = Number(reduction_input.val()) / 100;
    let levels = slider.noUiSlider.get();
    setCalculatorLevels(Number(levels[0]), Number(levels[1]));
  }

  function setStoredValues() {
    research_input.val(0);
    rider_input.val(0);
    reduction_input.val(0);
    updateNumbers();
    updateReduction();
  }

  function updateNumbers() {
    let research_buf = 1 + Number(research_input.val()) / 100;
    let rider_buf = 1 + Number(rider_input.val()) / 100;
    attackfields.each(function() {
      let data = Number($(this).data('default'));
      $(this).html(Math.ceil(data * research_buf * rider_buf));
    });
  }

  // The public interface which is exposed
  return {
    init: init
  };

})();
