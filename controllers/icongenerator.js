"use strict";

/**
 * Created by sandberg on 24/03/2018.
 */
const fs = require('fs');
const PImage = require('pureimage');

const IMAGESIZE = 32;

function generate(tiers, publicPath) {
  const path = publicPath + '/tier_icons';
  for(let index in tiers) {
    if(tiers.hasOwnProperty(index)) {
      let tierinfo = tiers[index];
      createIcon(tierinfo, path);
    }
  }
}

function createIcon(info, path) {
  let img = PImage.make(IMAGESIZE, IMAGESIZE);
  let ctx = img.getContext('2d');
  ctx.fillStyle = '#' + info.color;
  ctx.beginPath();
  ctx.arc(IMAGESIZE/2, IMAGESIZE/2, IMAGESIZE/2 ,0, Math.PI*2, true);
  ctx.closePath();
  ctx.fill();

  const filename = path + `/icon_${info.name.toLowerCase()}.png`;
  PImage.encodePNGToStream(img, fs.createWriteStream(filename)).then(() => {
  }).catch((e)=>{
    console.log("there was an error writing: " + filename);
  });
}

module.exports = {
    generate: generate
};
