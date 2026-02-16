import type { ApiGame } from '../types'
import { formatLocalTime } from '../utils/time'
import { displayName } from '../utils/teams'

interface GameCardProps {
  game: ApiGame
  compact?: boolean
}

export function GameCard({ game, compact }: GameCardProps) {
  const localTime = formatLocalTime(game.utcDate, game.localTimeZone)
  const home = game.local.club
  const away = game.road.club

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-ng-card px-3 py-2">
        <span className="w-12 shrink-0 text-sm font-bold text-el-orange">{localTime}</span>
        <div className="flex flex-1 items-center text-sm">
          <div className="flex flex-1 justify-end">
            <TeamBadge code={displayName(home.editorialName)} crest={home.images.crest} />
          </div>
          <div className="w-12 shrink-0 text-center">
            {game.played ? (
              <span className="font-bold">
                {game.local.score}-{game.road.score}
              </span>
            ) : (
              <span className="text-slate-400">vs</span>
            )}
          </div>
          <div className="flex flex-1 justify-start">
            <TeamBadge code={displayName(away.editorialName)} crest={away.images.crest} />
          </div>
        </div>
        <span className="shrink-0 text-xs text-slate-500">{game.group.name}</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ng-border bg-ng-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {game.group.name} · {game.roundName}
        </span>
        <span className="text-xs text-slate-500">{game.venue.name}</span>
      </div>
      <div className="flex items-center">
        <div className="flex w-1/3 flex-col items-center gap-1">
          <img src={home.images.crest} alt="" className="crest-img h-10 w-10" />
          <span className="max-w-full truncate text-center text-xs font-medium">{displayName(home.editorialName)}</span>
        </div>
        <div className="w-1/3 text-center">
          {game.played ? (
            <div className="text-2xl font-bold">
              {game.local.score} - {game.road.score}
            </div>
          ) : (
            <div className="text-2xl font-bold text-el-orange">{localTime}</div>
          )}
          <div className="text-xs text-slate-400">Local Time (UTC+{game.localTimeZone})</div>
        </div>
        <div className="flex w-1/3 flex-col items-center gap-1">
          <img src={away.images.crest} alt="" className="crest-img h-10 w-10" />
          <span className="max-w-full truncate text-center text-xs font-medium">{displayName(away.editorialName)}</span>
        </div>
      </div>
      {game.played && (
        <div className="mt-2 text-center text-xs text-slate-500">
          Q1: {game.local.partials.partials1}-{game.road.partials.partials1} · Q2:{' '}
          {game.local.partials.partials2}-{game.road.partials.partials2} · Q3:{' '}
          {game.local.partials.partials3}-{game.road.partials.partials3} · Q4:{' '}
          {game.local.partials.partials4}-{game.road.partials.partials4}
        </div>
      )}
    </div>
  )
}

function TeamBadge({ code, crest }: { code: string; crest: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <img src={crest} alt="" className="crest-img h-5 w-5" />
      <span className="font-medium">{code}</span>
    </div>
  )
}
