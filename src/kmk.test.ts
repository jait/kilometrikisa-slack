import {describe, expect, test} from '@jest/globals';
import * as kmk from './kmk';
import { TeamMemberStats } from './types';

describe('kmk', () => {

  test('topCyclist with empty stats', () => {
    const curr: TeamMemberStats = {distanceStatistics: [], timeStatistics: []};
    const prev: TeamMemberStats = null;
    expect(kmk.getTopCyclist(curr, prev)).toBe(null);
  });

  test('topCyclist with empty stats', () => {
    const curr: TeamMemberStats = {distanceStatistics: [], timeStatistics: []};
    const prev: TeamMemberStats = null;
    expect(kmk.getTopCyclist(curr, prev)).toBe(null);
  });

  test('topCyclist with empty prev stats', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 10, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 10, placement: 1, name: "biker1" },
        {distanceByRegularBike: 5, distanceByEbike: 1, totalCyclingDays: 2, totalDistance: 6, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker1',
      //score: 25,
      totalDistance: 10,
      distanceByRegularBike: 10,
      distanceByEbike: 0,
    });
  });

  test('topCyclist with stats', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 10.5, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 10, placement: 1, name: "biker1" },
        {distanceByRegularBike: 5, distanceByEbike: 1.2, totalCyclingDays: 2, totalDistance: 6, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 9, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 9, placement: 1, name: "biker1" },
        {distanceByRegularBike: 0, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 6, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker2',
      totalDistance: 6.2,
      distanceByRegularBike: 5,
      distanceByEbike: 1.2,
    });
  });

  test('topCyclist regular wins ebike', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 0, distanceByEbike: 20, totalCyclingDays: 2, totalDistance: 20, placement: 1, name: "biker1" },
        {distanceByRegularBike: 19, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 19, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 0, distanceByEbike: 1, totalCyclingDays: 1, totalDistance: 1, placement: 1, name: "biker1" },
        {distanceByRegularBike: 1, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 1, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker2',
      totalDistance: 18,
      distanceByRegularBike: 18,
      distanceByEbike: 0,
    });
  });
});