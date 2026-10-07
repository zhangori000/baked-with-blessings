import type { ReactElement } from 'react'

const riggedDinoSpecies = [
  'brachiosaurus',
  'pterodactyl',
  'quetzalcoatlus',
  'stegosaurus',
  'trex',
  'triceratops',
] as const

export const riggedDinos = new Set<string>(riggedDinoSpecies)

const dinoRigSvgs: Record<string, string> = {
  '/spawnables/trex.svg':
    '<svg class="ecoDinoSvg" width="232" height="170" viewBox="0 0 232 170" xmlns="http://www.w3.org/2000/svg">\n  <ellipse cx="108" cy="163" rx="80" ry="6" fill="#000000" opacity="0.12" />\n  <g class="ecoDinoPart ecoDinoPart--root" transform="translate(0 0)">\n  <g class="ecoDinoPart ecoDinoPart--legFar" transform="rotate(0 104 96)">\n    <ellipse cx="104" cy="100" rx="17" ry="26" transform="rotate(-12 104 100)" fill="#4f4b2b" />\n    <path d="M108 116 L98 146" stroke="#4f4b2b" stroke-width="11" stroke-linecap="round" />\n    <path d="M98 146 L106 158" stroke="#4f4b2b" stroke-width="9" stroke-linecap="round" />\n    <path d="M98 157 L126 158 L126 164 L96 164 Z" fill="#4f4b2b" />\n  </g>\n  <g class="ecoDinoPart ecoDinoPart--body" transform="rotate(0 112 104)">\n  <path d="M90 60 C62 56 34 58 2 66 C30 76 60 84 92 94 Z" fill="#7d7743" />\n  <path d="M90 60 C62 56 34 58 2 66 C34 64 62 64 90 70 Z" fill="#4f4b2b" opacity="0.55" />\n  <path d="M78 64 C92 46 132 40 152 50 C166 58 170 82 158 98 C142 114 104 118 86 104 C72 94 68 76 78 64 Z" fill="#7d7743" />\n  <path d="M84 100 C102 114 138 112 156 96 C150 110 128 120 104 118 C94 116 88 110 84 100 Z" fill="#d9c48c" />\n  <path d="M96 52 C100 58 102 64 102 70 M112 46 C116 52 118 59 118 66 M128 44 C132 50 134 57 134 63 M64 60 C67 64 68 69 68 73 M44 61 C46 65 47 69 47 72" fill="none" stroke="#3a3a24" stroke-width="5" stroke-linecap="round" opacity="0.7" />\n  <g class="ecoDinoPart ecoDinoPart--head" transform="rotate(0 156 58)">\n    <path d="M144 50 C148 38 158 32 170 34 L178 54 C170 66 162 76 156 84 C150 74 144 62 144 50 Z" fill="#7d7743" />\n    <path d="M158 80 C166 72 174 62 178 52 L182 56 C178 68 170 78 162 86 Z" fill="#d9c48c" opacity="0.9" />\n    <g class="ecoDinoPart ecoDinoPart--jaw" transform="rotate(0 168 44)">\n      <path d="M166 42 L211 40 C213 47 207 54 194 56 C180 58 168 54 166 42 Z" fill="#4f4b2b" />\n      <path d="M170 50 C182 54 196 54 206 48 C204 53 196 56 186 57 C178 57 172 55 170 50 Z" fill="#d9c48c" opacity="0.85" />\n      \n    </g>\n    \n    <path d="M154 30 C160 16 184 12 204 18 C214 21 217 30 214 41 L170 44 C160 43 154 38 154 30 Z" fill="#7d7743" />\n    <path d="M160 22 C172 14 190 13 204 18 C192 18 176 20 164 28 Z" fill="#3a3a24" opacity="0.65" />\n    <path d="M176 22 C181 19 188 19 192 22" fill="none" stroke="#3a3a24" stroke-width="3.5" stroke-linecap="round" />\n    <circle cx="185" cy="26" r="3" fill="#fff6e0" />\n    <circle cx="185.6" cy="26.4" r="1.9" fill="#1f241b" />\n    <path d="M207 24 L211 25" stroke="#1f241b" stroke-width="2" stroke-linecap="round" />\n    <path d="M168 37 C182 39 198 38 213 36" fill="none" stroke="#4f4b2b" stroke-width="2.2" stroke-linecap="round" opacity="0.7" />\n    \n    \n  </g>\n  <path d="M152 78 L162 86 L168 84" fill="none" stroke="#4f4b2b" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />\n  <path d="M168 84 L172 82 M168 84 L171 88" stroke="#4f4b2b" stroke-width="2" stroke-linecap="round" />\n  </g>\n  <g class="ecoDinoPart ecoDinoPart--legNear" transform="rotate(0 112 94)">\n    <ellipse cx="112" cy="94" rx="22" ry="30" transform="rotate(-18 112 94)" fill="#7d7743" />\n    <path d="M120 116 L112 146" stroke="#7d7743" stroke-width="13" stroke-linecap="round" />\n    <path d="M112 146 L122 157" stroke="#7d7743" stroke-width="10" stroke-linecap="round" />\n    <path d="M112 156 L142 157 C144 160 144 162 142 164 L110 164 Z" fill="#7d7743" />\n    <path d="M136 157 L146 160 M128 157 L137 161" stroke="#4f4b2b" stroke-width="2.4" stroke-linecap="round" />\n  </g>\n  </g>\n</svg>\n',
  '/spawnables/trex-moss.svg':
    '<svg class="ecoDinoSvg" width="232" height="170" viewBox="0 0 232 170" xmlns="http://www.w3.org/2000/svg">\n  <ellipse cx="108" cy="163" rx="80" ry="6" fill="#000000" opacity="0.12" />\n  <g class="ecoDinoPart ecoDinoPart--root" transform="translate(0 0)">\n  <g class="ecoDinoPart ecoDinoPart--legFar" transform="rotate(0 104 96)">\n    <ellipse cx="104" cy="100" rx="17" ry="26" transform="rotate(-12 104 100)" fill="#3f4a2a" />\n    <path d="M108 116 L98 146" stroke="#3f4a2a" stroke-width="11" stroke-linecap="round" />\n    <path d="M98 146 L106 158" stroke="#3f4a2a" stroke-width="9" stroke-linecap="round" />\n    <path d="M98 157 L126 158 L126 164 L96 164 Z" fill="#3f4a2a" />\n  </g>\n  <g class="ecoDinoPart ecoDinoPart--body" transform="rotate(0 112 104)">\n  <path d="M90 60 C62 56 34 58 2 66 C30 76 60 84 92 94 Z" fill="#64703f" />\n  <path d="M90 60 C62 56 34 58 2 66 C34 64 62 64 90 70 Z" fill="#3f4a2a" opacity="0.55" />\n  <path d="M78 64 C92 46 132 40 152 50 C166 58 170 82 158 98 C142 114 104 118 86 104 C72 94 68 76 78 64 Z" fill="#64703f" />\n  <path d="M84 100 C102 114 138 112 156 96 C150 110 128 120 104 118 C94 116 88 110 84 100 Z" fill="#d2c992" />\n  <path d="M96 52 C100 58 102 64 102 70 M112 46 C116 52 118 59 118 66 M128 44 C132 50 134 57 134 63 M64 60 C67 64 68 69 68 73 M44 61 C46 65 47 69 47 72" fill="none" stroke="#2f3a22" stroke-width="5" stroke-linecap="round" opacity="0.7" />\n  <g class="ecoDinoPart ecoDinoPart--head" transform="rotate(0 156 58)">\n    <path d="M144 50 C148 38 158 32 170 34 L178 54 C170 66 162 76 156 84 C150 74 144 62 144 50 Z" fill="#64703f" />\n    <path d="M158 80 C166 72 174 62 178 52 L182 56 C178 68 170 78 162 86 Z" fill="#d2c992" opacity="0.9" />\n    <g class="ecoDinoPart ecoDinoPart--jaw" transform="rotate(0 168 44)">\n      <path d="M166 42 L211 40 C213 47 207 54 194 56 C180 58 168 54 166 42 Z" fill="#3f4a2a" />\n      <path d="M170 50 C182 54 196 54 206 48 C204 53 196 56 186 57 C178 57 172 55 170 50 Z" fill="#d2c992" opacity="0.85" />\n      \n    </g>\n    \n    <path d="M154 30 C160 16 184 12 204 18 C214 21 217 30 214 41 L170 44 C160 43 154 38 154 30 Z" fill="#64703f" />\n    <path d="M160 22 C172 14 190 13 204 18 C192 18 176 20 164 28 Z" fill="#2f3a22" opacity="0.65" />\n    <path d="M176 22 C181 19 188 19 192 22" fill="none" stroke="#2f3a22" stroke-width="3.5" stroke-linecap="round" />\n    <circle cx="185" cy="26" r="3" fill="#fff6e0" />\n    <circle cx="185.6" cy="26.4" r="1.9" fill="#1f241b" />\n    <path d="M207 24 L211 25" stroke="#1f241b" stroke-width="2" stroke-linecap="round" />\n    <path d="M168 37 C182 39 198 38 213 36" fill="none" stroke="#3f4a2a" stroke-width="2.2" stroke-linecap="round" opacity="0.7" />\n    \n    \n  </g>\n  <path d="M152 78 L162 86 L168 84" fill="none" stroke="#3f4a2a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />\n  <path d="M168 84 L172 82 M168 84 L171 88" stroke="#3f4a2a" stroke-width="2" stroke-linecap="round" />\n  </g>\n  <g class="ecoDinoPart ecoDinoPart--legNear" transform="rotate(0 112 94)">\n    <ellipse cx="112" cy="94" rx="22" ry="30" transform="rotate(-18 112 94)" fill="#64703f" />\n    <path d="M120 116 L112 146" stroke="#64703f" stroke-width="13" stroke-linecap="round" />\n    <path d="M112 146 L122 157" stroke="#64703f" stroke-width="10" stroke-linecap="round" />\n    <path d="M112 156 L142 157 C144 160 144 162 142 164 L110 164 Z" fill="#64703f" />\n    <path d="M136 157 L146 160 M128 157 L137 161" stroke="#3f4a2a" stroke-width="2.4" stroke-linecap="round" />\n  </g>\n  </g>\n</svg>\n',
  '/spawnables/trex-russet.svg':
    '<svg class="ecoDinoSvg" width="232" height="170" viewBox="0 0 232 170" xmlns="http://www.w3.org/2000/svg">\n  <ellipse cx="108" cy="163" rx="80" ry="6" fill="#000000" opacity="0.12" />\n  <g class="ecoDinoPart ecoDinoPart--root" transform="translate(0 0)">\n  <g class="ecoDinoPart ecoDinoPart--legFar" transform="rotate(0 104 96)">\n    <ellipse cx="104" cy="100" rx="17" ry="26" transform="rotate(-12 104 100)" fill="#5a3f2a" />\n    <path d="M108 116 L98 146" stroke="#5a3f2a" stroke-width="11" stroke-linecap="round" />\n    <path d="M98 146 L106 158" stroke="#5a3f2a" stroke-width="9" stroke-linecap="round" />\n    <path d="M98 157 L126 158 L126 164 L96 164 Z" fill="#5a3f2a" />\n  </g>\n  <g class="ecoDinoPart ecoDinoPart--body" transform="rotate(0 112 104)">\n  <path d="M90 60 C62 56 34 58 2 66 C30 76 60 84 92 94 Z" fill="#8a6440" />\n  <path d="M90 60 C62 56 34 58 2 66 C34 64 62 64 90 70 Z" fill="#5a3f2a" opacity="0.55" />\n  <path d="M78 64 C92 46 132 40 152 50 C166 58 170 82 158 98 C142 114 104 118 86 104 C72 94 68 76 78 64 Z" fill="#8a6440" />\n  <path d="M84 100 C102 114 138 112 156 96 C150 110 128 120 104 118 C94 116 88 110 84 100 Z" fill="#e0c497" />\n  <path d="M96 52 C100 58 102 64 102 70 M112 46 C116 52 118 59 118 66 M128 44 C132 50 134 57 134 63 M64 60 C67 64 68 69 68 73 M44 61 C46 65 47 69 47 72" fill="none" stroke="#4a3020" stroke-width="5" stroke-linecap="round" opacity="0.7" />\n  <g class="ecoDinoPart ecoDinoPart--head" transform="rotate(0 156 58)">\n    <path d="M144 50 C148 38 158 32 170 34 L178 54 C170 66 162 76 156 84 C150 74 144 62 144 50 Z" fill="#8a6440" />\n    <path d="M158 80 C166 72 174 62 178 52 L182 56 C178 68 170 78 162 86 Z" fill="#e0c497" opacity="0.9" />\n    <g class="ecoDinoPart ecoDinoPart--jaw" transform="rotate(0 168 44)">\n      <path d="M166 42 L211 40 C213 47 207 54 194 56 C180 58 168 54 166 42 Z" fill="#5a3f2a" />\n      <path d="M170 50 C182 54 196 54 206 48 C204 53 196 56 186 57 C178 57 172 55 170 50 Z" fill="#e0c497" opacity="0.85" />\n      \n    </g>\n    \n    <path d="M154 30 C160 16 184 12 204 18 C214 21 217 30 214 41 L170 44 C160 43 154 38 154 30 Z" fill="#8a6440" />\n    <path d="M160 22 C172 14 190 13 204 18 C192 18 176 20 164 28 Z" fill="#4a3020" opacity="0.65" />\n    <path d="M176 22 C181 19 188 19 192 22" fill="none" stroke="#4a3020" stroke-width="3.5" stroke-linecap="round" />\n    <circle cx="185" cy="26" r="3" fill="#fff6e0" />\n    <circle cx="185.6" cy="26.4" r="1.9" fill="#1f241b" />\n    <path d="M207 24 L211 25" stroke="#1f241b" stroke-width="2" stroke-linecap="round" />\n    <path d="M168 37 C182 39 198 38 213 36" fill="none" stroke="#5a3f2a" stroke-width="2.2" stroke-linecap="round" opacity="0.7" />\n    \n    \n  </g>\n  <path d="M152 78 L162 86 L168 84" fill="none" stroke="#5a3f2a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />\n  <path d="M168 84 L172 82 M168 84 L171 88" stroke="#5a3f2a" stroke-width="2" stroke-linecap="round" />\n  </g>\n  <g class="ecoDinoPart ecoDinoPart--legNear" transform="rotate(0 112 94)">\n    <ellipse cx="112" cy="94" rx="22" ry="30" transform="rotate(-18 112 94)" fill="#8a6440" />\n    <path d="M120 116 L112 146" stroke="#8a6440" stroke-width="13" stroke-linecap="round" />\n    <path d="M112 146 L122 157" stroke="#8a6440" stroke-width="10" stroke-linecap="round" />\n    <path d="M112 156 L142 157 C144 160 144 162 142 164 L110 164 Z" fill="#8a6440" />\n    <path d="M136 157 L146 160 M128 157 L137 161" stroke="#5a3f2a" stroke-width="2.4" stroke-linecap="round" />\n  </g>\n  </g>\n</svg>\n',
  '/spawnables/triceratops.svg':
    '<svg class="ecoDinoSvg" width="168" height="98" viewBox="0 0 168 98" xmlns="http://www.w3.org/2000/svg">\n  <ellipse class="ecoDinoShadow" cx="82" cy="92" rx="56" ry="5" fill="#000000" opacity="0.1" />\n  <path d="M28 64C42 42 85 37 116 51C137 60 136 83 111 91C76 102 40 91 28 64Z" fill="#cfa86e" />\n  <path\n    d="M50 80C74 92 113 89 128 68C123 92 89 102 56 91C39 85 30 76 29 63C35 70 42 76 50 80Z"\n    fill="#9e7c52"\n    opacity="0.82"\n  />\n  <path\n    d="M100 49C105 23 128 10 154 18C162 33 158 54 138 65C123 68 109 60 100 49Z"\n    fill="#d9b77d"\n  />\n  <path\n    d="M108 45C115 28 132 20 151 24C154 36 149 49 137 57C125 59 114 54 108 45Z"\n    fill="#a85f3f"\n  />\n  <circle cx="130" cy="36" r="5" fill="#d28a4a" opacity="0.85" />\n  <circle cx="145" cy="43" r="4" fill="#d28a4a" opacity="0.75" />\n  <path d="M130 26L139 2L147 29Z" fill="#f7e3b3" />\n  <path d="M111 40L92 23L112 50Z" fill="#f7e3b3" />\n  <path d="M151 40L168 27L154 50Z" fill="#f7e3b3" />\n  <path d="M154 50L166 55L152 60Z" fill="#785038" />\n  <circle cx="143" cy="39" r="2" fill="#26312a" />\n  <path\n    d="M57 87Q51 94 42 96"\n    fill="none"\n    stroke="#8a6a45"\n    stroke-width="7"\n    stroke-linecap="round"\n  />\n  <path\n    d="M99 88Q106 95 118 95"\n    fill="none"\n    stroke="#8a6a45"\n    stroke-width="7"\n    stroke-linecap="round"\n  />\n  <path\n    d="M29 63C17 58 8 51 1 43"\n    fill="none"\n    stroke="#9e7c52"\n    stroke-width="9"\n    stroke-linecap="round"\n  />\n<g class="ecoDinoPart ecoDinoPart--body"></g></svg>\n',
  '/spawnables/stegosaurus.svg':
    '<svg class="ecoDinoSvg" width="168" height="104" viewBox="0 0 168 104" xmlns="http://www.w3.org/2000/svg">\n  <ellipse class="ecoDinoShadow" cx="82" cy="98" rx="58" ry="5" fill="#000000" opacity="0.1" />\n  <path d="M19 72C38 49 80 42 116 54C137 61 139 81 120 92C88 109 42 99 19 72Z" fill="#758f62" />\n  <path\n    d="M46 85C76 99 113 91 127 69C124 94 92 107 56 98C36 93 23 84 19 72C28 78 36 83 46 85Z"\n    fill="#5f774f"\n    opacity="0.82"\n  />\n  <path d="M37 52L49 22L59 55Z" fill="#d07b43" />\n  <path d="M58 47L73 12L83 50Z" fill="#e19450" />\n  <path d="M83 45L99 16L107 52Z" fill="#d07b43" />\n  <path d="M108 54L122 29L126 61Z" fill="#e19450" />\n  <path d="M120 59C135 51 151 52 163 63C157 76 140 81 124 72Z" fill="#758f62" />\n  <circle cx="151" cy="62" r="1.8" fill="#26312a" />\n  <path\n    d="M20 72C8 76 3 84 0 96"\n    fill="none"\n    stroke="#5f774f"\n    stroke-width="8"\n    stroke-linecap="round"\n  />\n  <path\n    d="M5 96L0 84M5 96L15 88M5 96L17 101"\n    fill="none"\n    stroke="#e6d7a3"\n    stroke-width="4"\n    stroke-linecap="round"\n  />\n  <path\n    d="M55 90V103M91 92V103M116 84V101"\n    fill="none"\n    stroke="#5f774f"\n    stroke-width="8"\n    stroke-linecap="round"\n  />\n<g class="ecoDinoPart ecoDinoPart--body"></g></svg>\n',
  '/spawnables/brachiosaurus.svg':
    '<svg class="ecoDinoSvg" width="260" height="210" viewBox="0 0 260 210" xmlns="http://www.w3.org/2000/svg">\n  <ellipse class="ecoDinoShadow" cx="104" cy="203" rx="78" ry="6" fill="#000000" opacity="0.11" />\n  <path d="M72 140 L88 140 L87 200 C90 204 91 204 89 204 L71 204 C70 204 72 202 73 200 Z" fill="#607f90" />\n  <path d="M141.5 118 L158.5 118 L157.5 200 C160.5 204 161.5 204 159.5 204 L140.5 204 C139.5 204 141.5 202 142.5 200 Z" fill="#607f90" />\n  <path d="M61.9 127.2 L59.1 128.1 L56.3 129 L53.5 130 L50.8 131 L48.2 132.1 L45.6 133.3 L43 134.5 L40.5 135.7 L38.1 137 L35.7 138.3 L33.4 139.7 L31.1 141.1 L28.9 142.5 L26.8 144 L24.7 145.6 L22.6 147.1 L20.7 148.8 L18.8 150.4 L16.9 152.1 L15.1 153.9 L13.4 155.6 L11.7 157.4 L10.1 159.3 L8.5 161.2 L7 163.1 L5.6 165 L4.2 167 L2.9 169 L5.1 171 L7 169.6 L8.9 168.3 L10.8 167.1 L12.7 165.9 L14.6 164.7 L16.6 163.6 L18.6 162.6 L20.6 161.7 L22.7 160.7 L24.8 159.9 L26.8 159.1 L29 158.3 L31.1 157.6 L33.2 157 L35.4 156.4 L37.6 155.8 L39.8 155.3 L42.1 154.9 L44.4 154.5 L46.7 154.1 L49 153.8 L51.3 153.5 L53.7 153.3 L56.1 153.1 L58.6 153 L61 152.9 L63.5 152.8 L66.1 152.8Z" fill="#8aa8b6" />\n  <path d="M63.9 145.5 L61.4 146 L58.8 146.5 L56.4 147 L53.9 147.5 L51.5 148.1 L49.1 148.8 L46.8 149.4 L44.5 150.1 L42.2 150.8 L40 151.6 L37.8 152.4 L35.6 153.2 L33.5 154.1 L31.4 155 L29.3 155.9 L27.3 156.9 L25.3 157.8 L23.4 158.9 L21.5 159.9 L19.6 161 L17.8 162.1 L16 163.3 L14.2 164.5 L12.5 165.7 L10.8 167 L9.1 168.3 L7.5 169.6 L5.9 170.9 L7.2 172.4 L9 171.3 L10.7 170.3 L12.5 169.3 L14.3 168.3 L16.1 167.3 L18 166.4 L19.9 165.5 L21.8 164.7 L23.7 163.9 L25.7 163.2 L27.6 162.4 L29.7 161.8 L31.7 161.1 L33.8 160.5 L35.8 159.9 L38 159.4 L40.1 158.8 L42.3 158.4 L44.5 157.9 L46.7 157.5 L49 157.1 L51.2 156.8 L53.6 156.5 L55.9 156.2 L58.3 155.9 L60.7 155.7 L63.1 155.5 L65.6 155.4Z" fill="#607f90" opacity="0.55" />\n  <path d="M168.8 124.7 L171.5 121.4 L174.1 118 L176.7 114.6 L179.1 111.2 L181.5 107.8 L183.8 104.4 L186 101 L188.2 97.5 L190.2 94.1 L192.2 90.6 L194 87.1 L195.8 83.6 L197.5 80.2 L199.1 76.7 L200.6 73.2 L202 69.6 L203.4 66.1 L204.6 62.6 L205.8 59.1 L206.9 55.6 L207.8 52.1 L208.8 48.5 L209.6 45 L210.3 41.5 L210.9 38 L211.5 34.4 L212 30.9 L212.3 27.4 L199.7 24.6 L198.5 27.7 L197.3 30.7 L196.1 33.6 L194.8 36.6 L193.4 39.5 L191.9 42.3 L190.4 45.2 L188.8 48 L187.2 50.8 L185.4 53.6 L183.7 56.3 L181.8 59 L179.9 61.7 L177.9 64.3 L175.9 67 L173.8 69.6 L171.6 72.2 L169.3 74.7 L167 77.3 L164.7 79.8 L162.2 82.3 L159.7 84.8 L157.1 87.2 L154.5 89.7 L151.8 92.1 L149 94.5 L146.2 96.9 L143.2 99.3Z" fill="#8aa8b6" />\n  <path d="M154.5 110.5 L157.3 107.7 L160.1 104.9 L162.8 102.1 L165.4 99.2 L167.9 96.3 L170.4 93.5 L172.8 90.6 L175.1 87.6 L177.3 84.7 L179.5 81.8 L181.5 78.8 L183.5 75.8 L185.5 72.8 L187.3 69.8 L189.1 66.8 L190.8 63.7 L192.4 60.7 L194 57.6 L195.5 54.5 L196.9 51.4 L198.2 48.3 L199.5 45.1 L200.7 42 L201.8 38.8 L202.8 35.6 L203.7 32.4 L204.6 29.1 L205.4 25.9 L201.5 25 L200.4 28.1 L199.2 31.1 L197.9 34.2 L196.6 37.1 L195.2 40.1 L193.7 43 L192.2 45.9 L190.6 48.7 L188.9 51.6 L187.2 54.4 L185.4 57.1 L183.5 59.9 L181.6 62.6 L179.6 65.3 L177.5 68 L175.4 70.6 L173.2 73.2 L170.9 75.8 L168.6 78.4 L166.2 80.9 L163.7 83.5 L161.2 86 L158.6 88.5 L155.9 90.9 L153.2 93.4 L150.4 95.8 L147.5 98.2 L144.6 100.6Z" fill="#b9cdd4" opacity="0.75" />\n  <path d="M163.4 119.3 L166.1 116.2 L168.8 113 L171.4 109.9 L173.9 106.7 L176.4 103.5 L178.8 100.3 L181 97 L183.2 93.8 L185.3 90.5 L187.4 87.3 L189.3 84 L191.2 80.7 L193 77.4 L194.7 74.1 L196.3 70.8 L197.8 67.4 L199.3 64.1 L200.7 60.7 L201.9 57.4 L203.1 54 L204.3 50.6 L205.3 47.3 L206.3 43.9 L207.1 40.5 L207.9 37.1 L208.6 33.7 L209.3 30.2 L209.8 26.8 L206.9 26.2 L206.2 29.5 L205.4 32.8 L204.5 36.1 L203.6 39.4 L202.6 42.6 L201.5 45.9 L200.3 49.1 L199.1 52.3 L197.7 55.5 L196.3 58.7 L194.8 61.9 L193.3 65 L191.6 68.2 L189.9 71.3 L188.1 74.5 L186.3 77.6 L184.3 80.6 L182.3 83.7 L180.2 86.8 L178 89.8 L175.7 92.9 L173.4 95.9 L171 98.9 L168.5 101.9 L165.9 104.9 L163.2 107.8 L160.5 110.8 L157.7 113.7Z" fill="#607f90" opacity="0.45" />\n  <path d="M54 132C66 100 120 86 164 100C186 108 190 140 174 158C148 182 84 182 60 164C48 155 48 142 54 132Z" fill="#8aa8b6" />\n  <path d="M62 160C88 176 146 176 172 154C168 170 148 182 112 183C84 183 66 176 62 160Z" fill="#b9cdd4" opacity="0.8" />\n  <path d="M80 106C104 96 140 94 164 104" fill="none" stroke="#607f90" stroke-width="5" stroke-linecap="round" opacity="0.4" />\n  <ellipse cx="98" cy="118" rx="7" ry="4" fill="#7695a4" opacity="0.7" />\n  <ellipse cx="120" cy="110" rx="6" ry="3.5" fill="#7695a4" opacity="0.7" />\n  <ellipse cx="140" cy="116" rx="5" ry="3" fill="#7695a4" opacity="0.7" />\n  <ellipse cx="112" cy="132" rx="5" ry="3" fill="#7695a4" opacity="0.7" />\n  <ellipse cx="80" cy="128" rx="5" ry="3" fill="#7695a4" opacity="0.7" />\n  <path d="M91 150 L109 150 L108 200 C111 204 112 204 110 204 L90 204 C89 204 91 202 92 200 Z" fill="#8aa8b6" />\n  <path d="M158.5 132 L177.5 132 L176.5 200 C179.5 204 180.5 204 178.5 204 L157.5 204 C156.5 204 158.5 202 159.5 200 Z" fill="#8aa8b6" />\n  <path d="M93 202h4M99 202h4M105 202h3" stroke="#607f90" stroke-width="2" stroke-linecap="round" />\n  <path d="M161 202h4M167 202h4M173 202h3" stroke="#607f90" stroke-width="2" stroke-linecap="round" />\n  <g transform="translate(206 26) rotate(-6)">\n    \n    <path d="M-7 3C-9 -9 0 -15 8 -13C11 -20 20 -21 24 -14C31 -12 37 -6 37 0C37 5 32 7 24 7L0 9C-4 9 -6 7 -7 3Z" fill="#8aa8b6" />\n    <path d="M9 -13C12 -19 19 -20 23 -14C19 -15 14 -14 9 -13Z" fill="#607f90" opacity="0.7" />\n    <path d="M20 4C26 4 31 3 36 1" fill="none" stroke="#607f90" stroke-width="1.8" stroke-linecap="round" />\n    <circle cx="12" cy="-5" r="2.6" fill="#f6f1e4" />\n    <circle cx="12.6" cy="-4.8" r="1.7" fill="#26312a" />\n    <ellipse cx="24" cy="-10" rx="2" ry="1.2" fill="#4d6470" />\n    \n  </g>\n<g class="ecoDinoPart ecoDinoPart--body"></g></svg>\n',
  '/spawnables/pterodactyl.svg':
    '<svg class="ecoDinoSvg" width="200" height="110" viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">\n  <ellipse class="ecoDinoShadow" cx="100" cy="104" rx="40" ry="3.5" fill="#000000" opacity="0.07" />\n  <path d="M94 60C82 44 70 28 54 14C40 8 20 8 2 14C14 20 22 30 28 42C36 46 40 52 42 60C54 58 62 62 70 70C78 70 86 68 94 66Z" fill="#9e6744" />\n  <path d="M94 60C82 44 70 28 54 14C40 8 20 8 2 14" fill="none" stroke="#7a5038" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />\n  <path d="M106 60C116 40 128 24 146 12C162 6 184 8 198 16C184 20 174 30 168 42C160 44 154 50 150 58C138 56 128 60 120 68C114 68 110 66 106 66Z" fill="#c4875a" />\n  <path d="M168 42C160 44 154 50 150 58C138 56 128 60 120 68" fill="none" stroke="#9e6744" stroke-width="1.6" opacity="0.6" />\n  <path d="M106 60C116 40 128 24 146 12C162 6 184 8 198 16" fill="none" stroke="#7a5038" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />\n  <path d="M146 12L140 20M146 12L150 21" stroke="#7a5038" stroke-width="1.6" stroke-linecap="round" />\n  <path d="M150 22C140 34 132 46 124 60M172 18C160 30 150 42 138 58" fill="none" stroke="#e6b98a" stroke-width="1.4" opacity="0.55" />\n  <path d="M40 16C54 26 66 40 78 58M20 14C36 24 50 38 60 54" fill="none" stroke="#e6b98a" stroke-width="1.4" opacity="0.35" />\n  <path d="M86 70Q80 82 74 90M96 70Q98 82 92 92" fill="none" stroke="#b8885c" stroke-width="3" stroke-linecap="round" />\n  <path d="M72 90l-4 2M72 90l-2 4M90 92l-4 2M90 92l-1 4" stroke="#b8885c" stroke-width="1.6" stroke-linecap="round" />\n  <path d="M80 60C88 52 106 52 116 58C118 66 108 74 94 74C82 74 76 68 80 60Z" fill="#d8a775" />\n  <path d="M82 68C90 74 104 74 112 68C106 75 92 77 82 68Z" fill="#b8885c" opacity="0.7" />\n  <path d="M112.5 64.9 L113 64.6 L113.5 64.3 L114.1 63.9 L114.6 63.6 L115.1 63.3 L115.6 63 L116 62.7 L116.5 62.4 L117 62.1 L117.4 61.8 L117.9 61.6 L118.3 61.3 L118.7 61 L119.1 60.7 L119.5 60.5 L119.9 60.2 L120.3 60 L120.7 59.7 L121 59.5 L121.4 59.3 L121.7 59 L122 58.8 L122.4 58.6 L122.7 58.4 L123 58.2 L123.2 58 L123.5 57.8 L123.8 57.6 L120.2 50.4 L119.9 50.5 L119.6 50.6 L119.2 50.7 L118.9 50.8 L118.5 51 L118.2 51.1 L117.8 51.2 L117.4 51.3 L117 51.5 L116.6 51.6 L116.2 51.8 L115.8 51.9 L115.3 52.1 L114.9 52.3 L114.4 52.4 L114 52.6 L113.5 52.8 L113 53 L112.5 53.1 L112 53.3 L111.5 53.5 L110.9 53.7 L110.4 54 L109.8 54.2 L109.3 54.4 L108.7 54.6 L108.1 54.8 L107.5 55.1Z" fill="#d8a775" />\n  <g transform="translate(122 54)">\n    <path d="M-2 -4C-12 -16 -28 -26 -44 -30C-34 -20 -20 -10 -6 2Z" fill="#c4483a" />\n    <path d="M-4 -6C-14 -15 -26 -22 -38 -26C-28 -18 -18 -10 -6 -2Z" fill="#9e3a2f" opacity="0.6" />\n    <path d="M10 2L72 6L10 9Z" fill="#ecc98f" />\n    <path d="M10 2L72 6" stroke="#b3905c" stroke-width="1.2" opacity="0.7" />\n    <path d="M10 -6C26 -4 50 -1 74 3L10 4Z" fill="#ecc98f" />\n    <path d="M-6 -2C-6 -10 2 -12 10 -9C16 -7 16 4 10 8C2 10 -6 6 -6 -2Z" fill="#d8a775" />\n    <circle cx="5" cy="-3" r="2.4" fill="#f8efdc" />\n    <circle cx="5.6" cy="-2.8" r="1.5" fill="#26312a" />\n  </g>\n<g class="ecoDinoPart ecoDinoPart--body"></g></svg>\n',
}

// Stable objects: React re-applies innerHTML when the object changes, which would rebuild the
// SVG (and restart its CSS animations) on every re-render.
const dinoRigHtml: Record<string, { __html: string }> = Object.fromEntries(
  Object.entries(dinoRigSvgs).map(([asset, svg]) => [asset, { __html: svg }]),
)

const fallbackBySpecies: Record<string, string> = {
  brachiosaurus: '/spawnables/brachiosaurus.svg',
  pterodactyl: '/spawnables/pterodactyl.svg',
  quetzalcoatlus: '/spawnables/quetzalcoatlus.svg',
  stegosaurus: '/spawnables/stegosaurus.svg',
  trex: '/spawnables/trex.svg',
  triceratops: '/spawnables/triceratops.svg',
}

function BrachiosaurusRig(): ReactElement {
  const neckPaths = (
    <>
      <path
        d="M168.8 124.7 L171.5 121.4 L174.1 118 L176.7 114.6 L179.1 111.2 L181.5 107.8 L183.8 104.4 L186 101 L188.2 97.5 L190.2 94.1 L192.2 90.6 L194 87.1 L195.8 83.6 L197.5 80.2 L199.1 76.7 L200.6 73.2 L202 69.6 L203.4 66.1 L204.6 62.6 L205.8 59.1 L206.9 55.6 L207.8 52.1 L208.8 48.5 L209.6 45 L210.3 41.5 L210.9 38 L211.5 34.4 L212 30.9 L212.3 27.4 L199.7 24.6 L198.5 27.7 L197.3 30.7 L196.1 33.6 L194.8 36.6 L193.4 39.5 L191.9 42.3 L190.4 45.2 L188.8 48 L187.2 50.8 L185.4 53.6 L183.7 56.3 L181.8 59 L179.9 61.7 L177.9 64.3 L175.9 67 L173.8 69.6 L171.6 72.2 L169.3 74.7 L167 77.3 L164.7 79.8 L162.2 82.3 L159.7 84.8 L157.1 87.2 L154.5 89.7 L151.8 92.1 L149 94.5 L146.2 96.9 L143.2 99.3Z"
        fill="#8aa8b6"
      />
      <path
        d="M154.5 110.5 L157.3 107.7 L160.1 104.9 L162.8 102.1 L165.4 99.2 L167.9 96.3 L170.4 93.5 L172.8 90.6 L175.1 87.6 L177.3 84.7 L179.5 81.8 L181.5 78.8 L183.5 75.8 L185.5 72.8 L187.3 69.8 L189.1 66.8 L190.8 63.7 L192.4 60.7 L194 57.6 L195.5 54.5 L196.9 51.4 L198.2 48.3 L199.5 45.1 L200.7 42 L201.8 38.8 L202.8 35.6 L203.7 32.4 L204.6 29.1 L205.4 25.9 L201.5 25 L200.4 28.1 L199.2 31.1 L197.9 34.2 L196.6 37.1 L195.2 40.1 L193.7 43 L192.2 45.9 L190.6 48.7 L188.9 51.6 L187.2 54.4 L185.4 57.1 L183.5 59.9 L181.6 62.6 L179.6 65.3 L177.5 68 L175.4 70.6 L173.2 73.2 L170.9 75.8 L168.6 78.4 L166.2 80.9 L163.7 83.5 L161.2 86 L158.6 88.5 L155.9 90.9 L153.2 93.4 L150.4 95.8 L147.5 98.2 L144.6 100.6Z"
        fill="#b9cdd4"
        opacity="0.75"
      />
      <path
        d="M163.4 119.3 L166.1 116.2 L168.8 113 L171.4 109.9 L173.9 106.7 L176.4 103.5 L178.8 100.3 L181 97 L183.2 93.8 L185.3 90.5 L187.4 87.3 L189.3 84 L191.2 80.7 L193 77.4 L194.7 74.1 L196.3 70.8 L197.8 67.4 L199.3 64.1 L200.7 60.7 L201.9 57.4 L203.1 54 L204.3 50.6 L205.3 47.3 L206.3 43.9 L207.1 40.5 L207.9 37.1 L208.6 33.7 L209.3 30.2 L209.8 26.8 L206.9 26.2 L206.2 29.5 L205.4 32.8 L204.5 36.1 L203.6 39.4 L202.6 42.6 L201.5 45.9 L200.3 49.1 L199.1 52.3 L197.7 55.5 L196.3 58.7 L194.8 61.9 L193.3 65 L191.6 68.2 L189.9 71.3 L188.1 74.5 L186.3 77.6 L184.3 80.6 L182.3 83.7 L180.2 86.8 L178 89.8 L175.7 92.9 L173.4 95.9 L171 98.9 L168.5 101.9 L165.9 104.9 L163.2 107.8 L160.5 110.8 L157.7 113.7Z"
        fill="#607f90"
        opacity="0.45"
      />
    </>
  )

  return (
    <span aria-hidden="true" className="ecoDinoRig ecoDinoRig--brachio">
      <svg
        className="ecoDinoSvg"
        height="210"
        viewBox="0 0 260 210"
        width="260"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="brachioNeckBase">
            <path d="M139 88H179V129H139Z" />
          </clipPath>
          <clipPath id="brachioNeckMid">
            <path d="M158 56H199V103H158Z" />
          </clipPath>
          <clipPath id="brachioNeckTip">
            <path d="M178 20H217V69H178Z" />
          </clipPath>
        </defs>
        <ellipse
          className="ecoDinoShadow"
          cx="104"
          cy="203"
          fill="#000000"
          opacity="0.11"
          rx="78"
          ry="6"
        />
        <g className="ecoDinoPart ecoDinoPart--legFar" transform="rotate(0 80 140)">
          <path
            d="M72 140 L88 140 L87 200 C90 204 91 204 89 204 L71 204 C70 204 72 202 73 200 Z"
            fill="#607f90"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--legFar2" transform="rotate(0 150 118)">
          <path
            d="M141.5 118 L158.5 118 L157.5 200 C160.5 204 161.5 204 159.5 204 L140.5 204 C139.5 204 141.5 202 142.5 200 Z"
            fill="#607f90"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--tail1" transform="rotate(0 62 132)">
          <path
            d="M61.9 127.2 L59.1 128.1 L56.3 129 L53.5 130 L50.8 131 L48.2 132.1 L45.6 133.3 L43 134.5 L40.5 135.7 L38.1 137 L35.7 138.3 L33.4 139.7 L31.1 141.1 L28.9 142.5 L26.8 144 L24.7 145.6 L22.6 147.1 L20.7 148.8 L18.8 150.4 L16.9 152.1 L15.1 153.9 L13.4 155.6 L11.7 157.4 L10.1 159.3 L8.5 161.2 L7 163.1 L5.6 165 L4.2 167 L2.9 169 L5.1 171 L7 169.6 L8.9 168.3 L10.8 167.1 L12.7 165.9 L14.6 164.7 L16.6 163.6 L18.6 162.6 L20.6 161.7 L22.7 160.7 L24.8 159.9 L26.8 159.1 L29 158.3 L31.1 157.6 L33.2 157 L35.4 156.4 L37.6 155.8 L39.8 155.3 L42.1 154.9 L44.4 154.5 L46.7 154.1 L49 153.8 L51.3 153.5 L53.7 153.3 L56.1 153.1 L58.6 153 L61 152.9 L63.5 152.8 L66.1 152.8Z"
            fill="#8aa8b6"
          />
          <path
            d="M63.9 145.5 L61.4 146 L58.8 146.5 L56.4 147 L53.9 147.5 L51.5 148.1 L49.1 148.8 L46.8 149.4 L44.5 150.1 L42.2 150.8 L40 151.6 L37.8 152.4 L35.6 153.2 L33.5 154.1 L31.4 155 L29.3 155.9 L27.3 156.9 L25.3 157.8 L23.4 158.9 L21.5 159.9 L19.6 161 L17.8 162.1 L16 163.3 L14.2 164.5 L12.5 165.7 L10.8 167 L9.1 168.3 L7.5 169.6 L5.9 170.9 L7.2 172.4 L9 171.3 L10.7 170.3 L12.5 169.3 L14.3 168.3 L16.1 167.3 L18 166.4 L19.9 165.5 L21.8 164.7 L23.7 163.9 L25.7 163.2 L27.6 162.4 L29.7 161.8 L31.7 161.1 L33.8 160.5 L35.8 159.9 L38 159.4 L40.1 158.8 L42.3 158.4 L44.5 157.9 L46.7 157.5 L49 157.1 L51.2 156.8 L53.6 156.5 L55.9 156.2 L58.3 155.9 L60.7 155.7 L63.1 155.5 L65.6 155.4Z"
            fill="#607f90"
            opacity="0.55"
          />
        </g>
        <g
          className="ecoDinoPart ecoDinoPart--neckBase"
          clipPath="url(#brachioNeckBase)"
          transform="rotate(0 144 101)"
        >
          {neckPaths}
        </g>
        <g
          className="ecoDinoPart ecoDinoPart--neckMid"
          clipPath="url(#brachioNeckMid)"
          transform="rotate(0 166 79)"
        >
          {neckPaths}
        </g>
        <g
          className="ecoDinoPart ecoDinoPart--neckTip"
          clipPath="url(#brachioNeckTip)"
          transform="rotate(0 199 31)"
        >
          {neckPaths}
        </g>
        <g className="ecoDinoPart ecoDinoPart--body" transform="rotate(0 112 142)">
          <path
            d="M54 132C66 100 120 86 164 100C186 108 190 140 174 158C148 182 84 182 60 164C48 155 48 142 54 132Z"
            fill="#8aa8b6"
          />
          <path
            d="M62 160C88 176 146 176 172 154C168 170 148 182 112 183C84 183 66 176 62 160Z"
            fill="#b9cdd4"
            opacity="0.8"
          />
          <path
            d="M80 106C104 96 140 94 164 104"
            fill="none"
            opacity="0.4"
            stroke="#607f90"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <ellipse cx="98" cy="118" fill="#7695a4" opacity="0.7" rx="7" ry="4" />
          <ellipse cx="120" cy="110" fill="#7695a4" opacity="0.7" rx="6" ry="3.5" />
          <ellipse cx="140" cy="116" fill="#7695a4" opacity="0.7" rx="5" ry="3" />
          <ellipse cx="112" cy="132" fill="#7695a4" opacity="0.7" rx="5" ry="3" />
          <ellipse cx="80" cy="128" fill="#7695a4" opacity="0.7" rx="5" ry="3" />
        </g>
        <g className="ecoDinoPart ecoDinoPart--legNear" transform="rotate(0 101 150)">
          <path
            d="M91 150 L109 150 L108 200 C111 204 112 204 110 204 L90 204 C89 204 91 202 92 200 Z"
            fill="#8aa8b6"
          />
          <path
            d="M93 202h4M99 202h4M105 202h3"
            fill="none"
            stroke="#607f90"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--legNear2" transform="rotate(0 168 132)">
          <path
            d="M158.5 132 L177.5 132 L176.5 200 C179.5 204 180.5 204 178.5 204 L157.5 204 C156.5 204 158.5 202 159.5 200 Z"
            fill="#8aa8b6"
          />
          <path
            d="M161 202h4M167 202h4M173 202h3"
            fill="none"
            stroke="#607f90"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--head" transform="translate(206 26) rotate(-6)">
          <path
            d="M-7 3C-9 -9 0 -15 8 -13C11 -20 20 -21 24 -14C31 -12 37 -6 37 0C37 5 32 7 24 7L0 9C-4 9 -6 7 -7 3Z"
            fill="#8aa8b6"
          />
          <path d="M9 -13C12 -19 19 -20 23 -14C19 -15 14 -14 9 -13Z" fill="#607f90" opacity="0.7" />
          <path
            d="M20 4C26 4 31 3 36 1"
            fill="none"
            stroke="#607f90"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="-5" fill="#f6f1e4" r="2.6" />
          <circle cx="12.6" cy="-4.8" fill="#26312a" r="1.7" />
          <ellipse cx="24" cy="-10" fill="#4d6470" rx="2" ry="1.2" />
          <g className="ecoDinoPart ecoDinoPart--jaw" transform="rotate(0 20 5)">
            <path d="M15 4C22 6 30 5 36 1C34 7 25 10 17 8Z" fill="#b9cdd4" opacity="0.88" />
          </g>
          <g className="ecoDinoPart ecoDinoPart--cheek">
            <ellipse cx="6" cy="2" fill="#b9cdd4" opacity="0" rx="7" ry="5.5" />
          </g>
        </g>
        <g className="ecoDinoPart ecoDinoPart--gulpLump">
          <ellipse cx="204" cy="36" fill="#d7e8b0" opacity="0" rx="9" ry="7" />
        </g>
      </svg>
    </span>
  )
}

function QuetzalcoatlusRig({ asset }: { asset: string }): ReactElement {
  const flight = asset.includes('flight')

  if (flight) {
    return (
      <span aria-hidden="true" className="ecoDinoRig ecoDinoRig--quetzFlight">
        <svg
          className="ecoDinoSvg"
          height="160"
          viewBox="0 0 380 160"
          width="380"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="190" cy="151" fill="#000000" opacity="0.07" rx="82" ry="5" />
          <g className="ecoDinoPart ecoDinoPart--wingFar" transform="rotate(0 180 84)">
            <path
              d="M178 79C141 45 97 20 10 23C54 43 85 66 112 93C133 98 155 97 178 91Z"
              fill="#8b6b5a"
            />
            <path
              d="M19 24C76 36 124 61 177 87"
              fill="none"
              opacity="0.9"
              stroke="#6e5648"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              d="M133 51C151 62 166 75 182 89"
              fill="none"
              opacity="0.58"
              stroke="#e7c98d"
              strokeWidth="2.2"
            />
          </g>
          <g className="ecoDinoPart ecoDinoPart--wingNear" transform="rotate(0 200 84)">
            <path
              d="M202 78C244 42 289 18 370 25C326 43 297 68 268 96C246 100 224 96 202 91Z"
              fill="#9b7860"
            />
            <path
              d="M364 26C307 38 256 61 203 87"
              fill="none"
              opacity="0.9"
              stroke="#6e5648"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              d="M247 52C229 64 214 77 199 90"
              fill="none"
              opacity="0.58"
              stroke="#e7c98d"
              strokeWidth="2.2"
            />
          </g>
          <g className="ecoDinoPart ecoDinoPart--body" transform="rotate(0 188 91)">
            <path
              d="M173 82C183 73 201 73 212 82C213 94 204 104 188 104C175 103 169 94 173 82Z"
              fill="#ead9aa"
            />
            <path
              d="M182 101Q173 118 164 132M198 102Q207 119 218 132"
              fill="none"
              stroke="#d0b47b"
              strokeLinecap="round"
              strokeWidth="4"
            />
          </g>
          <g className="ecoDinoPart ecoDinoPart--neck" transform="rotate(0 197 82)">
            <path d="M187 82C190 57 196 36 210 18C215 44 213 64 204 84Z" fill="#ead9aa" />
          </g>
          <g className="ecoDinoPart ecoDinoPart--head" transform="rotate(0 210 30)">
            <path d="M206 18C221 8 243 11 260 24C239 26 220 32 206 39Z" fill="#ead9aa" />
            <path d="M215 13C224 4 238 5 245 17C233 15 224 17 215 23Z" fill="#bd4f3d" />
            <circle cx="226" cy="24" fill="#fff7df" r="2.8" />
            <circle cx="227" cy="24.4" fill="#26312a" r="1.5" />
            <g className="ecoDinoPart ecoDinoPart--jaw" transform="rotate(0 236 28)">
              <path d="M236 23L322 35L236 40Z" fill="#f0dda6" />
              <path d="M264 29L322 35L265 39Z" fill="#6e5648" opacity="0.76" />
            </g>
          </g>
        </svg>
      </span>
    )
  }

  return (
    <span aria-hidden="true" className="ecoDinoRig ecoDinoRig--quetzGround">
      <svg
        className="ecoDinoSvg"
        height="230"
        viewBox="0 0 250 230"
        width="250"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="120" cy="219" fill="#000000" opacity="0.1" rx="78" ry="7" />
        <g className="ecoDinoPart ecoDinoPart--wingFar" transform="rotate(0 98 145)">
          <path
            d="M100 138C75 158 54 181 40 211"
            fill="none"
            stroke="#d0b47b"
            strokeLinecap="round"
            strokeWidth="13"
          />
          <path d="M75 172C60 160 45 146 28 128C59 133 84 145 102 164Z" fill="#80665a" />
          <path
            d="M40 211L27 214M40 211L52 221"
            stroke="#6a5a52"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--body" transform="rotate(0 118 150)">
          <path
            d="M88 132C101 118 132 116 151 130C162 145 154 166 130 172C105 177 83 160 88 132Z"
            fill="#ead9aa"
          />
          <path
            d="M101 162C118 174 145 169 154 147C154 166 136 179 111 176C99 174 91 168 88 159Z"
            fill="#cbb987"
            opacity="0.72"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--legFar" transform="rotate(0 132 164)">
          <path d="M132 164L120 213" stroke="#d0b47b" strokeLinecap="round" strokeWidth="9" />
          <path
            d="M120 213L105 217M120 213L132 222"
            stroke="#8b714f"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--legNear" transform="rotate(0 147 160)">
          <path d="M147 160L155 213" stroke="#d0b47b" strokeLinecap="round" strokeWidth="9" />
          <path
            d="M155 213L141 218M155 213L168 221"
            stroke="#8b714f"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--wingNear" transform="rotate(0 110 145)">
          <path
            d="M111 143C85 160 67 182 59 211"
            fill="none"
            stroke="#6a5a52"
            strokeLinecap="round"
            strokeWidth="11"
          />
          <path
            d="M59 211L45 217M59 211L72 220"
            stroke="#6a5a52"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--neck" transform="rotate(0 120 130)">
          <path d="M113 131C111 99 111 68 123 42C132 72 132 101 126 133Z" fill="#ead9aa" />
          <path
            d="M121 128C120 101 121 75 129 52"
            fill="none"
            opacity="0.58"
            stroke="#cbb987"
            strokeLinecap="round"
            strokeWidth="5"
          />
        </g>
        <g className="ecoDinoPart ecoDinoPart--head" transform="rotate(0 126 50)">
          <path d="M121 44C133 28 157 26 181 36C163 45 143 51 126 58Z" fill="#ead9aa" />
          <path d="M134 31C143 17 158 16 166 29C154 27 143 30 134 38Z" fill="#bd4f3d" />
          <circle cx="144" cy="39" fill="#fff7df" r="3" />
          <circle cx="145" cy="39.4" fill="#26312a" r="1.7" />
          <path
            d="M126 58C137 61 150 60 164 56"
            fill="none"
            opacity="0.7"
            stroke="#cbb987"
            strokeLinecap="round"
            strokeWidth="2.6"
          />
          <g className="ecoDinoPart ecoDinoPart--jaw" transform="rotate(0 151 49)">
            <path d="M151 39L239 54L152 58Z" fill="#f0dda6" />
            <path d="M176 46L239 54L178 56Z" fill="#6e5648" opacity="0.78" />
          </g>
        </g>
      </svg>
    </span>
  )
}

export function DinoRig({
  asset,
  species,
}: {
  asset: string
  species: string
}): ReactElement | null {
  if (species === 'brachiosaurus') {
    return <BrachiosaurusRig />
  }

  if (species === 'quetzalcoatlus') {
    return <QuetzalcoatlusRig asset={asset} />
  }

  const html = dinoRigHtml[asset] ?? dinoRigHtml[fallbackBySpecies[species]]

  if (!html) {
    return null
  }

  return <span aria-hidden="true" className="ecoDinoRig" dangerouslySetInnerHTML={html} />
}
