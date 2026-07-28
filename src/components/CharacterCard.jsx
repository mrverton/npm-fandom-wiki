import { useNavigate } from 'react-router-dom'
import { getTheme } from '../utils/theme'
import StatusBadge from './StatusBadge'

const glitchStyles = `
  @keyframes glitch-skew {
    0%   { transform: skewX(0deg); }
    10%  { transform: skewX(-4deg); }
    15%  { transform: skewX(3deg); }
    20%  { transform: skewX(0deg); }
    80%  { transform: skewX(0deg); }
    85%  { transform: skewX(2deg); }
    90%  { transform: skewX(-3deg); }
    100% { transform: skewX(0deg); }
  }
  @keyframes glitch-clip-1 {
    0%   { clip-path: inset(40% 0 50% 0); transform: translate(-4px, 0); opacity: 0; }
    10%  { clip-path: inset(10% 0 70% 0); transform: translate(4px, 0);  opacity: 1; }
    20%  { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 0); opacity: 1; }
    30%  { clip-path: inset(80% 0 5%  0); transform: translate(3px, 0);  opacity: 0; }
    100% { clip-path: inset(40% 0 50% 0); transform: translate(0, 0);    opacity: 0; }
  }
  @keyframes glitch-clip-2 {
    0%   { clip-path: inset(60% 0 10% 0); transform: translate(4px, 0);  opacity: 0; }
    15%  { clip-path: inset(20% 0 60% 0); transform: translate(-4px, 0); opacity: 1; }
    25%  { clip-path: inset(5%  0 80% 0); transform: translate(2px, 0);  opacity: 1; }
    35%  { clip-path: inset(70% 0 15% 0); transform: translate(-3px, 0); opacity: 0; }
    100% { clip-path: inset(60% 0 10% 0); transform: translate(0, 0);    opacity: 0; }
  }
  @keyframes glitch-border {
    0%, 100% { border-color: rgba(154,163,173,0.3); }
    10%       { border-color: rgba(47,214,255,0.7);  }
    11%       { border-color: rgba(180,83,255,0.7);  }
    12%       { border-color: rgba(154,163,173,0.3); }
    80%       { border-color: rgba(154,163,173,0.3); }
    81%       { border-color: rgba(57,255,138,0.6);  }
    82%       { border-color: rgba(154,163,173,0.3); }
  }
  .glitch-card:hover .glitch-main {
    animation: glitch-skew 2.5s infinite linear;
  }
  .glitch-card:hover {
    animation: glitch-border 2.5s infinite;
  }
  .glitch-layer {
    position: absolute; inset: 0;
    border-radius: inherit;
    display: flex; align-items: center; padding: 1rem;
    pointer-events: none; opacity: 0;
    overflow: hidden;
  }
  .glitch-card:hover .glitch-layer-1 {
    animation: glitch-clip-1 2.5s infinite;
    background: rgba(47,214,255,0.06);
    color: #2fd6ff;
  }
  .glitch-card:hover .glitch-layer-2 {
    animation: glitch-clip-2 2.5s infinite;
    background: rgba(180,83,255,0.06);
    color: #b453ff;
  }
  @keyframes scanline {
    0%   { top: -10%; }
    100% { top: 110%; }
  }
  .glitch-card:hover .glitch-scanline {
    opacity: 1;
    animation: scanline 1.8s linear infinite;
  }
  .glitch-scanline {
    position: absolute; left: 0; right: 0; height: 2px;
    background: rgba(154,163,173,0.15);
    pointer-events: none; opacity: 0;
    z-index: 10;
  }
`

export default function CharacterCard({ character, index = 0 }) {
  const navigate = useNavigate()
  const theme = getTheme(character.color)
  const isTerton = character.id === 'terton'

  return (
    <>
      {isTerton && (
        <style dangerouslySetInnerHTML={{ __html: glitchStyles }} />
      )}
      <div
        style={{ animationDelay: `${index * 60}ms`, isolation: 'isolate' }}
        className={`animate-fade-up ${isTerton ? 'glitch-card' : ''}`}
      >
        <button
          onClick={() => navigate(`/characters/${character.slug}`)}
          className="group relative w-full text-left panel panel-hover overflow-hidden p-4 active:scale-[0.98] transition-all"
        >
          {isTerton && (
            <>
              <div className="glitch-scanline" />
              <div className="glitch-layer glitch-layer-1">
                <div className="flex items-center gap-3.5 w-full">
                  <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-terton/10 border border-terton/30">
                    <span className="font-display font-bold text-xl text-qzero">{character.avatarInitial}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-base truncate">{character.name}</h3>
                  </div>
                </div>
              </div>
              <div className="glitch-layer glitch-layer-2">
                <div className="flex items-center gap-3.5 w-full">
                  <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-terton/10 border border-terton/30">
                    <span className="font-display font-bold text-xl text-cortex">{character.avatarInitial}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-base truncate">{character.name}</h3>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-40 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none`} />

          <div className={`relative flex items-center gap-3.5 ${isTerton ? 'glitch-main' : ''}`}>
            <div className={`relative shrink-0 w-14 h-14 rounded-xl flex items-center justify-center border ${theme.border} ${theme.bgSoft} ${theme.shadow}`}>
              <span className={`font-display font-bold text-xl ${theme.text}`}>{character.avatarInitial}</span>
              <div className={`absolute inset-0 rounded-xl border ${theme.border} animate-pulse-slow`} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display font-semibold text-base text-slate-50 truncate">{character.name}</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{character.role}</p>
              <div className="mt-2">
                <StatusBadge status={character.status} size="sm" />
              </div>
            </div>
          </div>
        </button>
      </div>
    </>
  )
}