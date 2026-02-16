import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plane, Hotel, UtensilsCrossed, Edit, Users } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useClubs, useGames } from '../hooks/useGames'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { Modal, FormField, inputClass } from '../components/Modal'
import { GameCard } from '../components/GameCard'
import { displayName } from '../utils/teams'
import type { TeamInfo, ApiClub, ApiGame, Person } from '../types'

export function Teams() {
  const { tournament } = useTournament()
  const navigate = useNavigate()
  const { data: clubs } = useClubs(tournament.seasonCode)
  const { data: games } = useGames(tournament.seasonCode)
  const { items: teamInfos, add, update } = useSupabaseData<TeamInfo>('team_info', tournament.id)
  const { items: people } = useSupabaseData<Person>('people', tournament.id)
  const [selectedClub, setSelectedClub] = useState<ApiClub | null>(null)
  const [editingTeam, setEditingTeam] = useState<TeamInfo | null>(null)

  const getTeamInfo = (clubCode: string) =>
    teamInfos.find((t) => t.clubCode === clubCode)

  const getTeamGames = (clubCode: string): ApiGame[] =>
    games?.filter(
      (g) => g.local.club.code === clubCode || g.road.club.code === clubCode
    ) || []

  const getDelegationCount = (clubCode: string) =>
    people.filter((p) => p.clubCode === clubCode).length

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">Teams</h1>

      {/* Team list */}
      <div className="space-y-2">
        {clubs?.map((club) => {
          const info = getTeamInfo(club.code)
          return (
            <button
              key={club.code}
              onClick={() => setSelectedClub(club)}
              className="flex w-full items-center gap-3 rounded-xl border border-ng-border bg-ng-card p-3 text-left active:bg-slate-700"
            >
              <img src={club.images.crest} alt="" className="crest-img h-10 w-10" />
              <div className="flex-1">
                <div className="font-semibold">{displayName(club.editorialName)}</div>
                <div className="text-xs text-slate-400">
                  {club.country.name}
                  {info?.hotel && ` · ${info.hotel}`}
                </div>
              </div>
              {info?.arrivalDate && (
                <div className="text-right text-xs text-slate-500">
                  <Plane size={12} className="mb-0.5 inline" /> {info.arrivalDate}
                </div>
              )}
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          )
        })}
      </div>

      {/* Team detail modal */}
      {selectedClub && (
        <TeamDetail
          club={selectedClub}
          info={getTeamInfo(selectedClub.code)}
          games={getTeamGames(selectedClub.code)}
          delegationCount={getDelegationCount(selectedClub.code)}
          onClose={() => setSelectedClub(null)}
          onViewDelegation={() => {
            setSelectedClub(null)
            navigate(`/people?club=${selectedClub.code}`)
          }}
          onEdit={() => {
            const existing = getTeamInfo(selectedClub.code)
            if (existing) {
              setEditingTeam(existing)
            } else {
              setEditingTeam({
                id: '',
                tournamentId: tournament.id,
                clubCode: selectedClub.code,
                teamName: displayName(selectedClub.editorialName),
                group: '',
                arrivalDate: '',
                departureDate: '',
                hotel: '',
                flightInfo: '',
                dietaryNotes: '',
                notes: '',
              })
            }
          }}
        />
      )}

      {/* Edit team info modal */}
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={(data) => {
            if (editingTeam.id) {
              update(editingTeam.id, data)
            } else {
              add(data)
            }
            setEditingTeam(null)
          }}
        />
      )}
    </div>
  )
}

function TeamDetail({
  club,
  info,
  games,
  delegationCount,
  onClose,
  onEdit,
  onViewDelegation,
}: {
  club: ApiClub
  info: TeamInfo | undefined
  games: ApiGame[]
  delegationCount: number
  onClose: () => void
  onEdit: () => void
  onViewDelegation: () => void
}) {
  return (
    <Modal open title={displayName(club.editorialName)} onClose={onClose}>
      <div className="space-y-4">
        {/* Team header */}
        <div className="flex items-center gap-4">
          <img src={club.images.crest} alt="" className="crest-img h-16 w-16" />
          <div>
            <h3 className="text-lg font-bold">{club.name}</h3>
            <p className="text-sm text-slate-400">{club.country.name}</p>
          </div>
        </div>

        {/* Info cards */}
        {info && (
          <div className="grid grid-cols-2 gap-2">
            {info.arrivalDate && (
              <InfoBadge icon={<Plane size={14} />} label="Arrival" value={info.arrivalDate} />
            )}
            {info.departureDate && (
              <InfoBadge icon={<Plane size={14} />} label="Departure" value={info.departureDate} />
            )}
            {info.hotel && (
              <InfoBadge icon={<Hotel size={14} />} label="Hotel" value={info.hotel} />
            )}
            {info.dietaryNotes && (
              <InfoBadge icon={<UtensilsCrossed size={14} />} label="Dietary" value={info.dietaryNotes} />
            )}
          </div>
        )}

        {info?.flightInfo && (
          <div className="rounded-lg bg-ng-card p-3 text-sm text-slate-300">
            <span className="text-xs font-medium text-slate-500">Flight Info</span>
            <div className="mt-1">{info.flightInfo}</div>
          </div>
        )}

        {info?.notes && (
          <div className="rounded-lg bg-ng-card p-3 text-sm text-slate-300">
            <span className="text-xs font-medium text-slate-500">Notes</span>
            <div className="mt-1">{info.notes}</div>
          </div>
        )}

        {/* Games */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-300">Schedule</h4>
          <div className="space-y-2">
            {games.map((g: any) => (
              <GameCard key={g.id} game={g} compact />
            ))}
          </div>
          {games.length === 0 && (
            <p className="text-sm text-slate-500">No games scheduled yet</p>
          )}
        </div>

        {/* Delegation link */}
        <button
          onClick={onViewDelegation}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-ng-border bg-ng-card py-2.5 text-sm font-medium text-slate-200 active:bg-slate-700"
        >
          <Users size={16} />
          Delegation ({delegationCount} people)
        </button>

        <button
          onClick={onEdit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
        >
          <Edit size={16} />
          {info ? 'Edit Info' : 'Add Info'}
        </button>
      </div>
    </Modal>
  )
}

function InfoBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ng-card p-2">
      <div className="flex items-center gap-1 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  )
}

function EditTeamModal({
  team,
  onClose,
  onSave,
}: {
  team: TeamInfo
  onClose: () => void
  onSave: (data: Omit<TeamInfo, 'id'>) => void
}) {
  const [form, setForm] = useState(team)
  const set = (field: keyof TeamInfo, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <Modal open title={`${team.teamName} — Info`} onClose={onClose}>
      <FormField label="Arrival Date">
        <input type="date" value={form.arrivalDate} onChange={(e) => set('arrivalDate', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Departure Date">
        <input type="date" value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Hotel">
        <input value={form.hotel} onChange={(e) => set('hotel', e.target.value)} placeholder="Hotel name" className={inputClass} />
      </FormField>
      <FormField label="Flight Info">
        <input value={form.flightInfo} onChange={(e) => set('flightInfo', e.target.value)} placeholder="EK101 arriving 14:30..." className={inputClass} />
      </FormField>
      <FormField label="Dietary Notes">
        <input value={form.dietaryNotes} onChange={(e) => set('dietaryNotes', e.target.value)} placeholder="Halal, vegetarian, etc." className={inputClass} />
      </FormField>
      <FormField label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="Any additional notes..."
          className={inputClass}
        />
      </FormField>
      <button
        onClick={() => {
          const { id, ...data } = form
          onSave(data)
        }}
        className="mt-2 w-full rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
      >
        Save
      </button>
    </Modal>
  )
}
