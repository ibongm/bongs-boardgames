import { useMemo, useState } from 'react';
import { HEXES, INTERSECTIONS, PATHS, TRADING_POST_SLOTS, BOARD_BOUNDS } from '../board.js';
import { NUMBER_PIPS, TERRAIN_TO_RESOURCE } from '../maps/balanced.js';
import { canBuildRoad, canBuildSettlement, canBuildCity } from '../build.js';

const TERRAIN_STYLES = {
  forest: { fill: '#365314', stroke: '#4d7c0f', label: 'Forest', icon: '🌲' },
  hills: { fill: '#9a3412', stroke: '#c2410c', label: 'Hills', icon: '🧱' },
  pasture: { fill: '#4d7c0f', stroke: '#65a30d', label: 'Pasture', icon: '🐑' },
  fields: { fill: '#b45309', stroke: '#d97706', label: 'Fields', icon: '🌾' },
  mountains: { fill: '#334155', stroke: '#475569', label: 'Mountains', icon: '⛰️' },
  desert: { fill: '#d6d3d1', stroke: '#a8a29e', label: 'Desert', icon: '🏜️' },
};

export default function HexBoard({
  state,
  canPlay = false,
  viewerSeat = 0,
  selectedElement = null,
  onSelectPath = () => {},
  onSelectIntersection = () => {},
  onSelectBanditHex = () => {},
  interactive = true,
}) {
  const [zoom, setZoom] = useState(1);
  if (!state) return null;

  const isBanditPhase = state.phase === 'bandit' && state.turn === viewerSeat;
  const isSetup = state.phase === 'setup' && state.turn === viewerSeat;
  const isMain = state.phase === 'main' && state.turn === viewerSeat;

  const hexList = useMemo(() => {
    return (state.hexes || []).map((h) => ({
      ...h,
      geom: HEXES[h.id],
    }));
  }, [state.hexes]);

  return (
    <div className="relative w-full max-w-[min(100%,calc(100vh-160px))] overflow-hidden rounded-3xl border border-gold/30 bg-[#ded3be] shadow-inner flex flex-col items-center">
      {/* Zoom controls */}
      {interactive && (
        <div className="absolute top-3 right-3 z-20 flex gap-1 paper-card p-1 rounded-xl border border-gold/30 shadow-table">
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-ink hover:bg-gold/20"
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-ink hover:bg-gold/20"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="px-2 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-ink/70 hover:bg-gold/20"
            onClick={() => setZoom(1)}
            title="Reset zoom"
          >
            100%
          </button>
        </div>
      )}

      {/* SVG Board */}
      <div className="w-full max-w-2xl aspect-square flex items-center justify-center p-2">
        <svg
          viewBox="-290 -280 580 560"
          className="w-full h-full select-none transition-transform duration-150 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            {/* Water backdrop gradient */}
            <radialGradient id="waterGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ded3be" />
              <stop offset="100%" stopColor="#cdbf9f" />
            </radialGradient>
            {/* Drop shadow filter for pieces */}
            <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Ocean backdrop */}
          <circle cx="0" cy="0" r="275" fill="url(#waterGrad)" />
          <circle cx="0" cy="0" r="275" fill="none" stroke="#bdae8d" strokeWidth="2" strokeDasharray="6 6" />

          {/* 9 Coastal Trading Posts */}
          {TRADING_POST_SLOTS.map((slot) => {
            const postSpec = (state.tradingPosts || []).find((p) => p.postId === slot.id);
            const pA = INTERSECTIONS[slot.intIds[0]];
            const pB = INTERSECTIONS[slot.intIds[1]];
            if (!pA || !pB) return null;

            return (
              <g key={slot.id} className="opacity-90">
                {/* Pier lines connecting coast vertices to post icon */}
                <line x1={pA.x} y1={pA.y} x2={slot.labelX} y2={slot.labelY} stroke="#78350f" strokeWidth="2.5" strokeDasharray="3 3" />
                <line x1={pB.x} y1={pB.y} x2={slot.labelX} y2={slot.labelY} stroke="#78350f" strokeWidth="2.5" strokeDasharray="3 3" />
                {/* Pier anchor node */}
                <circle cx={slot.labelX} cy={slot.labelY} r="16" fill="#fef3c7" stroke="#78350f" strokeWidth="2" filter="url(#pieceShadow)" />
                <text
                  x={slot.labelX}
                  y={slot.labelY + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill="#78350f"
                >
                  {postSpec?.type === 'special' ? postSpec.resource.slice(0, 3).toUpperCase() : '3:1'}
                </text>
              </g>
            );
          })}

          {/* 19 Land Hexes */}
          {hexList.map((h) => {
            const style = TERRAIN_STYLES[h.terrain] || TERRAIN_STYLES.desert;
            const isBandit = state.banditHexId === h.id;
            const pips = h.number ? NUMBER_PIPS[h.number] || 0 : 0;
            const isRedNumber = h.number === 6 || h.number === 8;
            const canRelocateBandit = interactive && canPlay && isBanditPhase && !isBandit;

            return (
              <g
                key={h.id}
                className={canRelocateBandit ? 'cursor-pointer' : ''}
                onClick={() => {
                  if (canRelocateBandit) onSelectBanditHex(h.id);
                }}
              >
                {/* Hex polygon */}
                <polygon
                  points={h.geom.points}
                  fill={style.fill}
                  stroke={canRelocateBandit ? '#f59e0b' : '#fef08a'}
                  strokeWidth={canRelocateBandit ? '3' : '1.5'}
                  className="transition-all hover:brightness-110"
                />

                {/* Hex terrain label */}
                <text
                  x={h.geom.cx}
                  y={h.geom.cy - 22}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#ffffff"
                  opacity="0.85"
                  pointerEvents="none"
                >
                  {style.label}
                </text>

                {/* Number Token (if not desert) */}
                {h.number && !isBandit && (
                  <g pointerEvents="none">
                    <circle
                      cx={h.geom.cx}
                      cy={h.geom.cy + 4}
                      r="17"
                      fill="#fffbeb"
                      stroke="#d97706"
                      strokeWidth="1.5"
                      filter="url(#pieceShadow)"
                    />
                    <circle cx={h.geom.cx} cy={h.geom.cy + 4} r="14" fill="none" stroke="#fde68a" strokeWidth="0.8" />
                    <text
                      x={h.geom.cx}
                      y={h.geom.cy + 9}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="900"
                      fill={isRedNumber ? '#b91c1c' : '#1c1917'}
                    >
                      {h.number}
                    </text>
                    {/* Pip dots */}
                    <g transform={`translate(${h.geom.cx}, ${h.geom.cy + 15})`}>
                      {Array.from({ length: pips }, (_, i) => {
                        const offset = (i - (pips - 1) / 2) * 4;
                        return (
                          <circle
                            key={i}
                            cx={offset}
                            cy="0"
                            r="1.2"
                            fill={isRedNumber ? '#b91c1c' : '#1c1917'}
                          />
                        );
                      })}
                    </g>
                  </g>
                )}

                {/* Bandit Piece */}
                {isBandit && (
                  <g pointerEvents="none" filter="url(#pieceShadow)">
                    <circle cx={h.geom.cx} cy={h.geom.cy + 4} r="16" fill="#18181b" stroke="#f43f5e" strokeWidth="2.5" />
                    <text
                      x={h.geom.cx}
                      y={h.geom.cy + 8}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      BANDIT
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 72 Paths (Roads) */}
          {Object.values(PATHS).map((path) => {
            const pA = INTERSECTIONS[path.intA];
            const pB = INTERSECTIONS[path.intB];
            if (!pA || !pB) return null;

            const road = state.paths?.[path.id];
            const player = road && state.players ? state.players[road.seat] : null;
            const isRoadLegal = interactive && canPlay && isMain && canBuildRoad(state, viewerSeat, path.id, state.freeRoads > 0);
            const isSelected = selectedElement?.id === path.id;

            return (
              <g key={path.id}>
                {/* Built Road piece */}
                {road && player && (
                  <g filter="url(#pieceShadow)">
                    <line
                      x1={pA.x}
                      y1={pA.y}
                      x2={pB.x}
                      y2={pB.y}
                      stroke={player.color}
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    <line
                      x1={pA.x}
                      y1={pA.y}
                      x2={pB.x}
                      y2={pB.y}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    {/* Piece color-blind symbol at midpoint */}
                    <circle cx={path.mx} cy={path.my} r="5" fill={player.color} stroke="#ffffff" strokeWidth="1" />
                    <text
                      x={path.mx}
                      y={path.my + 3}
                      textAnchor="middle"
                      fontSize="6"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {player.symbol}
                    </text>
                  </g>
                )}

                {/* Empty path guideline */}
                {!road && (
                  <line
                    x1={pA.x}
                    y1={pA.y}
                    x2={pB.x}
                    y2={pB.y}
                    stroke={isSelected ? '#d97706' : '#d4c5a9'}
                    strokeWidth={isSelected ? '4' : '1'}
                    strokeDasharray={isSelected ? 'none' : '3 3'}
                  />
                )}

                {/* Interactive Click Target (minimum 44px touch area) */}
                {interactive && !road && (
                  <line
                    x1={pA.x}
                    y1={pA.y}
                    x2={pB.x}
                    y2={pB.y}
                    stroke="transparent"
                    strokeWidth="32"
                    strokeLinecap="round"
                    className="cursor-pointer hover:stroke-amber-400/50 transition-colors"
                    onClick={() => {
                      onSelectPath({
                        type: 'path',
                        id: path.id,
                        legal: isRoadLegal,
                      });
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* 54 Intersections (Settlements / Cities) */}
          {Object.values(INTERSECTIONS).map((intObj) => {
            const building = state.intersections?.[intObj.id];
            const player = building && state.players ? state.players[building.seat] : null;
            const isSettlementLegal = interactive && canPlay && isMain && canBuildSettlement(state, viewerSeat, intObj.id, false);
            const isCityLegal = interactive && canPlay && isMain && canBuildCity(state, viewerSeat, intObj.id);
            const isSetupLegal = interactive && canPlay && isSetup && canBuildSettlement(state, viewerSeat, intObj.id, true);
            const isSelected = selectedElement?.id === intObj.id;

            return (
              <g key={intObj.id}>
                {/* Built settlement or city */}
                {building && player && (
                  <g filter="url(#pieceShadow)">
                    {building.type === 'city' ? (
                      // City: Fortress Shape
                      <g transform={`translate(${intObj.x}, ${intObj.y})`}>
                        <polygon
                          points="-12,8 12,8 12,-4 8,-4 8,-10 4,-10 4,-4 -4,-4 -4,-10 -8,-10 -8,-4 -12,-4"
                          fill={player.color}
                          stroke="#ffffff"
                          strokeWidth="1.8"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#ffffff"
                        >
                          {player.symbol}
                        </text>
                      </g>
                    ) : (
                      // Settlement: House Shape
                      <g transform={`translate(${intObj.x}, ${intObj.y})`}>
                        <polygon
                          points="-8,7 8,7 8,-2 0,-9 -8,-2"
                          fill={player.color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="bold"
                          fill="#ffffff"
                        >
                          {player.symbol}
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Empty node indicator */}
                {!building && (
                  <circle
                    cx={intObj.x}
                    cy={intObj.y}
                    r={isSelected ? 6 : 2.5}
                    fill={isSelected ? '#d97706' : '#a8a29e'}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth="1"
                    opacity={isSelected ? 1 : 0.6}
                  />
                )}

                {/* Interactive Click Target (minimum 44px touch area) */}
                {interactive && (
                  <circle
                    cx={intObj.x}
                    cy={intObj.y}
                    r="22"
                    fill="transparent"
                    className="cursor-pointer hover:fill-amber-400/30 transition-colors"
                    onClick={() => {
                      if (!building) {
                        onSelectIntersection({
                          type: 'intersection',
                          id: intObj.id,
                          legal: isSetup ? isSetupLegal : isSettlementLegal,
                          isCityUpgrade: false,
                        });
                      } else if (building.seat === viewerSeat && building.type === 'settlement') {
                        onSelectIntersection({
                          type: 'intersection',
                          id: intObj.id,
                          legal: isCityLegal,
                          isCityUpgrade: true,
                        });
                      }
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
