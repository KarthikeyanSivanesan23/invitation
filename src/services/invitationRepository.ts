import type { Blessing, RSVPInput, RSVPResponse } from '../lib/rsvp'

export interface InvitationRepository {
  saveRSVP(input: RSVPInput): Promise<RSVPResponse>
  getRSVP(): Promise<RSVPResponse | null>
  listBlessings(): Promise<Blessing[]>
  addBlessing(input: Pick<Blessing, 'name' | 'message'>): Promise<Blessing>
}

const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
function read(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown } catch { return null }
}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const validBlessing = (value: unknown): value is Blessing => isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.message === 'string' && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
const validResponse = (value: unknown): value is RSVPResponse => validBlessing(value) && isRecord(value) && typeof value.phone === 'string' && typeof value.guests === 'number' && ['yes', 'no'].includes(String(value.attendance)) && ['vegetarian', 'vegan', 'noPreference'].includes(String(value.meal))

/** Replace this adapter with a Supabase implementation of the same interface. */
export const invitationRepository: InvitationRepository = {
  async saveRSVP(input) {
    const response: RSVPResponse = { ...input, name: input.name.trim(), phone: input.phone.trim(), message: input.message.trim(), guests: input.attendance === 'yes' ? input.guests : 0, id: id(), createdAt: new Date().toISOString() }
    localStorage.setItem('wedding-rsvp-v1', JSON.stringify(response))
    return response
  },
  async getRSVP() { const response = read('wedding-rsvp-v1'); return validResponse(response) ? response : null },
  async listBlessings() { const values = read('wedding-blessings-v1'); return Array.isArray(values) ? values.filter(validBlessing).slice(0, 100) : [] },
  async addBlessing(input) {
    const blessing = { name: input.name.trim(), message: input.message.trim(), id: id(), createdAt: new Date().toISOString() }
    const current = await this.listBlessings()
    localStorage.setItem('wedding-blessings-v1', JSON.stringify([blessing, ...current].slice(0, 100)))
    return blessing
  },
}
