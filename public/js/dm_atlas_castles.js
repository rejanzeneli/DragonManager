"use strict";
/**
 * Created by sandberg on 28/09/2017.
 */
dm.atlas_castles = dm.atlas_castles || (function () {
  let backendAPI = null;
  let ready = false;
  let castleText = "";

  const $teamtable = $('#team-castle-table');
  const $teamQuery = $('#team-query');
  const $ownTeam = $('#own-team');
  const $teamSearch = $('#atlas-search');

  const $filterAll = $('#filter-all');
  const $filterNml = $('#filter-nml');
  const $filterNeutral = $('#filter-neutral');

  function init(api) {
    backendAPI = api;
    if (ready === true) {
      return;
    }
    ready = true;
    $teamSearch.on('click', searchCastles);
    getTeams();
    new ClipboardJS('.clip-btn', {
      text: function(trigger) {
        return castleText;
      }
    });

    $filterAll.on('click', searchCastles);
    $filterNml.on('click', searchCastles);
    $filterNeutral.on('click', searchCastles);

    $('#castle-table').floatThead({
      top: navbarHeight,
      position: 'fixed'
    });
  }

  function searchCastles() {
    const team = $teamQuery.val();
    const ownteam = $ownTeam.val();
    getTeamCastle(team, ownteam);
  }

  function getTeams() {
    $.ajax({
      url: `${backendAPI}/atlas/teams`,
      type: "GET"
    }).done((response) => {
      let autocomplete = {};
      response.forEach(function(castle) {
        autocomplete[castle] = null;
      });
      $teamQuery.autocomplete({
        data: autocomplete,
      });
      $ownTeam.autocomplete({
        data: autocomplete,
      });
    }).fail((error) => {
      console.log(error);
    });
  }

  function getTeamCastle(team, ownteam) {
    $.ajax({
      url: `${backendAPI}/atlas/castles/${team}/${ownteam}`,
      type: "GET"
    }).done((response) => {
      $teamtable.empty();
      castleText = `${team}:\n`;
      const checkYes = '<i class="material-icons green-text">check_circle</i>';
      const checkNo = '';

      const filterAll = $filterAll.is(':checked');
      const filterNml = $filterNml.is(':checked');
      const filterNeutral = $filterNeutral.is(':checked');
      response.forEach(function (castle) {
        let name = castle.continent;
        if(castle.hasOwnProperty('name')) {
          name = castle.name;
        }
        // match filter
        if ((filterAll) ||
            (filterNml && (castle.nmlConnection || castle.neutralConnection)) ||
            (filterNeutral && castle.neutralConnection)) {
          castleText += `  ${name} (T${castle.level} ${castle.element}) : Coords  X:${castle.x.toFixed(1)} Y:${castle.z.toFixed(1)} (Closest: X:${castle.closestCastle.x.toFixed(1)} Y:${castle.closestCastle.z.toFixed(1)})\n`;

          const nmlConnection = castle.nmlConnection ? checkYes : checkNo;
          const neutralConnection = castle.neutralConnection ? checkYes : checkNo;
          const closest = `X:${castle.closestCastle.x.toFixed(1)} Y:${castle.closestCastle.z.toFixed(1)}`;
          const castleRow = `<tr><td>${name}</td><td>${castle.level}</td><td>${castle.element}</td><td>X:${castle.x.toFixed(1)} Y:${castle.z.toFixed(1)}</td><td>${nmlConnection}</td><td>${neutralConnection}</td><td>${closest}</td></tr>`;
          $teamtable.append(castleRow);
        }
      });
    }).fail((error) => {
      $teamtable.empty();
    });
  }

  return {
    init: init,
  };

})();
