"use strict";
/**
 * Created by sandberg on 19/11/2018.
 */
dm.riders = dm.riders || (function () {
  let backendAPI = null;
  let skillGraph;
  let skillInfo = $('#skillinfo');
  let riderGpSum = $('#riderGpSum');
  let riderGpCost = $('#riderGpCost');
  let riderShardCost = $('#riderShardCost');
  let riderSkillSum = $('#riderSkillSum');
  let riderTable = $('#riderTable');

  function init(api) {
    backendAPI = api;

    $('.riderselect').on('click', function(e) {
      let riderId = this.id;
      fetchRiderInfo(riderId);
    });

    skillGraph = new sigma({
      container: 'skilltree',
      settings: {
        mouseWheelEnabled: false,
        touchEnabled: false,
        zoomMin: 1,
        zoomMax: 1,
        defaultEdgeColor: '#527353',
        defaultNodeColor: '#A5D6A7',
        edgeColor: 'default',
        nodeColor: 'default',
        labelThreshold: 10
      }
    });
    skillGraph.bind("clickNode", showSkillDetails);
  }

  function fetchRiderInfo(id) {
    return $.ajax({
      url: `${backendAPI}/rider?id=${id}`,
    }).done(function (data) {
      if (data.hasOwnProperty('riderinfo')) {
        const riderinfo = data.riderinfo;
        setRiderHeaders(riderinfo);
        setRiderLevels(riderinfo);
        buildSkillTree(riderinfo.skills.nodes, riderinfo.skills.edges);
      }
    });
  }

  function buildSkillTree(nodes, edges) {
    let skillNodes = nodes.map((node) => {
      return {
        id: node.name,
        label: node.label,
        x: node.skillX,
        y: node.skillY,
        size: 2,
        levels: node.levels
      };
    });

    let edgeId = 0;
    let skillEdges = edges.map((edge) => {
      return {
        id: `edge_${edgeId++}`,
        source: edge[0],
        target: edge[1]
      };
    });

    let skillGraph = {
      "nodes": skillNodes,
      "edges": skillEdges
    };
    setSkillTree(skillGraph);
  }

  function setRiderHeaders(riderInfo) {
    riderGpSum.html(`${riderInfo.gpSum} GP`);
    riderGpCost.html(`${riderInfo.costPerXP} ${riderInfo.xpCurrency} per GP`);
    let shardCost = '';
    riderInfo.shardSum.forEach((cost) => {
      shardCost += cost;
      shardCost += '<br>';
    });
    riderShardCost.html(shardCost);
    riderSkillSum.html(riderInfo.skillSum);
  }

  function setRiderLevels(riderinfo) {
    let levels = riderinfo.levels;
    riderTable.empty();
    levels.forEach((level) => {
      riderTable.append(`<tr><td>${level.level}</td><td>${level.xpRequired}</td><td>${level.skillPoints}</td><td>${level.displayCost}</td></tr>`);
    });
  }

  function setSkillTree(skillTree) {
    skillGraph.graph.clear();
    skillGraph.graph.read(skillTree);
    skillGraph.refresh();
  }

  function showSkillDetails(node) {
    let skills = `<i class="green-text lighten-3">${node.data.node.levels.name.toUpperCase()}:</i><br>`;
    node.data.node.levels.levels.forEach((level) => {
      skills += level + '<br>';
    });
    skillInfo.html(skills);
  }

  // The public interface which is exposed
  return {
    init: init
  };

})();
