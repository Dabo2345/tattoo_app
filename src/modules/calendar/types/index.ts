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
