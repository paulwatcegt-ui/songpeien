import React from 'react';

export default function ExplorationArt() {
  return <div className="monogram about-portrait">
    <img src={`${import.meta.env.BASE_URL}media/about-glitch-portrait-cutout.webp`} width="1122" height="1402" loading="lazy" decoding="async" alt="带有颗粒和故障切片效果的人像艺术照片"/>
  </div>;
}
