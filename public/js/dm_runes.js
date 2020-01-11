"use strict";
/**
 * Created by sandberg on 13/06/2018.
 */
dm.runes = dm.runes || (function () {

  let inputFilter = $('#rune-filter');

  function init() {
    inputFilter.hideseek({
      attribute: 'data-values'
    });

    $('.rarity-selector').on('change', rarityChanges);
  }

  function rarityChanges() {
    const rarity = this.id.split('-')[1];
    const state = $(this).is(":checked");

    if (state === true) {
      $(`.runes-${rarity}`).show(0);
    } else {
      $(`.runes-${rarity}`).hide(0);
    }
  }

  return {
    init: init,
  };

})();
