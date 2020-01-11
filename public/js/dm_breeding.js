"use strict";
/**
 * Created by sandberg on 28/09/2017.
 */
dm.breeding = dm.breeding || (function () {
  let ready = false;
  let backendAPI = null;
  let searchTable = null;
  let currentSearch = '';
  let currentTier = 99;
  let backbreedSearch = false;
  let childSearchTerm = '';
  let parentSearchTerm = '';
  let autoCompleteData = {};

  let inputParent = $('#find_parent');
  let inputChild = $('#find_child');
  let backbreedOnly = $('#backbreeds-only');
  let inputFrags = $('#frags-owned');
  let tierSelector = $('#breedable-tier');

  const columns = {
    parent1:    0,
    parent2:    1,
    child1:     2,
    child2:     3,
    child3:     4,
    child4:     5,
    child5:     6,
    child6:     7,
    tokens:     8,
    discount:   9,
  };

  let dragonData = [];

  function init(api) {
    backendAPI = api;
    if (ready === true) {
      return;
    }
    ready = true;

    tierSelector.formSelect();
    currentTier = Number(getCurrentMaxTier());
    tierSelector.on('change', setTierFilter);

    setupTable();
    setupAutoComplete();

    backbreedOnly.on('change', (state) => {
      backbreedSearch = backbreedOnly.prop('checked');
      if (parentSearchTerm !== '') {
        searchParent(parentSearchTerm);
      } else {
        if (childSearchTerm !== '') {
          searchChildren(childSearchTerm);
        }
      }
    });

    inputFrags.on('change', updateTokens);

    inputParent.keyup(function (event) {
      event.preventDefault();
      if (event.which === 13) {
        let parent = this.value;
        if (parent !== '') {
          if (parent !== parentSearchTerm) {
            parentSearchTerm = parent;
            searchParent(parent);
          }
        } else {
          searchTable.clear();
          searchTable.draw();
        }
      }
    });

    inputChild.keyup(function (event) {
      event.preventDefault();
      if (event.which === 13) {
        let child = this.value;
        if (child !== '') {
          if (child !== childSearchTerm) {
            childSearchTerm = child;
            searchChildren(child);
          }
        } else {
          searchTable.clear();
          searchTable.draw();
        }
      }
    });
  }

  function setTierFilter() {
    currentTier = Number($(this).val());

    $.ajax({
      url: `${backendAPI}/userdata`,
      type: "POST",
      data: {maxtier: currentTier}
    }).always(() => {
      let searchterm = inputParent.val();
      if (searchterm !== "") {
        searchParent(searchterm);
      }
    });
  }

  function setupAutoComplete() {
    $.ajax({
      url: `${backendAPI}/dragons/list`,
      type: "GET"
    }).done((response) => {
      //build data
      for (let dragon in response) {
        if (response.hasOwnProperty(dragon)) {
          let dragoninfo = response[dragon];
          if (dragoninfo.hasOwnProperty('tierName')) {
            autoCompleteData[dragon] = `/tier_icons/icon_${dragoninfo.tierName.toLowerCase()}.png`;
          } else {
            autoCompleteData[dragon] = null;
          }
        }
      }

      inputParent.autocomplete({
        data: autoCompleteData,
        limit: 20,
        onAutocomplete: function(val) {
          inputParent.trigger(jQuery.Event('keyup', { which: 13 }));
        },
        minLength: 0,
      });
      inputChild.autocomplete({
        data: autoCompleteData,
        limit: 20,
        onAutocomplete: function(val) {
          inputChild.trigger(jQuery.Event('keyup', { which: 13 }));
        },
        minLength: 0,
      });
    }).fail((error) => {
    });
  }

  function setupTable() {
    if (searchTable === null) {
      searchTable = $('#searchtable').DataTable( {
        autoWidth: false,
        paging: false,
        columns: [
          { data: "parent1" },
          { data: "parent2" },
          { data: "child1" },
          { data: "child2" },
          { data: "child3" },
          { data: "child4" },
          { data: "child5" },
          { data: "child6" },
          { data: "tokens" },
          { data: "discount"},
        ],
        "createdRow": function( row, data, index ) {
          for (let column in data) {
            $('td', row).eq(0).addClass('grey lighten-3 thin-border');
            $('td', row).eq(1).addClass('grey lighten-3 thin-border');
          }
        },
        order: [[ columns['tokens'], 'asc' ]],
        data: dragonData
      });
    }
  }

  function searchParent(dragonname) {
    inputChild.removeClass('valid').removeClass('invalid').val('');
    $('#labelChild').removeClass("active");
    childSearchTerm = "";
    searchTable.clear();
    currentSearch = dragonname;
    $.ajax({
      url: `${backendAPI}/dragons/parent/${dragonname}/${backbreedSearch}`,
      type: "GET"
    }).done((response) => {
      fillTable(response, true);
      searchTable.draw();
    }).fail((error) => {
      searchTable.draw();
    });
  }

  function searchChildren(dragonname) {
    inputParent.removeClass('valid').removeClass('invalid').val('');
    $('#labelParent').removeClass("active");
    parentSearchTerm = "";
    searchTable.clear();
    currentSearch = dragonname;
    $.ajax({
      url: `${backendAPI}/dragons/child/${dragonname}`,
      type: "GET"
    }).done((response) => {
      fillTable(response, false);
      searchTable.draw();
    }).fail((error) => {
      searchTable.draw();
    });
  }

  function getCurrentMaxTier() {
    let maxtier = tierSelector.formSelect('getSelectedValues');
    return maxtier[0];
  }

  function fillTable(response, showtokens) {
    if (response.length > 0) {
      let fragments = '';
      let dragonname = '';
      let dragoninfo = $('#dragoninfo');
      response.forEach((parent) => {
        if ((parent.parent1tier > currentTier) || (parent.parent2tier > currentTier)) {
          return;
        }
        let entry = {};
        if (parent.parent1.toLowerCase() === currentSearch.toLowerCase()) {
          entry.parent1_name = `<span onClick='dm.breeding.searchParent("${parent.parent1}");' class='red-text' style='text-decoration: underline; text-decoration-color: #${parent.parent1color};-webkit-text-decoration-color: #${parent.parent1color}'>${parent.parent1}</span>`;
        } else {
          entry.parent1_name = `<span onClick='dm.breeding.searchParent("${parent.parent1}");' style='text-decoration: underline; text-decoration-color: #${parent.parent1color};-webkit-text-decoration-color: #${parent.parent1color}'>${parent.parent1}</span>`;
        }

        if (parent.parent2.toLowerCase() === currentSearch.toLowerCase()) {
          entry.parent2_name = `<span onClick='dm.breeding.searchParent("${parent.parent2}");' class='red-text' style='text-decoration: underline; text-decoration-color: #${parent.parent2color};-webkit-text-decoration-color: #${parent.parent2color}'>${parent.parent2}</span>`;
        } else {
          entry.parent2_name = `<span onClick='dm.breeding.searchParent("${parent.parent2}");' style='text-decoration: underline; text-decoration-color: #${parent.parent2color};-webkit-text-decoration-color: #${parent.parent2color}'>${parent.parent2}</span>`;
        }

        let items = 0;
        entry.tokens = '-';
        entry.discount = '-';
        let tokens = Number.MAX_SAFE_INTEGER;
        parent.eggs.forEach((egg) => {
          items++;
          if (egg.name.toLowerCase() === currentSearch.toLowerCase()) {
            dragonname = egg.name;
            if (showtokens) {
              let scaling = parent.scaling;
              entry.discount = Math.round((1.0 - scaling) * 100) + "%";
              fragments = egg.fragments;
              let fullTokens = (2000.0 / egg.ratio) * egg.fragments * scaling;
              let currentTokens = calcTokens(fullTokens, fragments);
              if (currentTokens < tokens) {
                tokens = currentTokens;
              }
              entry.tokens = `<span class='token-cost' data-tokens='${fullTokens}' data-fragments='${fragments}'>${tokens}</span>`;
            }
          }
          if (egg.name.toLowerCase() === currentSearch.toLowerCase()) {
            entry[`child${items}`] = `<span onClick='dm.breeding.searchChildren("${egg.name}");' class='red-text' style='text-decoration: underline; text-decoration-color: #${egg.eggColor};-webkit-text-decoration-color: #${egg.eggColor}'>${egg.name}(${egg.percentage}%)</span>`;
          } else {
            entry[`child${items}`] = `<span onClick='dm.breeding.searchChildren("${egg.name}");' style='text-decoration: underline; text-decoration-color: #${egg.eggColor};-webkit-text-decoration-color: #${egg.eggColor}'>${egg.name}(${egg.percentage}%)</span>`;
          }
        });
        for ( ; items < 7 ; ++items) {
          entry[`child${items+1}`] = "";
        }
        addEntry(entry);
      });

      if (showtokens) {
        dragoninfo.slideDown('slow');
        $('#dragonstats').html(`FRAGMENTS: ${fragments}`);
        $('#dragonname').html(`DRAGON: ${dragonname}`);
      } else {
        dragoninfo.slideUp('slow');
      }
    }
  }

  function calcTokens(tokens, fragments) {
    let frags = Number(inputFrags.val());
    if (!isNaN(frags)) {
      if (frags > fragments) {
        tokens = 0;
      } else {
        let ratio =  (fragments - frags) / fragments;
        tokens = Math.ceil(tokens * ratio);
      }
    }
    return tokens;
  }

  function updateTokens() {
    $('.token-cost').each(function() {
      let tokens = Number($(this).data('tokens'));
      let fragments = Number($(this).data('fragments'));
      tokens = calcTokens(tokens, fragments);
      $(this).html(tokens);
    });
  }

  function addEntry(entry) {
    let item = {
      parent1: entry.parent1_name,
      parent2: entry.parent2_name,
      child1: entry.child1,
      child2: entry.child2,
      child3: entry.child3,
      child4: entry.child4,
      child5: entry.child5,
      child6: entry.child6,
      tokens: entry.tokens,
      discount: entry.discount
    };
    searchTable.rows.add([item]);
  }

  // The public interface which is exposed through the bluetown_configuration object.
  return {
    init: init,
    searchParent: searchParent,
    searchChildren: searchChildren
  };

})();
