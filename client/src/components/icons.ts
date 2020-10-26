import {svg} from "lit-html";

export const iconTest = svg`
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="20" height="20"
     viewBox="10 10 80 80" xml:space="preserve"><g><path d="M75.085,19.17h-50.17c-2.76,0-5,2.24-5,5V75.5c0,2.75,2.24,5,5,5h50.17c2.76,0,5-2.25,5-5V24.17   C80.085,21.41,77.845,19.17,75.085,19.17z M74.085,74.5h-48.17V25.17h48.17V74.5z"/></g>
    <path d="M69.585,36.66c0,1.66-1.34,3-3,3h-33.17c-1.65,0-3-1.34-3-3c0-1.65,1.35-3,3-3h33.17  C68.245,33.66,69.585,35.01,69.585,36.66z"/>
    <path d="M44.755,49.83c0,1.66-1.35,3-3,3h-8.34c-1.65,0-3-1.34-3-3s1.35-3,3-3h8.34C43.405,46.83,44.755,48.17,44.755,49.83z"/>
    <path d="M44.755,63.16c0,1.66-1.35,3-3,3h-8.34c-1.65,0-3-1.34-3-3c0-1.65,1.35-3,3-3h8.34C43.405,60.16,44.755,61.51,44.755,63.16z  "/>
    <path d="M68.766,52.68L58.355,63.1c-0.59,0.58-1.36,0.881-2.121,0.881c-0.77,0-1.539-0.301-2.129-0.881l-4-4  c-1.17-1.17-1.17-3.069,0-4.25c1.17-1.17,3.081-1.17,4.25,0l1.879,1.881l8.291-8.29c1.17-1.171,3.069-1.171,4.24,0  C69.936,49.61,69.936,51.51,68.766,52.68z"/>
</svg>
`;

export const iconPointInTime = svg`
<svg viewBox="0 0 24 24" fill="black" width="18px" height="18px" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0h24v24H0z" fill="none"/>
  <circle style="transition: fill 0.3s ease-in-out; stroke: var(--foreground); stroke-width: 2px; fill: var(--background);" cx="12" cy="12" r="10"/>
</svg>
`;

export const timelineOpen = svg`
<svg slot="onIcon" viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M 3 9 L 7 9 L 7 5 L 3 5 L 3 9 Z M 3 14 L 7 14 L 7 10 L 3 10 L 3 14 Z M 8 14 L 12 14 L 12 10 L 8 10 L 8 14 Z M 8 9 L 12 9 L 12 5 L 8 5 L 8 9 Z M 3 19 L 7 19 L 7 15 L 3 15 L 3 19 Z M 8 19 L 12 19 L 12 15 L 8 15 L 8 19 Z"/>
  <path d="M 14 13 L 22 13 L 22 15 L 14 15 L 14 13 Z M 14 17 L 22 17 L 22 19 L 14 19 L 14 17 Z M 14 9 L 22 9 L 22 11 L 14 11 L 14 9 Z M 14 5 L 22 5 L 22 7 L 14 7 L 14 5 Z"/>
</svg>
`;

export const timelineClosed = svg`
<svg slot="offIcon" viewBox="0 0 24 24" width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M3 9h4V5H3v4zm0 5h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zM8 9h4V5H8v4zm5-4v4h4V5h-4zm5 9h4v-4h-4v4zM3 19h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm0-14v4h4V5h-4z"/>
</svg>
`;
