import {describe, expect, test} from '@jest/globals';
import { TestCase } from "./test-interface";
import { str_plural, str_slug } from "../src/utils/str-utils";


describe("StrUtilsTests", () => {
  const testCaseStrPlurals: TestCase[] = [{
    input: 'cat',
    output: 'cats'
  }, {
    input: 'Hotel_Booking_Reservation_Status',
    output: 'Hotel_Booking_Reservation_Statuses'
  }, {
    input: 'RPM_Reservation_Status',
    output: 'RPM_Reservation_Statuses'
  }, {
    input: 'Hotel_Booking',
    output: 'Hotel_Bookings'
  }, {
    input: 'HotelBookingReservationStatus',
    output: 'HotelBookingReservationStatuses'
  }, {
    input: 'child',
    output: 'children'
  }];

  testCaseStrPlurals.forEach((t, i) => {
    test(`should return ${t.output} when input=${t.input}`, () => {
      const result = str_plural(t.input);
      expect(result).toBe(t.output);
    });
  })
});