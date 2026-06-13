export type TimeSlot = {
  startsAt: Date
  endsAt: Date
}

export type WorkingHours = {
  startHour: number // 10
  startMinute: number // 0
  endHour: number // 20
  endMinute: number // 0
}

export type OccupiedPeriod = {
  startsAt: Date
  endsAt: Date
}

export type BreakTime = {
  id: string
  label: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

export type CalendarConfig = {
  workingStartHour: number
  workingStartMinute: number
  workingEndHour: number
  workingEndMinute: number
  slotDurationMinutes: number
  consultationDurationMinutes: number
  breaks: BreakTime[]
}
