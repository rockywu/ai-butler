<script lang="ts" setup>
defineOptions({ name: 'SmartIcons' });
</script>

<template>
  <svg
    class="smart-icon-defs absolute h-0 w-0 overflow-hidden"
    aria-hidden="true"
    width="0"
    height="0"
  >
    <defs>
      <linearGradient id="si-blue" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#74ECFF" />
        <stop offset=".5" stop-color="#4D91FF" />
        <stop offset="1" stop-color="#6554E9" />
      </linearGradient>
      <linearGradient id="si-purple" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#E09BFF" />
        <stop offset=".48" stop-color="#8D63FF" />
        <stop offset="1" stop-color="#4F64EE" />
      </linearGradient>
      <linearGradient id="si-mint" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#83F4CF" />
        <stop offset=".52" stop-color="#34C8D8" />
        <stop offset="1" stop-color="#4E72F4" />
      </linearGradient>
      <linearGradient id="si-warm" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#FFE276" />
        <stop offset=".5" stop-color="#FF8F71" />
        <stop offset="1" stop-color="#AF62F2" />
      </linearGradient>
      <linearGradient id="si-glass" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#FFFFFF" stop-opacity=".95" />
        <stop offset="1" stop-color="#DCEBFF" stop-opacity=".7" />
      </linearGradient>
      <filter id="si-shadow" x="-45%" y="-45%" width="190%" height="200%">
        <feDropShadow
          dx="0"
          dy="5"
          stdDeviation="4"
          flood-color="#4065C7"
          flood-opacity=".23"
        />
      </filter>
    </defs>

    <symbol id="si-account" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <path d="M10 48 31 58l23-11-22-9Z" fill="#CFE8FF" />
        <path d="m14 42 18 9 18-9-18-9Z" fill="url(#si-blue)" />
        <circle cx="32" cy="20" r="10" fill="url(#si-purple)" />
        <path
          d="M18 40c2-9 8-13 14-13s12 4 14 13l-14 7Z"
          fill="url(#si-mint)"
        />
        <path
          d="M11 28c-4 3-4 9 0 12M53 28c4 3 4 9 0 12"
          fill="none"
          stroke="#52CFE5"
          stroke-width="3"
          stroke-linecap="round"
        />
        <circle cx="10" cy="25" r="3" fill="#20CE91" />
        <circle cx="54" cy="25" r="3" fill="#4B82FF" />
      </g>
    </symbol>
    <symbol id="si-reply" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <rect
          x="9"
          y="17"
          width="35"
          height="27"
          rx="9"
          fill="url(#si-purple)"
          transform="rotate(-7 9 17)"
        />
        <path d="m16 39-3 10 11-7" fill="#8A65F8" />
        <rect
          x="23"
          y="12"
          width="34"
          height="28"
          rx="9"
          fill="url(#si-blue)"
        />
        <path d="m48 37 5 9-12-7" fill="#586EF1" />
        <circle cx="33" cy="26" r="2.5" fill="#fff" />
        <circle cx="40" cy="26" r="2.5" fill="#fff" />
        <circle cx="47" cy="26" r="2.5" fill="#fff" />
        <circle cx="14" cy="14" r="5" fill="#FFF6CB" />
        <path
          d="m12 14 1.5 1.7L17 12"
          fill="none"
          stroke="#F2B73C"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </symbol>
    <symbol id="si-keyword" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <path d="M7 20h21v27H7z" fill="#DDF2FF" />
        <rect
          x="22"
          y="11"
          width="35"
          height="37"
          rx="7"
          fill="url(#si-blue)"
        />
        <rect
          x="27"
          y="17"
          width="25"
          height="19"
          rx="4"
          fill="url(#si-glass)"
        />
        <circle
          cx="41"
          cy="28"
          r="6"
          fill="none"
          stroke="#5177F4"
          stroke-width="3"
        />
        <path
          d="m45 33 6 6"
          stroke="#5177F4"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          d="M28 41h16"
          stroke="#BBD4FF"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          d="m13 25 5-5 5 5"
          fill="none"
          stroke="#FFC247"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </symbol>
    <symbol id="si-process" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <ellipse cx="34" cy="49" rx="23" ry="7" fill="#DDF7FF" />
        <rect
          x="15"
          y="10"
          width="36"
          height="31"
          rx="8"
          fill="url(#si-blue)"
        />
        <rect
          x="20"
          y="16"
          width="26"
          height="15"
          rx="4"
          fill="url(#si-glass)"
        />
        <path
          d="M24 22h12M24 26h8"
          stroke="#6394F4"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <circle cx="48" cy="42" r="9" fill="url(#si-mint)" />
        <path
          d="M48 36v12M42 42h12"
          stroke="#fff"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <circle cx="12" cy="20" r="4" fill="#75E3C4" />
        <circle cx="55" cy="14" r="3" fill="#9875FF" />
      </g>
    </symbol>
    <symbol id="si-competitor" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <rect x="8" y="13" width="31" height="39" rx="7" fill="url(#si-blue)" />
        <rect
          x="25"
          y="9"
          width="31"
          height="39"
          rx="7"
          fill="url(#si-glass)"
          stroke="#BFD8FF"
        />
        <circle cx="40" cy="22" r="6" fill="url(#si-purple)" />
        <path d="M31 36c1-6 5-9 9-9s8 3 9 9" fill="url(#si-mint)" />
        <path
          d="M31 41h18"
          stroke="#94B9FA"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path
          d="M14 22h10M14 28h7M14 42h14"
          stroke="#fff"
          stroke-opacity=".8"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </g>
    </symbol>
    <symbol id="si-video" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <path d="m13 49 25 6 15-9-25-6Z" fill="#CFE9FF" />
        <rect
          x="13"
          y="12"
          width="39"
          height="34"
          rx="8"
          fill="url(#si-blue)"
        />
        <rect
          x="19"
          y="18"
          width="27"
          height="20"
          rx="5"
          fill="#EAF7FF"
          fill-opacity=".88"
        />
        <path d="m30 23 10 5-10 6Z" fill="#4D7EF6" />
        <path
          d="M20 42h19"
          stroke="#BDE7FF"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </g>
    </symbol>
    <symbol id="si-searchlead" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <path
          d="M10 44c0-7 5-12 12-12h26c6 0 10 4 10 10s-4 10-10 10H20c-6 0-10-3-10-8Z"
          fill="#DDF3FF"
        />
        <path d="M18 15h29l7 8-5 24H16l-5-24Z" fill="url(#si-blue)" />
        <path d="m29 24 12 7-12 7Z" fill="#fff" />
        <circle cx="51" cy="16" r="6" fill="url(#si-mint)" />
        <path
          d="m54 20 5 5"
          stroke="#3E9ACF"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </g>
    </symbol>
    <symbol id="si-live" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <rect
          x="9"
          y="17"
          width="34"
          height="31"
          rx="8"
          fill="url(#si-purple)"
        />
        <path
          d="M17 28v8M23 24v16M29 29v6M35 22v20"
          stroke="#fff"
          stroke-opacity=".9"
          stroke-width="3"
          stroke-linecap="round"
        />
        <circle cx="48" cy="37" r="10" fill="url(#si-blue)" />
        <circle cx="48" cy="37" r="4" fill="#fff" />
        <path
          d="M53 27c5 3 7 7 7 12"
          fill="none"
          stroke="#7EE0E8"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </g>
    </symbol>
    <symbol id="si-fan" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <path d="M10 49h44l-5 6H15Z" fill="#79A9FF" />
        <circle cx="31" cy="23" r="10" fill="url(#si-purple)" />
        <path d="M15 48c2-11 8-17 16-17s14 6 17 17Z" fill="url(#si-blue)" />
        <path d="m49 21 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#79F0D0" />
        <circle cx="14" cy="18" r="4" fill="#FFD66E" />
      </g>
    </symbol>
    <symbol id="si-tasks" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <circle cx="34" cy="34" r="25" fill="#E5F4FF" />
        <rect
          x="18"
          y="11"
          width="31"
          height="42"
          rx="7"
          fill="url(#si-blue)"
        />
        <rect x="24" y="18" width="7" height="7" rx="2" fill="#fff" />
        <path
          d="m25 21 2 2 4-5"
          fill="none"
          stroke="#4E77EC"
          stroke-width="1.8"
        />
        <path
          d="M35 21h9M35 32h9M35 43h9"
          stroke="#fff"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <rect x="24" y="29" width="7" height="7" rx="2" fill="#B6E9FF" />
        <rect x="24" y="40" width="7" height="7" rx="2" fill="#B6E9FF" />
      </g>
    </symbol>
    <symbol id="si-interact" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <circle cx="32" cy="33" r="24" fill="#E7F4FF" />
        <path
          d="M17 31a16 16 0 0 1 25-11"
          fill="none"
          stroke="url(#si-blue)"
          stroke-width="7"
          stroke-linecap="round"
        />
        <path d="m39 14 8 6-9 4" fill="url(#si-purple)" />
        <path
          d="M47 35a16 16 0 0 1-25 11"
          fill="none"
          stroke="url(#si-purple)"
          stroke-width="7"
          stroke-linecap="round"
        />
        <path d="m25 52-8-6 9-4" fill="url(#si-blue)" />
        <path
          d="M32 27v12M26 33h12"
          stroke="#fff"
          stroke-width="3"
          stroke-linecap="round"
        />
      </g>
    </symbol>
    <symbol id="si-comments" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <rect
          x="10"
          y="10"
          width="30"
          height="39"
          rx="7"
          fill="url(#si-glass)"
          stroke="#C2D8FF"
        />
        <path
          d="M17 20h16M17 27h13M17 34h16"
          stroke="#79A4F8"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <rect
          x="27"
          y="25"
          width="28"
          height="31"
          rx="7"
          fill="url(#si-blue)"
        />
        <path
          d="M35 35h13M35 41h10"
          stroke="#fff"
          stroke-opacity=".85"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path d="m47 52 6 6-1-9" fill="#5E65E8" />
      </g>
    </symbol>
    <symbol id="si-livecomments" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <rect
          x="8"
          y="14"
          width="47"
          height="36"
          rx="9"
          fill="url(#si-purple)"
        />
        <path d="m43 48 8 8-1-11" fill="#6755E5" />
        <circle cx="20" cy="27" r="5" fill="url(#si-mint)" />
        <path
          d="M29 24h17M29 30h13M16 40h29"
          stroke="#fff"
          stroke-opacity=".9"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <circle cx="53" cy="15" r="6" fill="#FF738F" />
        <circle cx="53" cy="15" r="2" fill="#fff" />
      </g>
    </symbol>
    <symbol id="si-fanlist" viewBox="0 0 64 64">
      <g filter="url(#si-shadow)">
        <rect
          x="8"
          y="11"
          width="48"
          height="43"
          rx="9"
          fill="url(#si-glass)"
          stroke="#C4D9FF"
        />
        <circle cx="22" cy="26" r="7" fill="url(#si-purple)" />
        <path d="M12 43c1-7 5-11 10-11s9 4 10 11" fill="url(#si-blue)" />
        <path
          d="M36 22h13M36 29h10M36 39h13M36 46h8"
          stroke="#6E9AF1"
          stroke-width="2.8"
          stroke-linecap="round"
        />
        <circle cx="53" cy="47" r="7" fill="url(#si-mint)" />
        <path
          d="M53 43v8M49 47h8"
          stroke="#fff"
          stroke-width="2"
          stroke-linecap="round"
        />
      </g>
    </symbol>
  </svg>
</template>
