"use strict";
/**
 * Created by sandberg on 28/09/2017.
 */
dm.atlas_rankings = dm.atlas_rankings || (function () {
  let backendAPI = null;
  let ready = false;

  const $teamtable = $('#team-rank-table');
  let teamFilter = $('#team-filter');

  function init(api) {
    backendAPI = api;
    if (ready === true) {
      return;
    }
    ready = true;
    teamFilter.hideseek({
      attribute: 'data-values'
    });

    getTeamRanking();
  }

  function getTeamRanking() {
    $.ajax({
      url: `${backendAPI}/atlas/ranking`,
      type: "GET"
    }).done((response) => {
      $teamtable.empty();
      response.forEach(function (ranking) {
        let tableRow = `<tr data-values="${ranking.team}"><td>${ranking.power_rank}</td><td>${ranking.atlas_rank}</td><td>${ranking.team}</td><td>${ranking.influence}</td></tr>`;
        $teamtable.append(tableRow);
      });
    }).fail((error) => {
      console.log('error', error);
    });
  }


  return {
    init: init
  };

})();
