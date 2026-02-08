import { AuthRepository } from "../repositories/AuthRepository";
import { BookingRepository } from "../repositories/BookingRepository";
import { CalendarRepository } from "../repositories/CalendarRepository";
import { AdminRepository } from "../repositories/AdminRepository";

export type RepositoryContainer = {
  auth: typeof AuthRepository;
  calendar: typeof CalendarRepository;
  booking: typeof BookingRepository;
  admin: typeof AdminRepository;
};

export const createRepositoryContainer = (): RepositoryContainer => ({
  auth: AuthRepository,
  calendar: CalendarRepository,
  booking: BookingRepository,
  admin: AdminRepository
});
